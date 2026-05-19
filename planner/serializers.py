from datetime import date
from rest_framework import serializers
from .models import Course, Task, Document


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "description",
            "created_at",
        ]


class TaskSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)
    urgency = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "course",
            "course_name",
            "title",
            "task_type",
            "deadline",
            "priority",
            "estimated_hours",
            "status",
            "urgency",
            "created_at",
        ]

    def get_urgency(self, obj):
        days_left = (obj.deadline - date.today()).days

        if days_left < 0:
            return "Overdue"
        if days_left == 0:
            return "Due Today"
        if days_left <= 3:
            return "Urgent"
        if days_left <= 7:
            return "Soon"

        return "Later"
    
class DocumentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "course",
            "course_name",
            "title",
            "file",
            "uploaded_at",
        ]