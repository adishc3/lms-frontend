import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { CheckCircle, XCircle, ChevronRight, Trophy } from "lucide-react"

export default function Quizzes() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")

  useEffect(() => {
    if (!token) { navigate("/login"); return }
    const load = async () => {
      try {
        const [courseRes, quizzesRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/quizzes/course/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (courseRes.ok) setCourse(await courseRes.json())
        if (quizzesRes.ok) setQuizzes(await quizzesRes.json())
        else {
          const d = await quizzesRes.json()
          setError(d.detail || "Failed to load quizzes")
        }
      } catch {
        setError("Unable to connect to the server")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, navigate, token])

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz)
    setAnswers({})
    setResult(null)
  }

  const selectAnswer = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const submitQuiz = async () => {
    if (!activeQuiz) return
    const unanswered = activeQuiz.questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0) {
      setError(`Please answer all questions (${unanswered.length} remaining)`)
      return
    }
    setError("")
    setSubmitting(true)
    try {
      const payload = {
        answers: Object.entries(answers).map(([question_id, selected_option_id]) => ({
          question_id: Number(question_id),
          selected_option_id: Number(selected_option_id),
        })),
      }
      const res = await fetch(`/api/quizzes/${activeQuiz.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to submit quiz")
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
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

  // Quiz result screen
  if (result) {
    const percent = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <Card className="bg-slate-900/70 border-slate-800 text-center p-8">
            <div className="flex justify-center mb-4">
              <Trophy className={`w-16 h-16 ${percent >= 70 ? "text-yellow-400" : "text-slate-500"}`} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-slate-400 mb-6">{activeQuiz?.title}</p>
            <div className="text-6xl font-bold mb-2 text-[#60A5FA]">{percent}%</div>
            <p className="text-slate-400 mb-8">{result.score} / {result.total} correct</p>

            <div className="space-y-3 text-left mb-8">
              {result.answers?.map((a, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${a.is_correct ? "border-green-800 bg-green-900/20" : "border-red-800 bg-red-900/20"}`}>
                  {a.is_correct ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                  <span className="text-sm text-slate-300">Question {i + 1}: {a.is_correct ? "Correct" : "Incorrect"}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setResult(null); setActiveQuiz(null) }}>Back to Quizzes</Button>
              <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>Back to Course</Button>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  // Active quiz screen
  if (activeQuiz) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-widest">{course?.title}</p>
              <h1 className="text-2xl font-bold">{activeQuiz.title}</h1>
            </div>
            <Button variant="outline" onClick={() => setActiveQuiz(null)}>Cancel</Button>
          </div>

          {error && <div className="rounded-xl bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-300">{error}</div>}

          <div className="space-y-6">
            {activeQuiz.questions.map((question, qi) => (
              <Card key={question.id} className="bg-slate-900/70 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">
                    <span className="text-[#60A5FA] mr-2">Q{qi + 1}.</span>
                    {question.text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {question.options.map((option) => {
                    const selected = answers[question.id] === option.id
                    return (
                      <button
                        key={option.id}
                        onClick={() => selectAnswer(question.id, option.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          selected
                            ? "border-[#60A5FA] bg-[#60A5FA]/10 text-white"
                            : "border-slate-700 bg-slate-950/50 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {option.text}
                      </button>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-slate-400">
              {Object.keys(answers).length} / {activeQuiz.questions.length} answered
            </p>
            <Button
              onClick={submitQuiz}
              disabled={submitting || Object.keys(answers).length < activeQuiz.questions.length}
              className="bg-[#60A5FA] text-slate-950 hover:bg-[#60A5FA]/90"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  // Quiz list screen
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">{course?.title}</p>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-slate-400 mt-1">Test your knowledge with these quizzes</p>
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-300">{error}</div>}

        {quizzes.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-16 text-center">
              <p className="text-slate-400 mb-4">No quizzes available for this course yet.</p>
              <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>Back to Course</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="bg-slate-900/70 border-slate-800 hover:border-[#60A5FA]/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{quiz.title}</CardTitle>
                      {quiz.description && <CardDescription className="mt-1">{quiz.description}</CardDescription>}
                      <p className="text-sm text-slate-500 mt-2">{quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}</p>
                    </div>
                    <Button onClick={() => startQuiz(quiz)} className="gap-2">
                      Start Quiz <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>← Back to Course</Button>
      </div>
    </Layout>
  )
}
