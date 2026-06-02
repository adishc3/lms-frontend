import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Progress() {
  const navigate = useNavigate()
  const [progressData, setProgressData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }

      try {
        const enrolledRes = await fetch("/api/courses/my/courses", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (enrolledRes.ok) {
          const enrolled = await enrolledRes.json()
          
          const progressPromises = enrolled.map(async (course) => {
            const progressRes = await fetch(`/api/courses/${course.id}/progress`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            const progress = progressRes.ok ? await progressRes.json() : { total_lessons: 0, completed: 0, percent: 0 }
            
            return {
              course_id: course.id,
              course_title: course.title,
              total_lessons: progress.total_lessons || 0,
              completed: progress.completed || 0,
              percent: progress.percent || 0
            }
          })
          
          const data = await Promise.all(progressPromises)
          setProgressData(data)
        }
      } catch (error) {
        console.error("Failed to fetch progress", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">Loading progress...</div>
      </div>
    )
  }

  const totalCompleted = progressData.reduce((sum, p) => sum + p.completed, 0)
  const totalLessons = progressData.reduce((sum, p) => sum + p.total_lessons, 0)
  const overallPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-500 cursor-pointer" onClick={() => navigate("/")}>LMS</h1>
          <nav className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate("/home")}>Dashboard</Button>
            <Button variant="ghost" onClick={() => navigate("/my-courses")}>My Courses</Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold mb-2">Learning Progress</h2>
          <p className="text-slate-400">Track your progress across all enrolled courses</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Completion</span>
                <span className="text-slate-300">{totalCompleted} / {totalLessons} lessons ({overallPercent}%)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div className="bg-cyan-500 h-3 rounded-full transition-all duration-500" style={{ width: `${overallPercent}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {progressData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-400 mb-4">No progress to display. Enroll in courses to start learning.</p>
              <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {progressData.map((item) => (
              <Card key={item.course_id}>
                <CardHeader>
                  <CardTitle>{item.course_title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-slate-300">{item.completed} / {item.total_lessons} ({item.percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${item.percent}%` }}></div>
                    </div>
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