import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { Brain, Send, Sparkles, BookOpen, Loader2 } from "lucide-react"
import apiFetch from "@/lib/api"

// Retry logic with exponential backoff for API calls
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await apiFetch(url, options)
      if (res.status === 503 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      return res
    } catch (err) {
      if (attempt === maxRetries - 1) throw err
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

export default function AIAssistant() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedLesson, setSelectedLesson] = useState("")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState("study") // "study" | "quiz"
  const [questionCount, setQuestionCount] = useState(5)
  const [quizResult, setQuizResult] = useState("")

  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")

useEffect(() => {
      if (!token) { navigate("/login"); return }
      fetch("/api/courses/my/courses", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : [])
        .then(setCourses)
        .catch(() => {})
    }, [navigate, token])

    const prevSelectedCourseRef = useRef(selectedCourse);
    useEffect(() => {
      if (prevSelectedCourseRef.current !== "" && selectedCourse === "") {
        setLessons([]);
        setSelectedLesson("");
      }
      prevSelectedCourseRef.current = selectedCourse;
    }, [selectedCourse]);

    useEffect(() => {
      if (!selectedCourse) {
        return
      }
      setLoadingLessons(true)
      apiFetch(`/api/courses/${selectedCourse}/lessons`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : [])
        .then((data) => { setLessons(data); setSelectedLesson("") })
        .catch(() => {})
        .finally(() => setLoadingLessons(false))
    }, [selectedCourse, token])

  const handleStudyAssistant = async (e) => {
    e.preventDefault()
    if (!selectedLesson || !question.trim()) return
    setError("")
    setAnswer("")
    setLoading(true)
    try {
      const res = await fetchWithRetry("/api/ai/study-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lesson_id: Number(selectedLesson), question }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("AI service temporarily overloaded. Please try again in a moment.")
        }
        throw new Error(data.detail || "AI request failed")
      }
      setAnswer(data.answer)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleQuizGenerator = async (e) => {
    e.preventDefault()
    if (!selectedLesson) return
    setError("")
    setQuizResult("")
    setLoading(true)
    try {
      const res = await fetchWithRetry("/api/ai/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lesson_id: Number(selectedLesson), question_count: questionCount }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("AI service temporarily overloaded. Please try again in a moment.")
        }
        throw new Error(data.detail || "Quiz generation failed")
      }
      setQuizResult(data.quiz)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-[#60A5FA]" />
            AI Learning Assistant
          </h1>
          <p className="text-slate-400 mt-1">Get help understanding lessons or generate practice quizzes</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => setMode("study")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "study" ? "bg-[#60A5FA] text-slate-950" : "text-slate-400 hover:text-white"}`}
          >
            <BookOpen className="w-4 h-4" />
            Study Assistant
          </button>
          <button
            onClick={() => setMode("quiz")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "quiz" ? "bg-[#60A5FA] text-slate-950" : "text-slate-400 hover:text-white"}`}
          >
            <Sparkles className="w-4 h-4" />
            Quiz Generator
          </button>
        </div>

        {/* Course & Lesson selectors */}
        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Select Lesson</CardTitle>
            <CardDescription>Choose the course and lesson you want help with</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA]"
              >
                <option value="">Select a course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Lesson</label>
              <select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                disabled={!selectedCourse || loadingLessons}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA] disabled:opacity-50"
              >
                <option value="">{loadingLessons ? "Loading lessons..." : "Select a lesson..."}</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-300">{error}</div>}

        {/* Study Assistant */}
        {mode === "study" && (
          <Card className="bg-slate-900/70 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#60A5FA]" />
                Ask a Question
              </CardTitle>
              <CardDescription>Ask anything about the selected lesson</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStudyAssistant} className="space-y-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  placeholder="e.g. Can you explain the main concept of this lesson in simpler terms?"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white text-sm outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/20 resize-none"
                />
                <Button
                  type="submit"
                  disabled={loading || !selectedLesson || !question.trim()}
                  className="gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? "Thinking..." : "Ask AI"}
                </Button>
              </form>

              {answer && (
                <div className="mt-6 rounded-xl bg-[#60A5FA]/5 border border-[#60A5FA]/20 p-4">
                  <p className="text-xs text-[#60A5FA] uppercase tracking-widest mb-3 font-semibold">AI Response</p>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quiz Generator */}
        {mode === "quiz" && (
          <Card className="bg-slate-900/70 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#60A5FA]" />
                Generate Practice Quiz
              </CardTitle>
              <CardDescription>AI will create quiz questions based on the lesson content</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuizGenerator} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-2">Number of questions</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-32 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !selectedLesson}
                  className="gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? "Generating..." : "Generate Quiz"}
                </Button>
              </form>

              {quizResult && (
                <div className="mt-6 rounded-xl bg-[#60A5FA]/5 border border-[#60A5FA]/20 p-4">
                  <p className="text-xs text-[#60A5FA] uppercase tracking-widest mb-3 font-semibold">Generated Quiz</p>
                  <pre className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">{quizResult}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
