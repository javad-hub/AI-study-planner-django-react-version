from datetime import date

from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Course, Task, Document
from .serializers import CourseSerializer, TaskSerializer, DocumentSerializer
from .pdf_utils import extract_text_from_pdf_path
from .ai_services import (
    summarize_document_with_ai,
    ask_document_with_ai,
    generate_study_plan_with_ai,
)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by("-created_at")
    serializer_class = CourseSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by("deadline")
    serializer_class = TaskSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().order_by("-uploaded_at")
    serializer_class = DocumentSerializer


def get_task_urgency(task):
    days_left = (task.deadline - date.today()).days

    if days_left < 0:
        return "Overdue"
    if days_left == 0:
        return "Due Today"
    if days_left <= 3:
        return "Urgent"
    if days_left <= 7:
        return "Soon"

    return "Later"


@api_view(["GET"])
def dashboard_summary(request):
    courses = Course.objects.all()
    tasks = Task.objects.all()

    total_courses = courses.count()
    total_tasks = tasks.count()

    completed_tasks = tasks.filter(status="Completed").count()
    in_progress_tasks = tasks.filter(status="In Progress").count()
    not_started_tasks = tasks.filter(status="Not Started").count()

    total_estimated_hours = 0
    urgent_tasks = 0
    overdue_tasks = 0

    for task in tasks:
        total_estimated_hours += float(task.estimated_hours)

        urgency = get_task_urgency(task)

        if urgency in ["Due Today", "Urgent"]:
            urgent_tasks += 1

        if urgency == "Overdue":
            overdue_tasks += 1

    data = {
        "total_courses": total_courses,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "in_progress_tasks": in_progress_tasks,
        "not_started_tasks": not_started_tasks,
        "urgent_tasks": urgent_tasks,
        "overdue_tasks": overdue_tasks,
        "total_estimated_hours": total_estimated_hours,
    }

    return Response(data)


@api_view(["POST"])
def generate_study_plan(request):
    available_hours = request.data.get("available_hours_per_week", 15)

    tasks = Task.objects.all().order_by("deadline")

    if not tasks.exists():
        return Response(
            {"error": "No tasks found. Please add tasks first."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    task_lines = []

    for task in tasks:
        task_lines.append(
            f"Course: {task.course.name}, "
            f"Task: {task.title}, "
            f"Type: {task.task_type}, "
            f"Deadline: {task.deadline}, "
            f"Priority: {task.priority}, "
            f"Estimated hours: {task.estimated_hours}, "
            f"Status: {task.status}, "
            f"Urgency: {get_task_urgency(task)}"
        )

    tasks_text = "\n".join(task_lines)

    plan = generate_study_plan_with_ai(
        tasks_text=tasks_text,
        available_hours_per_week=int(available_hours),
    )

    return Response(plan.model_dump())


@api_view(["POST"])
def summarize_document(request, document_id):
    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        return Response(
            {"error": "Document not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    document_text = extract_text_from_pdf_path(document.file.path)

    if not document_text:
        return Response(
            {"error": "Could not extract text from this PDF."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    summary = summarize_document_with_ai(document_text)

    return Response(summary.model_dump())


@api_view(["POST"])
def ask_document(request, document_id):
    question = request.data.get("question", "")

    if not question.strip():
        return Response(
            {"error": "Question is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        return Response(
            {"error": "Document not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    document_text = extract_text_from_pdf_path(document.file.path)

    if not document_text:
        return Response(
            {"error": "Could not extract text from this PDF."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    answer = ask_document_with_ai(
        document_text=document_text,
        question=question,
    )

    return Response(answer.model_dump())