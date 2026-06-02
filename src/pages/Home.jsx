import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, BookOpen, GraduationCap, Trophy, LogOut, Layout, PlusCircle } from "lucide-react"

export default function Home() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }

      try {
        const userRes = await fetch("/api/auth/me", {
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

        if (userData.role === "student") {
          const coursesRes = await fetch("/api/courses/my/courses", {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (coursesRes.ok) {
            const coursesData = await coursesRes.json()
            const coursesWithProgress = await Promise.all(coursesData.map(async (course) => {
              try {
                const progressRes = await fetch(`/api/courses/${course.id}/progress`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                const progress = progressRes.ok ? await progressRes.json() : { percent: 0, completed: 0, total_lessons: 0 }
                return {
                  ...course,
                  progress_percent: progress.percent || 0,
                  completed_lessons: progress.completed || 0,
                  total_lessons: progress.total_lessons || 0
                }
              } catch (err) {
                return { ...course, progress_percent: 0, completed_lessons: 0, total_lessons: 0 }
              }
            }))
            setCourses(coursesWithProgress)
          }
        } else {
          const coursesRes = await fetch("/api/courses/", {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (coursesRes.ok) {
            const coursesData = await coursesRes.json()
            const ownedCourses = coursesData
              .filter((course) => course.owner_id === userData.id)
              .map((course) => ({
                ...course,
                progress_percent: 0,
                completed_lessons: 0,
                total_lessons: 0
              }))
            setCourses(ownedCourses)
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
        setError("Unable to load dashboard. Please try again.")
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
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#60A5FA] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <ShieldCheck className="w-7 h-7 text-[#60A5FA]" />
            <span className="text-xl font-bold">BeginnerLMS</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => navigate("/home")} className="text-sm font-medium text-[#60A5FA]">Dashboard</button>
            {user?.role === 'student' && (
              <>
                <button onClick={() => navigate("/courses")} className="text-sm font-medium text-slate-300 hover:text-white">Explore</button>
                <button onClick={() => navigate("/certificates")} className="text-sm font-medium text-slate-300 hover:text-white">Certificates</button>
                <button onClick={() => navigate("/ai")} className="text-sm font-medium text-slate-300 hover:text-white">AI Assistant</button>
              </>
            )}
            {user?.role === 'instructor' && (
              <button onClick={() => navigate("/my-courses")} className="text-sm font-medium text-slate-300 hover:text-white">My Courses</button>
            )}
            {user?.role === 'admin' && (
              <button onClick={() => navigate("/admin")} className="text-sm font-medium text-purple-400 hover:text-white">Admin</button>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold">{user?.full_name || user?.email || 'User'}</span>
              <span className="text-xs text-slate-400 capitalize">{user?.role || 'User'}</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
               <span className="text-[#60A5FA] font-bold">{(user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-800 text-slate-400 hover:text-white gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* Welcome Section */}
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

        {/* Stats Grid - Different for students vs instructors */}
        {user?.role === 'student' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Enrolled Courses', value: courses.length, icon: BookOpen, color: 'text-blue-400' },
              { label: 'Completed Lessons', value: courses.reduce((acc, curr) => acc + (curr.completed_lessons || 0), 0), icon: Layout, color: 'text-[#60A5FA]' },
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
              { label: 'Total Students', value: courses.reduce((acc, curr) => acc + (curr.student_count || 0), 0), icon: Layout, color: 'text-[#60A5FA]' },
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

        {/* Courses Section */}
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold">
            {user?.role === 'student' ? 'My Courses' : 'My Created Courses'}
          </h2>
          {user?.role === 'student' && (
            <Button variant="link" className="text-[#60A5FA]" onClick={() => navigate("/courses")}>Explore more courses</Button>
          )}
        </div>

        {courses.length === 0 ? (
          <Card className="bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl py-20 text-center">
            <div className="inline-flex p-4 rounded-full bg-slate-900 mb-4 text-slate-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <p className="text-xl font-semibold mb-2">
              {user?.role === 'student' ? 'No active courses' : 'No courses created yet'}
            </p>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              {user?.role === 'student' 
                ? "You haven't enrolled in any courses yet. Start your journey by browsing our catalog."
                : "Create your first course to get started teaching."}
            </p>
            <Button onClick={() => navigate(user?.role === 'student' ? "/courses" : "/courses/create")} className="bg-[#60A5FA] text-black hover:bg-[#60A5FA]/90">
              {user?.role === 'student' ? 'Browse Catalog' : 'Create Course'}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="bg-slate-900/50 border-slate-800 group hover:border-[#60A5FA]/50 transition-all cursor-pointer overflow-hidden flex flex-col"
                onClick={(e) => {
                  if (e.target.closest && e.target.closest('button, a')) return
                  navigate(`/courses/${course.id}`)
                }}
              >
                <div className="h-40 bg-slate-800 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-2 py-1 bg-[#60A5FA] text-black text-[10px] font-bold uppercase rounded leading-none">
                      {user?.role === 'instructor' ? 'Manage' : 'Learning'}
                    </span>
                  </div>
                </div>
                <CardHeader className="p-6">
                  <CardTitle className="text-xl group-hover:text-[#60A5FA] transition-colors">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2 text-slate-400">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6 mt-auto">
                  {user?.role === 'student' ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Progress</span>
                        <span className="text-[#60A5FA] font-bold">{course.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-[#60A5FA] h-full rounded-full transition-all duration-1000" style={{ width: `${course.progress_percent}%` }}></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                        <span className="flex items-center gap-1">
                          <Layout className="w-3 h-3" />
                          {course.completed_lessons} / {course.total_lessons} Lessons
                        </span>
                        <span>{course.progress_percent === 100 ? 'Completed' : 'Active'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">
                        <span className="font-semibold text-slate-300">{course.total_lessons || 0}</span> lesson{(course.total_lessons || 0) !== 1 ? 's' : ''}
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full bg-[#60A5FA] text-slate-950 hover:bg-[#60A5FA]/90"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/courses/${course.id}/students`)
                        }}
                      >
                        Manage Course
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}