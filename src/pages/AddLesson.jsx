import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import { Upload, FileText, Image, Video, Music } from "lucide-react"
import apiFetch from "@/lib/api"

export default function AddLesson() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")

  useEffect(() => {
    const loadCourse = async () => {
      if (!token) {
        navigate("/login")
        return
      }

      try {
        const [meRes, courseRes] = await Promise.all([
          apiFetch("/api/auth/me"),
          apiFetch(`/api/courses/${courseId}`),
        ])

        if (!meRes.ok) {
          navigate("/login")
          return
        }

        const courseData = await courseRes.json()
        if (!courseRes.ok) {
          setError(courseData.detail || courseData.message || "Course not found")
          return
        }

        const meData = await meRes.json()
        if ((meData.role || "").toLowerCase() !== "instructor" && (meData.role || "").toLowerCase() !== "admin") {
          navigate("/home")
          return
        }
        if (courseData.owner_id !== meData.id && (meData.role || "").toLowerCase() !== "admin") {
          setError("You do not have permission to add lessons to this course.")
          return
        }

        setCourse(courseData)
      } catch (err) {
        setError(err.message || "Unable to load course")
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [courseId, navigate, token])

  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText className="w-4 h-4" />
    const ext = fileName.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image className="w-4 h-4" />
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return <Video className="w-4 h-4" />
    if (['mp3', 'wav', 'aac', 'flac'].includes(ext)) return <Music className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    setUploadProgress(0)

    try {
      // Step 1: Create the lesson
      const lessonRes = await apiFetch(`/api/courses/${courseId}/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      })
      const lessonData = await lessonRes.json()
      if (!lessonRes.ok) {
        throw new Error(lessonData.detail || lessonData.message || "Unable to add lesson")
      }

      // Step 2: Upload file if provided
      if (file) {
        setUploadProgress(50)
        const formData = new FormData()
        formData.append("file", file)

        const uploadRes = await apiFetch(`/api/courses/${courseId}/lessons/${lessonData.id}/upload`, {
          method: "POST",
          body: formData,
        })

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json()
          throw new Error(uploadError.detail || "File upload failed")
        }
        setUploadProgress(100)
      }

      navigate(`/courses/${courseId}`)
    } catch (err) {
      setError(err.message || "Unable to add lesson")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <WaveLoader message="Loading lesson form..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="container mx-auto max-w-3xl">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle>Add a lesson to {course?.title || "course"}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Lesson title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Enter lesson title"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Lesson content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[180px] rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none"
                placeholder="Write the lesson content here"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Attach file (optional)</label>
              <p className="text-xs text-slate-500">Supported: PDF, images, videos, documents (max 100MB)</p>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-input"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.mkv,.webm,.mp3,.wav"
                />
                <label
                  htmlFor="file-input"
                  className="flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-700 bg-slate-950/50 px-4 py-6 cursor-pointer hover:border-cyan-500 hover:bg-slate-900/50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    {!file && <p className="text-xs text-slate-500 mt-1">PDF, images, videos, documents</p>}
                  </div>
                </label>
              </div>
              {file && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/50 border border-slate-800 p-3">
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-300 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-slate-400 hover:text-red-400 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Uploading file...</span>
                  <span className="text-cyan-400 font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {error ? <div className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>Cancel</Button>
              <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={saving}>
                {saving ? "Adding lesson..." : "Add lesson"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

