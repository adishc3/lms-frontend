import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Play, CheckCircle, PlusCircle, ClipboardList, BookOpen } from "lucide-react"

export default function CourseDetail() {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true)
      setError("")
      try {
        const courseRes = await fetch(`/api/courses/${courseId}`)
        if (!courseRes.ok) {
          throw new Error("Course not found")
        }
        const courseData = await courseRes.json()
        setCourse(courseData)

        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
        if (!token) {
          return
        }

        const meRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        })
        let ownerStatus = false
        if (meRes.ok) {
          const meData = await meRes.json()
          ownerStatus = (meData.role || "").toLowerCase() === "instructor" && meData.id === courseData.owner_id
          setUser(meData)
          setIsOwner(ownerStatus)
        }

        const enrolledRes = await fetch("/api/courses/my/courses", {
          headers: { Authorization: `Bearer ${token}` }
        })
        let enrolledStatus = false
        if (enrolledRes.ok) {
          const enrolledCourses = await enrolledRes.json()
          const enrolledIds = new Set(enrolledCourses.map((course) => course.id))
          enrolledStatus = enrolledIds.has(courseData.id)
          setIsEnrolled(enrolledStatus)
        }

        const shouldFetchLessons = ownerStatus || enrolledStatus
        if (shouldFetchLessons) {
          const lessonsRes = await fetch(`/api/courses/${courseId}/lessons`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (lessonsRes.ok) {
            setLessons(await lessonsRes.json())
          }
        }

        if (enrolledStatus) {
          const progressRes = await fetch(`/api/courses/${courseId}/progress`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (progressRes.ok) {
            setProgress(await progressRes.json())
          }
        }
      } catch (err) {
        console.error(err)
        setError(err.message || "Unable to load course")
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleEnroll = async () => {
    setError("")
    setEnrolling(true)
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || data.message || "Unable to enroll")
      }

      setIsEnrolled(true)
      const progressRes = await fetch(`/api/courses/${courseId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (progressRes.ok) {
        setProgress(await progressRes.json())
      }
      const lessonsRes = await fetch(`/api/courses/${courseId}/lessons`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (lessonsRes.ok) {
        setLessons(await lessonsRes.json())
      }
    } catch (err) {
      console.error(err)
      setError(err.message || "Unable to enroll")
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">Loading course details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 text-center gap-6">
        <p className="text-lg font-semibold text-red-400">{error}</p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="px-4 py-2" onClick={() => navigate("/courses") }>
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to catalog
            </Button>
            <div>
              <p className="text-slate-400 text-sm">Course detail</p>
              <h1 className="text-2xl font-bold text-white">{course.title}</h1>
            </div>
          </div>
          <nav className="flex flex-wrap gap-3">
            <Link to="/home" className="text-sm font-medium text-cyan-400 hover:text-white">Dashboard</Link>
            <Link to="/my-courses" className="text-sm font-medium text-slate-300 hover:text-white">My Courses</Link>
            <Link to="/progress" className="text-sm font-medium text-slate-300 hover:text-white">Progress</Link>
            {user?.role === "instructor" && (
              <Button variant="outline" size="sm" className="ml-2 border-cyan-500 text-cyan-400" onClick={() => navigate("/courses/create")}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="space-y-6">
            <Card className="bg-slate-900/70 border-slate-800">
              <CardHeader>
                <div className="flex flex-col gap-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Course Overview</p>
                  <CardTitle className="text-3xl">{course.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed">{course.description || "No course description is available."}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-950/80 p-4 border border-slate-800">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Duration</p>
                    <p className="mt-2 text-lg font-semibold">{course.duration || "Flexible"}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/80 p-4 border border-slate-800">
                    <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Category</p>
                    <p className="mt-2 text-lg font-semibold">{course.category || "General"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isEnrolled ? (
              <Card className="bg-slate-900/70 border-slate-800">
                <CardHeader>
                  <CardTitle>Lessons</CardTitle>
                  <CardDescription>{lessons.length} lesson{lessons.length === 1 ? "" : "s"} available</CardDescription>
                </CardHeader>
                <CardContent>
                  {lessons.length === 0 ? (
                    <p className="text-slate-400">No lessons have been published yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {lessons.map((lesson) => (
                        <Link key={lesson.id} to={`/courses/${courseId}/lessons/${lesson.id}`} className="group rounded-3xl border border-slate-800 bg-slate-950/80 p-4 flex items-center justify-between gap-4 hover:border-cyan-500 transition">
                          <div>
                            <p className="font-semibold group-hover:text-cyan-400">{lesson.title}</p>
                            <p className="text-sm text-slate-500">{lesson.content?.slice(0, 90) || "Lesson content available after enrollment."}</p>
                          </div>
                          <Play className="w-5 h-5 text-cyan-400" />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-900/70 border-slate-800 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Your access</p>
                  <h2 className="text-xl font-semibold">{isEnrolled ? "Enrolled" : "Open for enrollment"}</h2>
                </div>
                <CheckCircle className={`w-8 h-8 ${isEnrolled ? "text-cyan-400" : "text-slate-500"}`} />
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                  <p className="text-sm text-slate-400">Progress</p>
                  <p className="mt-2 text-2xl font-semibold">{progress?.percent ?? 0}%</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4">
                  <p className="text-sm text-slate-400">Lessons completed</p>
                  <p className="mt-2 text-lg font-semibold">{progress?.completed ?? 0} / {progress?.total_lessons ?? lessons.length}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {isOwner ? (
                  <div className="space-y-3">
                    <Button className="w-full gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => navigate(`/courses/${courseId}/add-lesson`)}>
                      Add new lesson
                    </Button>
                    <Button variant="outline" className="w-full gap-2 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => navigate(`/courses/${courseId}/students`)}>
                      Manage Assignments & Quizzes
                    </Button>
                  </div>
                ) : isEnrolled ? (
                  <div className="space-y-3">
                    <Button className="w-full gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => navigate("/home")}>Continue learning</Button>
                    <Button variant="outline" className="w-full gap-2 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => navigate(`/courses/${courseId}/assignments`)}>
                      <ClipboardList className="w-4 h-4" />
                      Assignments
                    </Button>
                    <Button variant="outline" className="w-full gap-2 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => navigate(`/courses/${courseId}/quizzes`)}>
                      <BookOpen className="w-4 h-4" />
                      Quizzes
                    </Button>
                  </div>
                ) : user?.role === "instructor" ? (
                  <p className="text-center text-sm text-slate-400 italic">Instructors cannot enroll in courses.</p>
                ) : (
                  <Button className="w-full gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={handleEnroll} disabled={enrolling}>
                    {enrolling ? "Enrolling..." : "Enroll now"}
                  </Button>
                )}
              </div>
            </Card>

            <Card className="bg-slate-900/70 border-slate-800">
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="font-medium">Explore more courses</p>
                    <p className="text-sm text-slate-500">Visit the catalog to discover new learning paths.</p>
                  </div>
                  <Link to="/courses" className="inline-flex items-center gap-2 text-cyan-400 hover:text-white text-sm">
                    Browse courses <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
