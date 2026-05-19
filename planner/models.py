from django.db import models


class Course(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Task(models.Model):
    TASK_TYPES = [
        ("Reading", "Reading"),
        ("Assignment", "Assignment"),
        ("Exam preparation", "Exam preparation"),
        ("Project", "Project"),
        ("Lecture review", "Lecture review"),
        ("Other", "Other"),
    ]

    PRIORITY_CHOICES = [
        ("Low", "Low"),
        ("Medium", "Medium"),
        ("High", "High"),
    ]

    STATUS_CHOICES = [
        ("Not Started", "Not Started"),
        ("In Progress", "In Progress"),
        ("Completed", "Completed"),
    ]

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="tasks"
    )

    title = models.CharField(max_length=250)
    task_type = models.CharField(max_length=50, choices=TASK_TYPES)
    deadline = models.DateField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="Not Started"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.course.name}"
    
class Document(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    title = models.CharField(max_length=250)
    file = models.FileField(upload_to="documents/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.course.name}"