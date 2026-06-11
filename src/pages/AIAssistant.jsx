import { useEffect, useState } from "react"
import { MessageCircle, Send, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import apiFetch from "@/lib/api"

const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await apiFetch(url, options)
      if (res.status === 503 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      return res
    } catch (err) {
      if (attempt === maxRetries - 1) throw err
      const delay = Math.pow(2, attempt) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

function AITutorWidget() {
  const [open, setOpen] = useState(false)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your AI tutor. Which course would you like help with?" },
  ])
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showCourseList, setShowCourseList] = useState(false)
  const [showLessonList, setShowLessonList] = useState(false)
  const [lessonsForCourse, setLessonsForCourse] = useState([])

  useEffect(() => {
    apiFetch("/api/courses/my/courses")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCourses)
      .catch(() => {})
  }, [])

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course)
    setMessages((prev) => [...prev, { role: "user", text: `I want help with: ${course.title}` }])

    // Fetch lessons for this course
    try {
      const res = await apiFetch(`/api/courses/${course.id}/lessons`)
      const lessons = res.ok ? await res.json() : []
      setLessonsForCourse(lessons)
      setShowCourseList(false)

      if (lessons.length > 0) {
        setShowLessonList(true)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Great! Which lesson would you like help with, or should I help with the entire course?",
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "No lessons found for this course. Go ahead and ask your question!" },
        ])
      }
    } catch (err) {
      setError("Failed to load lessons")
    }
  }

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson)
    setMessages((prev) => [...prev, { role: "user", text: `Help with lesson: ${lesson.title}` }])
    setShowLessonList(false)
    setMessages((prev) => [...prev, { role: "assistant", text: "Perfect! What would you like to know about this lesson?" }])
  }

  const handleSkipLesson = () => {
    setMessages((prev) => [...prev, { role: "user", text: "Help me with the entire course" }])
    setShowLessonList(false)
    setMessages((prev) => [...prev, { role: "assistant", text: "Understood! Ask me anything about this course." }])
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    if (!selectedCourse || !question.trim()) return

    setError("")
    setLoading(true)

    const userMessage = question.trim()
    setMessages((prev) => [...prev, { role: "user", text: userMessage }])
    setQuestion("")

    try {
      const payload = {
        course_id: selectedCourse.id,
        question: userMessage,
      }
      if (selectedLesson) payload.lesson_id = selectedLesson.id

      const res = await fetchWithRetry("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("AI service overloaded. Try again in a moment.")
        }
        throw new Error(data.detail || "AI request failed")
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open ? (
        <div className="w-[360px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#60A5FA]/10 text-[#60A5FA]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Tutor</p>
                <p className="text-xs text-slate-400">Get help with your courses</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setShowCourseList(false)
                setShowLessonList(false)
              }}
              className="rounded-full p-2 text-slate-400 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 px-4 pb-4 pt-3">
            {error && (
              <div className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="max-h-[240px] space-y-3 overflow-y-auto pr-1">
              {messages.map((message, index) => (
                <div key={index} className={`rounded-3xl p-3 text-sm ${message.role === "user" ? "bg-slate-900 text-slate-200 ml-8" : "bg-slate-800 text-slate-200"}`}>
                  <p className="font-medium text-slate-200">
                    {message.role === "user" ? "You" : "Tutor"}
                  </p>
                  <p className="mt-1 leading-relaxed whitespace-pre-wrap">{message.text}</p>
                </div>
              ))}
            </div>

            {showCourseList && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-[#60A5FA] hover:bg-slate-800"
                  >
                    {course.title}
                  </button>
                ))}
              </div>
            )}

            {showLessonList && lessonsForCourse.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {lessonsForCourse.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-[#60A5FA] hover:bg-slate-800"
                  >
                    {lesson.title}
                  </button>
                ))}
                <button
                  onClick={handleSkipLesson}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-left text-sm text-slate-400 transition hover:border-[#60A5FA] hover:text-slate-200"
                >
                  Skip (help with entire course)
                </button>
              </div>
            )}

            {selectedCourse && !showCourseList && !showLessonList && (
              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  placeholder="Type your question…"
                  className="w-full resize-none rounded-3xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/20"
                />
                <Button
                  type="submit"
                  className="w-full justify-center gap-2"
                  disabled={loading || !question.trim()}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? "Sending..." : "Send"}
                </Button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            setShowCourseList(true)
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#60A5FA] px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-[#60A5FA]/20 transition hover:bg-[#4d8fe5]"
        >
          <MessageCircle className="h-4 w-4" />
          AI Tutor
        </button>
      )}
    </div>
  )
}

export { AITutorWidget }

export default function AIAssistantPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-950 text-white">
      <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl shadow-black/40">
        <div className="mb-4 flex justify-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#60A5FA]/10 text-[#60A5FA]">
            <MessageCircle className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-3 text-white">AI Tutor</h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          The AI Tutor is now available on every page. Look for the button in the bottom-right corner to open the chat window and ask your questions.
        </p>
      </div>
    </div>
  )
}
