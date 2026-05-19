from django.contrib import admin
from .models import Course, Task, Document


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "course",
        "task_type",
        "deadline",
        "priority",
        "estimated_hours",
        "status",
    )

    list_filter = (
        "course",
        "task_type",
        "priority",
        "status",
        "deadline",
    )

    search_fields = (
        "title",
        "course__name",
    )
    
@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "course",
        "file",
        "uploaded_at",
    )

    list_filter = (
        "course",
        "uploaded_at",
    )

    search_fields = (
        "title",
        "course__name",
    )