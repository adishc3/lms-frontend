import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Image, Video, Music, Download, X } from "lucide-react"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import apiFetch from "@/lib/api"

export default function LessonDetail() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isInstructor, setIsInstructor] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const getFileIcon = (resourceType) => {
    if (!resourceType) return <FileText className="w-4 h-4" />
    if (resourceType === 'image') return <Image className="w-4 h-4" />
    if (resourceType === 'video') return <Video className="w-4 h-4" />
    if (resourceType === 'audio') return <Music className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const getFileTypeLabel = (resourceType) => {
    if (!resourceType) return "File"
    return resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
  }

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      try {
        const courseRes = await apiFetch(`/api/courses/${courseId}`)
        if (!courseRes.ok) { const data = await courseRes.json(); throw new Error(data.detail || data.message || "Course not found") }
        const courseData = await courseRes.json()
        setCourse(courseData)
        if (!token) { setError("Please log in and enroll to view this lesson."); return }
        const meRes = await apiFetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        if (meRes.ok) {
          const meData = await meRes.json()
          setIsInstructor((meData.role || "").toLowerCase() === "instructor" || (meData.role || "").toLowerCase() === "admin")
        }
        const lessonRes = await apiFetch(`/api/courses/${courseId}/lessons/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!lessonRes.ok) { const data = await lessonRes.json(); throw new Error(data.detail || data.message || "You must enroll to view this lesson.") }
        const lessonData = await lessonRes.json()
        setLesson(lessonData)
        const progressRes = await apiFetch(`/api/courses/${courseId}/progress`, { headers: { Authorization: `Bearer ${token}` } })
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          setCompleted(Array.isArray(progressData.completed_lessons) && progressData.completed_lessons.includes(Number(lessonId)))
        }
      } catch (err) {
        setError(err.message || "Unable to load lesson")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId, lessonId])

  const handleComplete = async () => {
    setCompleting(true)
    setError("")
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      const response = await apiFetch(`/api/courses/${courseId}/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || data.message || "Unable to mark lesson complete")
      }
      setCompleted(true)
    } catch (err) {
      setError(err.message || "Unable to mark lesson complete")
    } finally {
      setCompleting(false)
    }
  }

  const handleDeleteFile = async () => {
    if (!lesson?.asset_metadata?.public_id) return
    
    setDeleting(true)
    setError("")
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      const response = await apiFetch(`/api/courses/${courseId}/lessons/${lessonId}/asset`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || data.message || "Failed to delete file")
      }
      const updatedLesson = await response.json()
      setLesson(updatedLesson)
    } catch (err) {
      setError(err.message || "Failed to delete file")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <WaveLoader message="Loading lesson..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 text-center gap-6">
        <p className="text-lg font-semibold text-red-400">{error}</p>
        <div className="flex gap-3">
          <Button onClick={() => navigate(`/courses/${courseId}`)}>Back to course</Button>
          <Button variant="outline" onClick={() => navigate("/courses")}>Browse courses</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">{course?.title}</p>
            <h1 className="text-3xl font-bold">{lesson?.title}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>Back to course</Button>
            <Button variant="ghost" onClick={() => navigate("/home")}>Dashboard</Button>
          </div>
        </div>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl">Lesson content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-invert max-w-none text-slate-200 whitespace-pre-wrap">{lesson?.content}</div>
            
            {lesson?.asset_path && lesson?.asset_metadata ? (
              <div className="mt-6 rounded-xl bg-slate-950/50 border border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(lesson.asset_metadata.resource_type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-300 truncate">
                        {lesson.asset_metadata.file_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {getFileTypeLabel(lesson.asset_metadata.resource_type)} • Attached by instructor
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={lesson.asset_path}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                    </a>
                    {isInstructor && (
                      <button
                        onClick={handleDeleteFile}
                        disabled={deleting}
                        className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-red-400 hover:text-red-300"
                        title="Delete file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">Lesson completion</p>
              <p className="text-lg font-semibold">{completed ? "Completed" : "Not completed yet"}</p>
            </div>
            {!completed ? (
              <Button onClick={handleComplete} disabled={completing} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                {completing ? "Marking complete..." : "Mark complete"}
              </Button>
            ) : null}
          </div>
          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        </Card>
      </div>
    </div>
  )
}
