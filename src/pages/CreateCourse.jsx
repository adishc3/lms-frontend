import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import apiFetch from "@/lib/api"

export default function CreateCourse() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await apiFetch("/api/auth/me")
      if (!response.ok) {
        navigate("/login")
        return
      }
      const data = await response.json()
      setUser(data)
      setLoading(false)

      if ((data.role || "").toLowerCase() !== "instructor" && (data.role || "").toLowerCase() !== "admin") {
        navigate("/home")
      }
    }

    getUser()
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSaving(true)

    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      const response = await apiFetch("/api/courses/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || data.message || "Unable to create course")
      }
      navigate(`/courses/${data.id}`)
    } catch (err) {
      setError(err.message || "Unable to create course")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">Preparing course creation...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="container mx-auto max-w-3xl">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle>Create a new course</CardTitle>
            <CardDescription>Only instructors can create courses and add lessons to them.</CardDescription>
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

            {error ? <div className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => navigate("/home")}>Cancel</Button>
              <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={saving}>
                {saving ? "Creating course..." : "Create course"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
