import os
from pathlib import Path

from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class DocumentSummary(BaseModel):
    title: str = Field(description="A suitable title for the document.")
    summary: str = Field(description="A clear summary of the document.")
    key_concepts: list[str] = Field(description="Important concepts from the document.")
    possible_exam_questions: list[str] = Field(description="Possible exam or review questions.")
    study_tips: list[str] = Field(description="Study tips for this document.")


class DocumentAnswer(BaseModel):
    answer: str = Field(description="Answer to the user's question based on the document.")
    key_points: list[str] = Field(description="Important points from the document.")
    page_references: list[str] = Field(description="Relevant page references if available.")
    study_tips: list[str] = Field(description="Study tips based on the document content.")


class StudyPlan(BaseModel):
    overview: str = Field(description="A short overview of the study plan.")
    daily_plan: list[str] = Field(description="A day-by-day study plan.")
    priority_advice: list[str] = Field(description="Advice about task priorities.")
    risk_warnings: list[str] = Field(description="Warnings about deadlines or overloaded days.")


def get_llm():
    """
    Create the Claude model.
    """

    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY was not found. Make sure your .env file is next to manage.py."
        )

    return ChatAnthropic(
        model="claude-sonnet-4-6",
        temperature=0,
        api_key=api_key,
    )


def limit_text(text: str, max_chars: int = 18000) -> str:
    """
    Limit document text before sending it to the AI.
    This keeps requests smaller and cheaper.
    """

    if len(text) <= max_chars:
        return text

    return text[:max_chars]


def summarize_document_with_ai(document_text: str) -> DocumentSummary:
    """
    Summarize a document using Claude.
    """

    llm = get_llm()
    structured_llm = llm.with_structured_output(DocumentSummary)

    limited_text = limit_text(document_text)

    prompt = f"""
You are a study assistant.

Summarize this lecture or study document.

Rules:
1. Create a clear summary.
2. Extract the most important concepts.
3. Generate possible exam or review questions.
4. Give practical study tips.
5. Use student-friendly language.

Document text:
{limited_text}
"""

    return structured_llm.invoke(prompt)


def ask_document_with_ai(document_text: str, question: str) -> DocumentAnswer:
    """
    Answer a question based on document text using Claude.
    """

    llm = get_llm()
    structured_llm = llm.with_structured_output(DocumentAnswer)

    limited_text = limit_text(document_text)

    prompt = f"""
You are a study document assistant.

Answer the user's question using only the document text below.

Rules:
1. Use only the document text.
2. If the answer is not found in the document, say that clearly.
3. Mention relevant page references if available.
4. Explain in clear student-friendly language.
5. Add practical study tips.

Document text:
{limited_text}

Question:
{question}
"""

    return structured_llm.invoke(prompt)


def generate_study_plan_with_ai(tasks_text: str, available_hours_per_week: int) -> StudyPlan:
    """
    Generate a weekly study plan from task data.
    """

    llm = get_llm()
    structured_llm = llm.with_structured_output(StudyPlan)

    prompt = f"""
You are an AI study planner for a university student.

Create a realistic weekly study plan based on the tasks below.

Rules:
1. Prioritize tasks with closer deadlines.
2. Prioritize high-priority tasks.
3. Do not overload the student.
4. The student has {available_hours_per_week} hours available this week.
5. Give practical daily study suggestions.
6. Mention deadline risks clearly.
7. Keep the plan realistic and easy to follow.

Tasks:
{tasks_text}
"""

    return structured_llm.invoke(prompt)