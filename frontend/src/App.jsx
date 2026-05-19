import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000/api";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  const [taskCourseId, setTaskCourseId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("Reading");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskEstimatedHours, setTaskEstimatedHours] = useState("2");
  const [taskStatus, setTaskStatus] = useState("Not Started");

  const [availableHours, setAvailableHours] = useState("15");
  const [studyPlan, setStudyPlan] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [documentCourseId, setDocumentCourseId] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentFile, setDocumentFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [documentSummary, setDocumentSummary] = useState(null);
  const [documentQuestion, setDocumentQuestion] = useState("");
  const [documentAnswer, setDocumentAnswer] = useState(null);
  const [documentAiLoading, setDocumentAiLoading] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);

      const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard/`);
      const coursesResponse = await axios.get(`${API_BASE_URL}/courses/`);
      const tasksResponse = await axios.get(`${API_BASE_URL}/tasks/`);
      const documentsResponse = await axios.get(`${API_BASE_URL}/documents/`);

      setDashboard(dashboardResponse.data);
      setCourses(coursesResponse.data);
      setTasks(tasksResponse.data);
      setDocuments(documentsResponse.data);

      if (coursesResponse.data.length > 0 && !taskCourseId) {
        setTaskCourseId(String(coursesResponse.data[0].id));
      }

      if (coursesResponse.data.length > 0 && !documentCourseId) {
        setDocumentCourseId(String(coursesResponse.data[0].id));
      }

      if (documentsResponse.data.length > 0 && !selectedDocumentId) {
        setSelectedDocumentId(String(documentsResponse.data[0].id));
      }

      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load data from Django API.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCourse(event) {
    event.preventDefault();

    if (!courseName.trim()) {
      setErrorMessage("Please enter a course name.");
      setSuccessMessage("");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/courses/`, {
        name: courseName,
        description: courseDescription,
      });

      setCourseName("");
      setCourseDescription("");
      setSuccessMessage("Course created successfully.");
      setErrorMessage("");

      fetchData();
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not create course.");
      setSuccessMessage("");
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault();

    if (!taskCourseId) {
      setErrorMessage("Please create/select a course first.");
      setSuccessMessage("");
      return;
    }

    if (!taskTitle.trim()) {
      setErrorMessage("Please enter a task title.");
      setSuccessMessage("");
      return;
    }

    if (!taskDeadline) {
      setErrorMessage("Please choose a deadline.");
      setSuccessMessage("");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/tasks/`, {
        course: Number(taskCourseId),
        title: taskTitle,
        task_type: taskType,
        deadline: taskDeadline,
        priority: taskPriority,
        estimated_hours: taskEstimatedHours,
        status: taskStatus,
      });

      setTaskTitle("");
      setTaskType("Reading");
      setTaskDeadline("");
      setTaskPriority("Medium");
      setTaskEstimatedHours("2");
      setTaskStatus("Not Started");

      setSuccessMessage("Task created successfully.");
      setErrorMessage("");

      fetchData();
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not create task. Check the form values.");
      setSuccessMessage("");
    }
  }

  async function handleUpdateTaskStatus(task, newStatus) {
    try {
      await axios.patch(`${API_BASE_URL}/tasks/${task.id}/`, {
        status: newStatus,
      });

      setSuccessMessage("Task status updated successfully.");
      setErrorMessage("");

      fetchData();
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not update task status.");
      setSuccessMessage("");
    }
  }

  async function handleDeleteTask(taskId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}/`);

      setSuccessMessage("Task deleted successfully.");
      setErrorMessage("");

      fetchData();
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not delete task.");
      setSuccessMessage("");
    }
  }

  async function handleGenerateStudyPlan(event) {
    event.preventDefault();

    try {
      setAiLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await axios.post(`${API_BASE_URL}/study-plan/generate/`, {
        available_hours_per_week: Number(availableHours),
      });

      setStudyPlan(response.data);
      setSuccessMessage("AI study plan generated successfully.");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Could not generate study plan. Make sure you have tasks and your API key is configured."
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function handleUploadDocument(event) {
    event.preventDefault();

    if (!documentCourseId) {
      setErrorMessage("Please create/select a course first.");
      setSuccessMessage("");
      return;
    }

    if (!documentTitle.trim()) {
      setErrorMessage("Please enter a document title.");
      setSuccessMessage("");
      return;
    }

    if (!documentFile) {
      setErrorMessage("Please choose a PDF file.");
      setSuccessMessage("");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("course", Number(documentCourseId));
      formData.append("title", documentTitle);
      formData.append("file", documentFile);

      await axios.post(`${API_BASE_URL}/documents/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setDocumentTitle("");
      setDocumentFile(null);
      setSuccessMessage("Document uploaded successfully.");
      setErrorMessage("");

      fetchData();
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not upload document.");
      setSuccessMessage("");
    }
  }

  async function handleSummarizeDocument(event) {
  event.preventDefault();

  if (!selectedDocumentId) {
    setErrorMessage("Please upload/select a document first.");
    setSuccessMessage("");
    return;
  }

  try {
    setDocumentAiLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setDocumentSummary(null);

    const response = await axios.post(
      `${API_BASE_URL}/documents/${selectedDocumentId}/summarize/`,
      {}
    );

    setDocumentSummary(response.data);
    setSuccessMessage("Document summary generated successfully.");
  } catch (error) {
    console.error(error);
    setErrorMessage("Could not summarize document.");
    setSuccessMessage("");
  } finally {
    setDocumentAiLoading(false);
  }
}

async function handleAskDocument(event) {
  event.preventDefault();

  if (!selectedDocumentId) {
    setErrorMessage("Please upload/select a document first.");
    setSuccessMessage("");
    return;
  }

  if (!documentQuestion.trim()) {
    setErrorMessage("Please enter a question.");
    setSuccessMessage("");
    return;
  }

  try {
    setDocumentAiLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setDocumentAnswer(null);

    const response = await axios.post(
      `${API_BASE_URL}/documents/${selectedDocumentId}/ask/`,
      {
        question: documentQuestion,
      }
    );

    setDocumentAnswer(response.data);
    setSuccessMessage("Document answer generated successfully.");
  } catch (error) {
    console.error(error);
    setErrorMessage("Could not answer question about document.");
    setSuccessMessage("");
  } finally {
    setDocumentAiLoading(false);
  }
}

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <p className="loading">Loading study planner...</p>;
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>📚 AI Study Planner</h1>
          <p>
            React frontend connected to a Django REST backend for courses,
            tasks, documents, and AI study planning.
          </p>
        </div>
        <button onClick={fetchData}>Refresh Data</button>
      </header>

      {errorMessage && <div className="error">{errorMessage}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      {dashboard && (
        <section className="dashboard-grid">
          <MetricCard label="Courses" value={dashboard.total_courses} />
          <MetricCard label="Tasks" value={dashboard.total_tasks} />
          <MetricCard
            label="Estimated Hours"
            value={dashboard.total_estimated_hours}
          />
          <MetricCard label="Completed" value={dashboard.completed_tasks} />
          <MetricCard label="In Progress" value={dashboard.in_progress_tasks} />
          <MetricCard label="Not Started" value={dashboard.not_started_tasks} />
          <MetricCard label="Urgent" value={dashboard.urgent_tasks} />
          <MetricCard label="Overdue" value={dashboard.overdue_tasks} />
        </section>
      )}

      <main className="content-grid">
        <section className="card">
          <h2>📘 Courses</h2>

          <form className="form" onSubmit={handleCreateCourse}>
            <input
              type="text"
              placeholder="Course name"
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
            />

            <textarea
              placeholder="Course description"
              value={courseDescription}
              onChange={(event) => setCourseDescription(event.target.value)}
            />

            <button type="submit">Add Course</button>
          </form>

          {courses.length === 0 ? (
            <p>No courses found.</p>
          ) : (
            <div className="list">
              {courses.map((course) => (
                <div className="list-item" key={course.id}>
                  <h3>{course.name}</h3>
                  <p>{course.description || "No description"}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>✅ Add Task</h2>

          {courses.length === 0 ? (
            <p>Please create a course before adding tasks.</p>
          ) : (
            <form className="form" onSubmit={handleCreateTask}>
              <select
                value={taskCourseId}
                onChange={(event) => setTaskCourseId(event.target.value)}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Task title"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
              />

              <select
                value={taskType}
                onChange={(event) => setTaskType(event.target.value)}
              >
                <option value="Reading">Reading</option>
                <option value="Assignment">Assignment</option>
                <option value="Exam preparation">Exam preparation</option>
                <option value="Project">Project</option>
                <option value="Lecture review">Lecture review</option>
                <option value="Other">Other</option>
              </select>

              <input
                type="date"
                value={taskDeadline}
                onChange={(event) => setTaskDeadline(event.target.value)}
              />

              <select
                value={taskPriority}
                onChange={(event) => setTaskPriority(event.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <input
                type="number"
                min="0.5"
                step="0.5"
                value={taskEstimatedHours}
                onChange={(event) => setTaskEstimatedHours(event.target.value)}
              />

              <select
                value={taskStatus}
                onChange={(event) => setTaskStatus(event.target.value)}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <button type="submit">Add Task</button>
            </form>
          )}
        </section>
      </main>

      <section className="card full-width">
        <h2>📋 Saved Tasks</h2>

        {tasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <div className="task-item" key={task.id}>
                <div>
                  <h3>{task.title}</h3>
                  <p>
                    {task.course_name} • {task.task_type} •{" "}
                    {task.estimated_hours}h
                  </p>
                  <p>Deadline: {task.deadline}</p>
                </div>

                <div className="task-badges">
                  <span className={`urgency ${getUrgencyClass(task.urgency)}`}>
                    {task.urgency}
                  </span>

                  <select
                    className="status-select"
                    value={task.status}
                    onChange={(event) =>
                      handleUpdateTaskStatus(task, event.target.value)
                    }
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <span className="priority">{task.priority}</span>

                  <button
                    className="delete-button"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card full-width">
        <h2>🧠 AI Weekly Study Plan</h2>

        <form className="form inline-form" onSubmit={handleGenerateStudyPlan}>
          <label>
            Available study hours this week
            <input
              type="number"
              min="1"
              max="60"
              value={availableHours}
              onChange={(event) => setAvailableHours(event.target.value)}
            />
          </label>

          <button type="submit" disabled={aiLoading}>
            {aiLoading ? "Generating..." : "Generate Study Plan"}
          </button>
        </form>

        {studyPlan && (
          <div className="study-plan">
            <h3>Overview</h3>
            <p>{studyPlan.overview}</p>

            <h3>Daily Plan</h3>
            <ul>
              {studyPlan.daily_plan.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3>Priority Advice</h3>
            <ul>
              {studyPlan.priority_advice.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3>Risk Warnings</h3>
            <ul>
              {studyPlan.risk_warnings.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="card full-width">
  <h2>📄 Documents</h2>

  {courses.length === 0 ? (
    <p>Please create a course before uploading documents.</p>
  ) : (
    <form className="form document-form" onSubmit={handleUploadDocument}>
      <select
        value={documentCourseId}
        onChange={(event) => setDocumentCourseId(event.target.value)}
      >
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Document title"
        value={documentTitle}
        onChange={(event) => setDocumentTitle(event.target.value)}
      />

      <input
        type="file"
        accept="application/pdf"
        onChange={(event) => setDocumentFile(event.target.files[0])}
      />

      <button type="submit">Upload PDF</button>
    </form>
  )}

  <h3>Uploaded Documents</h3>

  {documents.length === 0 ? (
    <p>No documents uploaded yet.</p>
  ) : (
    <>
      <div className="document-list">
        {documents.map((document) => (
          <div className="document-item" key={document.id}>
            <div>
              <h3>{document.title}</h3>
              <p>
                {document.course_name} • Uploaded:{" "}
                {new Date(document.uploaded_at).toLocaleString()}
              </p>
            </div>

            <a
              href={document.file}
              target="_blank"
              rel="noreferrer"
              className="document-link"
            >
              Open PDF
            </a>
          </div>
        ))}
      </div>

      <div className="document-ai-panel">
        <h3>🧠 Document Assistant</h3>

        <form className="form document-form" onSubmit={handleSummarizeDocument}>
          <label>
            Select document
            <select
              value={selectedDocumentId}
              onChange={(event) => {
                setSelectedDocumentId(event.target.value);
                setDocumentSummary(null);
                setDocumentAnswer(null);
              }}
            >
              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={documentAiLoading}>
            {documentAiLoading ? "Working..." : "Summarize Document"}
          </button>
        </form>

        {documentSummary && (
          <div className="ai-result">
            <h3>{documentSummary.title}</h3>

            <h4>Summary</h4>
            <p>{documentSummary.summary}</p>

            <h4>Key Concepts</h4>
            <ul>
              {documentSummary.key_concepts.map((concept, index) => (
                <li key={index}>{concept}</li>
              ))}
            </ul>

            <h4>Possible Exam Questions</h4>
            <ul>
              {documentSummary.possible_exam_questions.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ul>

            <h4>Study Tips</h4>
            <ul>
              {documentSummary.study_tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <form className="form document-form" onSubmit={handleAskDocument}>
          <label>
            Ask a question about the selected document
            <textarea
              placeholder="Example: What are the main topics in this lecture?"
              value={documentQuestion}
              onChange={(event) => setDocumentQuestion(event.target.value)}
            />
          </label>

          <button type="submit" disabled={documentAiLoading}>
            {documentAiLoading ? "Working..." : "Ask Document"}
          </button>
        </form>

        {documentAnswer && (
          <div className="ai-result">
            <h3>Answer</h3>
            <p>{documentAnswer.answer}</p>

            <h4>Key Points</h4>
            <ul>
              {documentAnswer.key_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>

            <h4>Page References</h4>
            <ul>
              {documentAnswer.page_references.map((page, index) => (
                <li key={index}>{page}</li>
              ))}
            </ul>

            <h4>Study Tips</h4>
            <ul>
              {documentAnswer.study_tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )}
</section>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

function getUrgencyClass(urgency) {
  if (urgency === "Overdue") return "overdue";
  if (urgency === "Due Today") return "today";
  if (urgency === "Urgent") return "urgent";
  if (urgency === "Soon") return "soon";
  return "later";
}

export default App;