import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, BookOpen, GraduationCap, Trophy, LogOut, PlusCircle } from "lucide-react"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import Layout from "@/components/Layout"
import { NotificationsPanel } from "@/components/NotificationsPanel.jsx"
import apiFetch from "@/lib/api"

export default function Home() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [insights, setInsights] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }

      try {
        const userRes = await apiFetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!userRes.ok) {
          localStorage.removeItem("access_token")
          sessionStorage.removeItem("access_token")
          navigate("/login")
          return
        }

        const userData = await userRes.json()
        setUser(userData)

        // Redirect admins to admin panel
        if (userData.role === "admin") {
          navigate("/admin")
          return
        }

        const notificationsRes = await apiFetch("/api/notifications")
        if (notificationsRes.ok) {
          setNotifications(await notificationsRes.json())
        }

        const summaryPath = userData.role === "instructor" || userData.role === "admin"
          ? "/api/insights/instructor-overview"
          : "/api/insights/progress-summary"

        const insightsRes = await apiFetch(summaryPath)
        if (insightsRes.ok) {
          setInsights(await insightsRes.json())
        }

        if (userData.role === "student") {
          const coursesRes = await apiFetch("/api/courses/my/courses", {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (coursesRes.ok) {
            const coursesData = await coursesRes.json()
            const coursesWithProgress = await Promise.all(coursesData.map(async (course) => {
              try {
                const progressRes = await apiFetch(`/api/courses/${course.id}/progress`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                const progress = progressRes.ok ? await progressRes.json() : { percent: 0, completed: 0, total_lessons: 0 }
                return {
                  ...course,
                  progress_percent: progress.percent || 0,
                  completed_lessons: progress.completed || 0,
                  total_lessons: progress.total_lessons || 0
                }
              } catch {
                return { ...course, progress_percent: 0, completed_lessons: 0, total_lessons: 0 }
              }
            }))
            setCourses(coursesWithProgress)
          }
        } else {
          const coursesRes = await apiFetch("/api/courses/", {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (coursesRes.ok) {
            const coursesData = await coursesRes.json()
            const owned = coursesData.filter((course) => course.owner_id === userData.id)

            const ownedCourses = await Promise.all(owned.map(async (course) => {
              try {
                const lessonsRes = await apiFetch(`/api/courses/${course.id}/lessons`, { headers: { Authorization: `Bearer ${token}` } })
                const lessons = lessonsRes.ok ? await lessonsRes.json() : []

                const progressRes = await apiFetch(`/api/courses/${course.id}/progress`, { headers: { Authorization: `Bearer ${token}` } })
                const progress = progressRes.ok ? await progressRes.json() : { completed: 0, percent: 0 }

                return {
                  ...course,
                  progress_percent: progress.percent || 0,
                  completed_lessons: progress.completed || 0,
                  total_lessons: lessons.length || 0
                }
              } catch {
                return { ...course, progress_percent: 0, completed_lessons: 0, total_lessons: 0 }
              }
            }))

            setCourses(ownedCourses)
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    sessionStorage.removeItem("access_token")
    navigate("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <WaveLoader message="Loading your dashboard..." />
      </div>
    )
  }

  const totalCompleted = courses.reduce((acc, c) => acc + (c.completed_lessons || 0), 0)

  return (
    <Layout>
      <main className="container mx-auto px-6 py-10">
        <div className="mb-12">
          <div className="flex justify-between items-start">
            <div>
              {user?.role === 'student' ? (
                <>
                  <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'Learner'}! 👋</h1>
                  <p className="text-slate-400">
                    You have completed {courses.filter(c => c.progress_percent === 100).length} courses so far. Keep it up!
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'Instructor'}! 👋</h1>
                  <p className="text-slate-400">
                    You are managing {courses.length} course{courses.length !== 1 ? 's' : ''}.
                  </p>
                </>
              )}
            </div>
            {user?.role === 'instructor' && (
              <Button onClick={() => navigate("/courses/create")} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 gap-2">
                <PlusCircle className="w-4 h-4" />
                Create New Course
              </Button>
            )}
            {user?.role === 'admin' && (
              <Button onClick={() => navigate("/admin")} className="bg-purple-600 text-white hover:bg-purple-500 gap-2">
                Admin Panel
              </Button>
            )}
          </div>
        </div>

        {user?.role === 'student' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Enrolled Courses', value: courses.length, icon: BookOpen, color: 'text-blue-400' },
              { label: 'Completed Lessons', value: courses.reduce((acc, curr) => acc + (curr.completed_lessons || 0), 0), icon: ShieldCheck, color: 'text-[#60A5FA]' },
              { label: 'Average Progress', value: `${courses.length > 0 ? Math.round(courses.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0) / courses.length) : 0}%`, icon: Trophy, color: 'text-yellow-400' },
              { label: 'Certificates Earned', value: courses.filter((c) => (c.progress_percent || 0) === 100).length, icon: GraduationCap, color: 'text-purple-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-800 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {[
              { label: 'Courses Created', value: courses.length, icon: BookOpen, color: 'text-blue-400' },
              { label: 'Total Students', value: courses.reduce((acc, curr) => acc + (curr.student_count || 0), 0), icon: ShieldCheck, color: 'text-[#60A5FA]' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-800 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {insights && user?.role !== 'student' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            {[
              { label: 'Courses Owned', value: insights.total_courses ?? courses.length, icon: BookOpen, color: 'text-blue-400' },
              { label: 'Unique Students', value: insights.unique_students ?? 0, icon: ShieldCheck, color: 'text-[#60A5FA]' },
              { label: 'Total Lessons', value: insights.total_lessons ?? 0, icon: Trophy, color: 'text-yellow-400' },
              { label: 'Total Completions', value: insights.total_completions ?? 0, icon: GraduationCap, color: 'text-purple-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-800 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your courses</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/courses')}>Browse courses</Button>
              </div>
            </div>

            {courses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">No courses available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course.id} className="cursor-pointer hover:border-cyan-500/50 transition-colors" onClick={() => navigate(`/courses/${course.id}`)}>
                    <CardHeader>
                      <CardTitle>{course.title}</CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-400">{course.completed_lessons} / {course.total_lessons} Lessons</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <NotificationsPanel notifications={notifications} />
          </div>
        </div>

      </main>
    </Layout>
  )
}
