import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import apiFetch from "@/lib/api"

export default function CreateCourse() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [isPaid, setIsPaid] = useState(false)
  const [price, setPrice] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
    if (!token) {
      navigate("/login")
      return
    }

    apiFetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) {
          navigate("/login")
          return
        }
        setLoading(false)
        if ((data.role || "").toLowerCase() !== "instructor" && (data.role || "").toLowerCase() !== "admin") {
          navigate("/home")
        }
      })
      .catch(() => navigate("/login"))
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, cover_image_url: coverImageUrl || undefined, is_paid: isPaid, price: isPaid ? Number(price) : 0 }),
      })
      let data = null
      try {
        data = await response.json()
      } catch (e) {
        data = null
      }

      const extractMessage = (maybeData, resp) => {
        if (!maybeData) return resp?.statusText || "Unable to create course"
        const candidate = maybeData.detail || maybeData.message || maybeData.error || maybeData
        if (typeof candidate === "string") return candidate
        try {
          return JSON.stringify(candidate)
        } catch (e) {
          return String(candidate)
        }
      }

      if (!response.ok) {
        const msg = extractMessage(data, response)
        throw new Error(msg)
      }

      // If backend returns created course, navigate to it; otherwise fall back to courses list
      if (data && data.id) {
        navigate(`/courses/${data.id}`)
      } else {
        navigate(`/courses`)
      }
    } catch (err) {
      setError(err.message || "Unable to create course")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <WaveLoader message="Preparing course creation..." />
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
              <label className="text-sm font-medium text-slate-200">Access</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="paid" checked={!isPaid} onChange={() => setIsPaid(false)} />
                  <span className="text-sm">Free</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="paid" checked={isPaid} onChange={() => setIsPaid(true)} />
                  <span className="text-sm">Paid</span>
                </label>
              </div>
              {isPaid && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-200">Price (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Enter price in USD"
                    required={isPaid}
                  />
                </div>
              )}
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
              <p className="text-xs text-slate-500">Leave empty to use a generated cover image.</p>
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
