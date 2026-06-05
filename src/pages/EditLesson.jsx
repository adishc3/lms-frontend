import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import apiFetch from "@/lib/api"

export default function EditLesson() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadLesson = async () => {
      try {
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
        if (!token) {
          navigate("/login")
          return
        }

        const [lessonRes, courseRes] = await Promise.all([
          apiFetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch(`/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!courseRes.ok) {
          const data = await courseRes.json()
          throw new Error(data.detail || data.message || "Course not found")
        }
        if (!lessonRes.ok) {
          const data = await lessonRes.json()
          throw new Error(data.detail || data.message || "Lesson not found")
        }

        const lessonData = await lessonRes.json()
        setTitle(lessonData.title || "")
        setContent(lessonData.content || "")
      } catch (err) {
        console.error(err)
        setError(err.message || "Unable to load lesson")
      } finally {
        setLoading(false)
      }
    }

    loadLesson()
  }, [courseId, lessonId, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSaving(true)

    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await apiFetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || data.message || "Unable to update lesson")
      }
      navigate(`/courses/${courseId}/lessons/${lessonId}`)
    } catch (err) {
      console.error(err)
      setError(err.message || "Unable to update lesson")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <WaveLoader message="Loading lesson for edit..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="container mx-auto max-w-3xl">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle>Edit lesson</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Lesson title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Enter a title for your lesson"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Lesson content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[220px] rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Update the lesson content"
                required
              />
            </div>

            {error ? <div className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => navigate(`/courses/${courseId}/lessons/${lessonId}`)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={saving}>
                {saving ? "Saving lesson..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
