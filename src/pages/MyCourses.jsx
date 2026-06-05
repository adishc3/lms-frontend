import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import apiFetch from "@/lib/api"

export default function MyCourses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }

      try {
        const userRes = await apiFetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        if (!userRes.ok) {
          navigate("/login")
          return
        }

        const userData = await userRes.json()

        if (userData.role === "instructor") {
          const allRes = await apiFetch("/api/courses/", { headers: { Authorization: `Bearer ${token}` } })
          if (allRes.ok) {
            const allCourses = await allRes.json()
            const owned = allCourses.filter((c) => c.owner_id === userData.id)

            const coursesWithProgress = await Promise.all(owned.map(async (course) => {
              try {
                const lessonsRes = await apiFetch(`/api/courses/${course.id}/lessons`, { headers: { Authorization: `Bearer ${token}` } })
                const lessons = lessonsRes.ok ? await lessonsRes.json() : []

                const progressRes = await apiFetch(`/api/courses/${course.id}/progress`, { headers: { Authorization: `Bearer ${token}` } })
                const progress = progressRes.ok ? await progressRes.json() : { completed: 0 }

                return { id: course.id, title: course.title, description: course.description || "", progress_percent: progress.percent || 0, total_lessons: lessons.length, completed_lessons: progress.completed || 0 }
              } catch {
                return { id: course.id, title: course.title, description: course.description || "", progress_percent: 0, total_lessons: 0, completed_lessons: 0 }
              }
            }))

            setCourses(coursesWithProgress)
          }
        } else {
          const coursesRes = await apiFetch("/api/courses/my/courses", { headers: { Authorization: `Bearer ${token}` } })
          if (coursesRes.ok) {
            const coursesData = await coursesRes.json()
            const coursesWithProgress = await Promise.all(coursesData.map(async (course) => {
              const lessonsRes = await apiFetch(`/api/courses/${course.id}/lessons`, { headers: { Authorization: `Bearer ${token}` } })
              const lessons = lessonsRes.ok ? await lessonsRes.json() : []
              const progressRes = await apiFetch(`/api/courses/${course.id}/progress`, { headers: { Authorization: `Bearer ${token}` } })
              const progress = progressRes.ok ? await progressRes.json() : { completed: 0 }
              return { id: course.id, title: course.title, description: course.description || "", progress_percent: progress.percent || 0, total_lessons: lessons.length, completed_lessons: progress.completed || 0 }
            }))
            setCourses(coursesWithProgress)
          }
        }
      } catch (error) {
        console.error("Failed to fetch courses", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <WaveLoader message="Loading your courses..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-500 cursor-pointer" onClick={() => navigate("/")}>Learn@will</h1>
          <nav className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate("/home")}>Dashboard</Button>
            <Button variant="ghost" onClick={() => navigate("/courses")}>All Courses</Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold mb-2">My Enrolled Courses</h2>
          <p className="text-slate-400">Courses you're currently taking</p>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-400 mb-4">You haven't enrolled in any courses yet</p>
              <Button onClick={() => navigate("/courses")}>Browse Available Courses</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="cursor-pointer hover:border-cyan-500/50 transition-colors"
                onClick={(e) => {
                  if (e.target.closest && e.target.closest('button, a')) return
                  navigate(`/courses/${course.id}`)
                }}
              >
                <CardHeader>
                  <div className="w-full h-40 mb-4 overflow-hidden rounded-lg bg-slate-800">
                    <img
                      src={course.cover_image_url || `https://picsum.photos/seed/course-${course.id}/800/400`}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-slate-300">{course.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${course.progress_percent}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-500">{course.completed_lessons} of {course.total_lessons} lessons completed</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}