import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import apiFetch from "@/lib/api"

export default function EditCourse() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
        if (!token) {
          navigate("/login")
          return
        }

        const response = await apiFetch(`/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.detail || data.message || "Course not found")
        }

        const courseData = await response.json()
        setTitle(courseData.title || "")
        setDescription(courseData.description || "")
        setCoverImageUrl(courseData.cover_image_url || "")
      } catch (err) {
        console.error(err)
        setError(err.message || "Unable to load course")
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [courseId, navigate])

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

      const response = await apiFetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, cover_image_url: coverImageUrl || undefined }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || data.message || "Unable to update course")
      }
      navigate(`/courses/${courseId}`)
    } catch (err) {
      console.error(err)
      setError(err.message || "Unable to update course")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <WaveLoader message="Loading course for edit..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="container mx-auto max-w-3xl">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <div>
              <CardTitle>Edit course</CardTitle>
              <CardDescription>Update title, description, and cover art for your course.</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Course title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Enter a title for your course"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Course description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[160px] rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="What will students learn in this course?"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Cover image URL (optional)</label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <p className="text-xs text-slate-500">Leave empty to continue using the current or generated cover image.</p>
            </div>

            {error ? <div className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={saving}>
                {saving ? "Saving course..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}