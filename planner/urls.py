from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CourseViewSet,
    TaskViewSet,
    DocumentViewSet,
    dashboard_summary,
    generate_study_plan,
    summarize_document,
    ask_document,
)


router = DefaultRouter()
router.register("courses", CourseViewSet, basename="course")
router.register("tasks", TaskViewSet, basename="task")
router.register("documents", DocumentViewSet, basename="document")


urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/", dashboard_summary, name="dashboard-summary"),
    path("study-plan/generate/", generate_study_plan, name="generate-study-plan"),
    path("documents/<int:document_id>/summarize/", summarize_document, name="summarize-document"),
    path("documents/<int:document_id>/ask/", ask_document, name="ask-document"),
]