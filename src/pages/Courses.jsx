import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import apiFetch from "@/lib/api"

export default function Courses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [enrollingIds, setEnrollingIds] = useState(new Set())
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      
      try {
        const coursesRes = await apiFetch("/api/courses/", token ? {
          headers: { Authorization: `Bearer ${token}` }
        } : undefined)
        let allCourses = []
        if (coursesRes.ok) {
          allCourses = await coursesRes.json()
        }
        setCourses(allCourses)
        if (token) {
          const meRes = await apiFetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (meRes.ok) { setUser(await meRes.json()) }
          const enrolledRes = await apiFetch("/api/courses/my/courses", {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (enrolledRes.ok) {
            const enrolled = await enrolledRes.json()
            setEnrolledCourseIds(new Set(enrolled.map((c) => c.id)))
          }
        }
      } catch (error) {
        console.error("Failed to fetch courses", error)
        setError("Failed to load courses")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEnroll = async (courseId) => {
    setError("")
    setSuccess("")
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
    if (!token) {
      navigate("/login")
      return
    }

    setEnrollingIds((prev) => new Set([...prev, courseId]))
    try {
      const response = await apiFetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setEnrolledCourseIds((prev) => new Set([...prev, courseId]))
        setSuccess("Successfully enrolled! Redirecting...")
        setTimeout(() => navigate(`/courses/${courseId}`), 1200)
      } else {
        const data = await response.json()
        setError(data.detail || "Failed to enroll")
      }
    } catch (err) {
      console.error("Failed to enroll", err)
      setError("An error occurred. Please try again.")
    } finally {
      setEnrollingIds((prev) => {
        const updated = new Set(prev)
        updated.delete(courseId)
        return updated
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <WaveLoader message="Loading courses..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-500 cursor-pointer" onClick={() => navigate("/home")}>LMS</h1>
          <nav className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate("/home")}>Dashboard</Button>
            <Button variant="ghost" onClick={() => navigate("/my-courses")}>My Courses</Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold mb-2">Available Courses</h2>
          <p className="text-slate-400">Browse and enroll in courses to start learning</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg text-green-300 text-sm">
            {success}
          </div>
        )}

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">No courses available at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id)
              const isEnrolling = enrollingIds.has(course.id)
              return (
                <Card key={course.id} className="bg-slate-900/50 border-slate-800 flex flex-col overflow-hidden">
                  <div className="w-full h-44 overflow-hidden bg-slate-800">
                    <img
                      src={course.cover_image_url || `https://picsum.photos/seed/course-${course.id}/800/400`}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.description || "No description available"}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <div className="flex justify-end">
                      <Button
                        variant={isEnrolled ? "outline" : "default"}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isEnrolled) {
                            navigate(`/courses/${course.id}`)
                          } else {
                            handleEnroll(course.id)
                          }
                        }}
                        disabled={isEnrolling || user?.role === "instructor" || (!localStorage.getItem("access_token") && !sessionStorage.getItem("access_token"))}
                        className="w-full"
                      >
                        {isEnrolling ? "Enrolling..." : isEnrolled ? "Continue Learning" : user?.role === "instructor" ? "Instructor Account" : "Enroll Now"}
                      </Button>
                      {user?.role === "instructor" && <p className="text-[10px] text-slate-500 mt-1 text-center w-full">Instructors cannot enroll</p>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}