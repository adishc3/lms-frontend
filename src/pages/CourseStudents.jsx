import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { ClipboardList, PlusCircle, Download, BookOpen } from "lucide-react"

export default function CourseStudents() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("assignments") // "assignments" | "quizzes"
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [showCreateQuiz, setShowCreateQuiz] = useState(false)
  const [assignForm, setAssignForm] = useState({ title: "", description: "", due_date: "", max_score: "" })
  const [quizForm, setQuizForm] = useState({ title: "", description: "", questions: [{ text: "", options: [{ text: "", is_correct: false }, { text: "", is_correct: false }] }] })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState("")

  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")

  useEffect(() => {
    if (!token) { navigate("/login"); return }
    const load = async () => {
      try {
        const [courseRes, assignRes, quizRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/assignments/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/quizzes/course/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (courseRes.ok) setCourse(await courseRes.json())
        if (assignRes.ok) setAssignments(await assignRes.json())
        if (quizRes.ok) setQuizzes(await quizRes.json())
      } catch {
        setError("Failed to load course data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, navigate, token])

  const handleCreateAssignment = async (e) => {
    e.preventDefault()
    setSaveError("")
    setSaveSuccess("")
    setSaving(true)
    try {
      const payload = {
        title: assignForm.title,
        description: assignForm.description || null,
        due_date: assignForm.due_date ? new Date(assignForm.due_date).toISOString() : null,
        max_score: assignForm.max_score ? Number(assignForm.max_score) : null,
      }
      const res = await fetch(`/api/assignments/courses/${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to create assignment")
      setAssignments((prev) => [...prev, data])
      setSaveSuccess("Assignment created!")
      setAssignForm({ title: "", description: "", due_date: "", max_score: "" })
      setTimeout(() => { setShowCreateAssignment(false); setSaveSuccess("") }, 1200)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const addQuizOption = (qi) => {
    setQuizForm((prev) => {
      const questions = [...prev.questions]
      questions[qi] = { ...questions[qi], options: [...questions[qi].options, { text: "", is_correct: false }] }
      return { ...prev, questions }
    })
  }

  const addQuizQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { text: "", options: [{ text: "", is_correct: false }, { text: "", is_correct: false }] }],
    }))
  }

  const updateQuestion = (qi, field, value) => {
    setQuizForm((prev) => {
      const questions = [...prev.questions]
      questions[qi] = { ...questions[qi], [field]: value }
      return { ...prev, questions }
    })
  }

  const updateOption = (qi, oi, field, value) => {
    setQuizForm((prev) => {
      const questions = [...prev.questions]
      const options = [...questions[qi].options]
      if (field === "is_correct") {
        // Only one correct answer per question
        options.forEach((o, i) => { options[i] = { ...o, is_correct: i === oi } })
      } else {
        options[oi] = { ...options[oi], [field]: value }
      }
      questions[qi] = { ...questions[qi], options }
      return { ...prev, questions }
    })
  }

  const handleCreateQuiz = async (e) => {
    e.preventDefault()
    setSaveError("")
    setSaveSuccess("")
    setSaving(true)
    try {
      const payload = {
        title: quizForm.title,
        description: quizForm.description || null,
        course_id: Number(courseId),
        questions: quizForm.questions,
      }
      const res = await fetch("/api/quizzes/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to create quiz")
      setQuizzes((prev) => [...prev, data])
      setSaveSuccess("Quiz created!")
      setQuizForm({ title: "", description: "", questions: [{ text: "", options: [{ text: "", is_correct: false }, { text: "", is_correct: false }] }] })
      setTimeout(() => { setShowCreateQuiz(false); setSaveSuccess("") }, 1200)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#60A5FA] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">Instructor View</p>
            <h1 className="text-2xl font-bold">{course?.title}</h1>
            <p className="text-slate-400 mt-1">Manage assignments and quizzes for this course</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>← Back to Course</Button>
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-300">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
          {[
            { id: "assignments", label: "Assignments", icon: ClipboardList },
            { id: "quizzes", label: "Quizzes", icon: BookOpen },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-[#60A5FA] text-slate-950" : "text-slate-400 hover:text-white"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Assignments tab */}
        {tab === "assignments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Assignments ({assignments.length})</h2>
              <div className="flex gap-2">
                <a href={`/api/assignments/courses/${courseId}/gradebook`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Gradebook
                  </Button>
                </a>
                <Button size="sm" className="gap-2" onClick={() => setShowCreateAssignment(!showCreateAssignment)}>
                  <PlusCircle className="w-4 h-4" />
                  New Assignment
                </Button>
              </div>
            </div>

            {showCreateAssignment && (
              <Card className="bg-slate-900/70 border-[#60A5FA]/30">
                <CardHeader>
                  <CardTitle className="text-lg">Create Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAssignment} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300 block mb-1">Title *</label>
                      <input value={assignForm.title} onChange={(e) => setAssignForm((p) => ({ ...p, title: e.target.value }))} required
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA]" placeholder="Assignment title" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300 block mb-1">Description</label>
                      <textarea value={assignForm.description} onChange={(e) => setAssignForm((p) => ({ ...p, description: e.target.value }))} rows={3}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA] resize-none" placeholder="Assignment instructions..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300 block mb-1">Due Date</label>
                        <input type="datetime-local" value={assignForm.due_date} onChange={(e) => setAssignForm((p) => ({ ...p, due_date: e.target.value }))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA]" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300 block mb-1">Max Score</label>
                        <input type="number" min={1} value={assignForm.max_score} onChange={(e) => setAssignForm((p) => ({ ...p, max_score: e.target.value }))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA]" placeholder="100" />
                      </div>
                    </div>
                    {saveError && <div className="rounded-xl bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-300">{saveError}</div>}
                    {saveSuccess && <div className="rounded-xl bg-green-500/10 border border-green-800 px-4 py-3 text-sm text-green-300">{saveSuccess}</div>}
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowCreateAssignment(false)}>Cancel</Button>
                      <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Assignment"}</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {assignments.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">No assignments yet. Create one above.</p>
                </CardContent>
              </Card>
            ) : (
              assignments.map((a) => (
                <Card key={a.id} className="bg-slate-900/70 border-slate-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{a.title}</CardTitle>
                        {a.description && <CardDescription className="mt-1">{a.description}</CardDescription>}
                        <div className="flex gap-4 mt-2 text-sm text-slate-500">
                          {a.due_date && <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                          {a.max_score && <span>Max: {a.max_score} pts</span>}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Quizzes tab */}
        {tab === "quizzes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Quizzes ({quizzes.length})</h2>
              <Button size="sm" className="gap-2" onClick={() => setShowCreateQuiz(!showCreateQuiz)}>
                <PlusCircle className="w-4 h-4" />
                New Quiz
              </Button>
            </div>

            {showCreateQuiz && (
              <Card className="bg-slate-900/70 border-[#60A5FA]/30">
                <CardHeader>
                  <CardTitle className="text-lg">Create Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateQuiz} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-300 block mb-1">Quiz Title *</label>
                        <input value={quizForm.title} onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))} required
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA]" placeholder="Quiz title" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300 block mb-1">Description</label>
                        <input value={quizForm.description} onChange={(e) => setQuizForm((p) => ({ ...p, description: e.target.value }))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA]" placeholder="Optional description" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-200">Questions</h3>
                        <Button type="button" size="sm" variant="outline" onClick={addQuizQuestion}>+ Add Question</Button>
                      </div>
                      {quizForm.questions.map((q, qi) => (
                        <div key={qi} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4 space-y-3">
                          <div>
                            <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Question {qi + 1}</label>
                            <input value={q.text} onChange={(e) => updateQuestion(qi, "text", e.target.value)} required
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white text-sm outline-none focus:border-[#60A5FA]" placeholder="Enter question text" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-slate-500 uppercase tracking-widest block">Options (select correct answer)</label>
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${qi}`}
                                  checked={opt.is_correct}
                                  onChange={() => updateOption(qi, oi, "is_correct", true)}
                                  className="accent-[#60A5FA]"
                                />
                                <input value={opt.text} onChange={(e) => updateOption(qi, oi, "text", e.target.value)} required
                                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white text-sm outline-none focus:border-[#60A5FA]" placeholder={`Option ${oi + 1}`} />
                              </div>
                            ))}
                            <button type="button" onClick={() => addQuizOption(qi)} className="text-xs text-[#60A5FA] hover:underline">+ Add option</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {saveError && <div className="rounded-xl bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-300">{saveError}</div>}
                    {saveSuccess && <div className="rounded-xl bg-green-500/10 border border-green-800 px-4 py-3 text-sm text-green-300">{saveSuccess}</div>}
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowCreateQuiz(false)}>Cancel</Button>
                      <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Quiz"}</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {quizzes.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">No quizzes yet. Create one above.</p>
                </CardContent>
              </Card>
            ) : (
              quizzes.map((quiz) => (
                <Card key={quiz.id} className="bg-slate-900/70 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    {quiz.description && <CardDescription>{quiz.description}</CardDescription>}
                    <p className="text-sm text-slate-500 mt-1">{quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}</p>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
