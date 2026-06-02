import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { ClipboardList, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react"
import apiFetch from "@/lib/api"

export default function Assignments() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [course, setCourse] = useState(null)
  const [submissions, setSubmissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeAssignment, setActiveAssignment] = useState(null)
  const [submitContent, setSubmitContent] = useState("")
  const [submitFile, setSubmitFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")

  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")

  useEffect(() => {
    if (!token) { navigate("/login"); return }
    const load = async () => {
      try {
        const [courseRes, assignRes] = await Promise.all([
          apiFetch(`/api/courses/${courseId}`),
          apiFetch(`/api/assignments/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (courseRes.ok) setCourse(await courseRes.json())
        if (!assignRes.ok) {
          const d = await assignRes.json()
          setError(d.detail || "Failed to load assignments")
          return
        }
        const assignData = await assignRes.json()
        setAssignments(assignData)

        // Fetch my submission for each assignment
        const subMap = {}
        await Promise.all(
          assignData.map(async (a) => {
            try {
              const res = await apiFetch(`/api/assignments/${a.id}/my-submission`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (res.ok) {
                const sub = await res.json()
                subMap[a.id] = sub
              }
            } catch {}
          })
        )
        setSubmissions(subMap)
      } catch {
        setError("Unable to connect to the server")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, navigate, token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitSuccess("")
    if (!submitContent && !submitFile) {
      setSubmitError("Please provide text content or upload a file.")
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      if (submitContent) formData.append("content", submitContent)
      if (submitFile) formData.append("file", submitFile)

      const res = await apiFetch(`/api/assignments/${activeAssignment.id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Submission failed")
      setSubmitSuccess("Assignment submitted successfully!")
      setSubmissions((prev) => ({ ...prev, [activeAssignment.id]: data }))
      setSubmitContent("")
      setSubmitFile(null)
      setTimeout(() => { setActiveAssignment(null); setSubmitSuccess("") }, 1500)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDueDate = (dateStr) => {
    if (!dateStr) return "No due date"
    const d = new Date(dateStr)
    const now = new Date()
    const diff = d - now
    if (diff < 0) return `Overdue (${d.toLocaleDateString()})`
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Due today"
    if (days === 1) return "Due tomorrow"
    return `Due in ${days} days (${d.toLocaleDateString()})`
  }

  const getDueDateColor = (dateStr) => {
    if (!dateStr) return "text-slate-400"
    const diff = new Date(dateStr) - new Date()
    if (diff < 0) return "text-red-400"
    if (diff < 86400000 * 2) return "text-yellow-400"
    return "text-green-400"
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

  // Submit form
  if (activeAssignment) {
    const existing = submissions[activeAssignment.id]
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">{course?.title}</p>
            <h1 className="text-2xl font-bold">{activeAssignment.title}</h1>
            {activeAssignment.description && (
              <p className="text-slate-400 mt-2">{activeAssignment.description}</p>
            )}
            <p className={`text-sm mt-2 font-medium ${getDueDateColor(activeAssignment.due_date)}`}>
              {formatDueDate(activeAssignment.due_date)}
            </p>
            {activeAssignment.max_score && (
              <p className="text-sm text-slate-500 mt-1">Max score: {activeAssignment.max_score} points</p>
            )}
          </div>

          {existing ? (
            <Card className="bg-slate-900/70 border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <CardTitle className="text-lg text-green-400">Already Submitted</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {existing.content && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Your answer</p>
                    <p className="text-slate-300 bg-slate-950/50 rounded-xl p-3 text-sm">{existing.content}</p>
                  </div>
                )}
                {existing.file_path && (
                  <p className="text-sm text-slate-400">File submitted: {existing.file_path.split("/").pop()}</p>
                )}
                {existing.grade !== null && existing.grade !== undefined ? (
                  <div className="rounded-xl bg-green-900/20 border border-green-800 p-4">
                    <p className="text-sm font-semibold text-green-400">Grade: {existing.grade}{activeAssignment.max_score ? ` / ${activeAssignment.max_score}` : ""}</p>
                    {existing.feedback && <p className="text-sm text-slate-300 mt-1">Feedback: {existing.feedback}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Awaiting grade from instructor.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-900/70 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Submit Your Work</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">Written answer (optional)</label>
                    <textarea
                      value={submitContent}
                      onChange={(e) => setSubmitContent(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white text-sm outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/20 resize-none"
                      placeholder="Write your answer here..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">Upload file (optional)</label>
                    <input
                      type="file"
                      onChange={(e) => setSubmitFile(e.target.files[0])}
                      className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#60A5FA]/10 file:text-[#60A5FA] hover:file:bg-[#60A5FA]/20"
                    />
                  </div>
                  {submitError && <div className="rounded-xl bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-300">{submitError}</div>}
                  {submitSuccess && <div className="rounded-xl bg-green-500/10 border border-green-800 px-4 py-3 text-sm text-green-300">{submitSuccess}</div>}
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setActiveAssignment(null)}>Cancel</Button>
                    <Button type="submit" disabled={submitting} className="gap-2">
                      <Upload className="w-4 h-4" />
                      {submitting ? "Submitting..." : "Submit Assignment"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">{course?.title}</p>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-slate-400 mt-1">Complete and submit your assignments</p>
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-300">{error}</div>}

        {assignments.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-16 text-center">
              <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No assignments for this course yet.</p>
              <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>Back to Course</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const sub = submissions[assignment.id]
              const isSubmitted = !!sub
              const isGraded = sub?.grade !== null && sub?.grade !== undefined
              return (
                <Card key={assignment.id} className="bg-slate-900/70 border-slate-800 hover:border-[#60A5FA]/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isGraded ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900/40 text-green-400 border border-green-800">Graded</span>
                          ) : isSubmitted ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-400 border border-blue-800">Submitted</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">Pending</span>
                          )}
                        </div>
                        <CardTitle className="text-xl">{assignment.title}</CardTitle>
                        {assignment.description && (
                          <CardDescription className="mt-1 line-clamp-2">{assignment.description}</CardDescription>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`text-sm font-medium flex items-center gap-1 ${getDueDateColor(assignment.due_date)}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {formatDueDate(assignment.due_date)}
                          </span>
                          {assignment.max_score && (
                            <span className="text-sm text-slate-500">{assignment.max_score} pts</span>
                          )}
                          {isGraded && (
                            <span className="text-sm font-semibold text-green-400">
                              Score: {sub.grade}{assignment.max_score ? ` / ${assignment.max_score}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => setActiveAssignment(assignment)}
                        variant={isSubmitted ? "outline" : "default"}
                        size="sm"
                        className="shrink-0"
                      >
                        {isGraded ? "View Grade" : isSubmitted ? "View Submission" : "Submit"}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        )}

        <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>← Back to Course</Button>
      </div>
    </Layout>
  )
}
