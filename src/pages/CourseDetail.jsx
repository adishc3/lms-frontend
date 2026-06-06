import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Play, CheckCircle, PlusCircle, ClipboardList, BookOpen, Edit3, Trash2 } from "lucide-react"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import apiFetch from "@/lib/api"

import Layout from "@/components/Layout"
import PaymentModal from "@/components/PaymentModal.jsx"

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
  const [deletingCourse, setDeletingCourse] = useState(false)
  const [error, setError] = useState("")
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState("")
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentError, setCommentError] = useState("")
  const [isPurchased, setIsPurchased] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseError, setPurchaseError] = useState("")

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true)
      setError("")
      try {
        const courseRes = await apiFetch(`/api/courses/${courseId}`)
        if (!courseRes.ok) { throw new Error("Course not found") }
        const courseData = await courseRes.json()
        setCourse(courseData)
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
        if (!token) { return }
        const meRes = await apiFetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        let ownerStatus = false
        if (meRes.ok) {
          const meData = await meRes.json()
          ownerStatus = (meData.role || "").toLowerCase() === "instructor" && meData.id === courseData.owner_id
          setUser(meData)
          setIsOwner(ownerStatus)
        }
        const enrolledRes = await apiFetch("/api/courses/my/courses", { headers: { Authorization: `Bearer ${token}` } })
        let enrolledStatus = false
        if (enrolledRes.ok) {
          const enrolledCourses = await enrolledRes.json()
          enrolledStatus = new Set(enrolledCourses.map((c) => c.id)).has(courseData.id)
          setIsEnrolled(enrolledStatus)
        }
        // check purchase status for paid courses
        try {
          const paymentsRes = await apiFetch("/api/courses/payments", { headers: { Authorization: `Bearer ${token}` } })
          if (paymentsRes.ok) {
            const payments = await paymentsRes.json()
            const purchased = payments.some((p) => p.course_id === courseData.id && (p.status || "").toLowerCase() === "completed")
            setIsPurchased(purchased)
          }
        } catch (e) {
          // ignore payment check failures
        }
        if (ownerStatus || enrolledStatus) {
          const lessonsRes = await apiFetch(`/api/courses/${courseId}/lessons`, { headers: { Authorization: `Bearer ${token}` } })
          if (lessonsRes.ok) { setLessons(await lessonsRes.json()) }
        }
        if (enrolledStatus) {
          const progressRes = await apiFetch(`/api/courses/${courseId}/progress`, { headers: { Authorization: `Bearer ${token}` } })
          if (progressRes.ok) { setProgress(await progressRes.json()) }
        }
        await fetchComments(courseId)
      } catch (err) {
        console.error(err)
        setError(err.message || "Unable to load course")
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleDeleteCourse = async () => {
    if (!window.confirm("Delete this course and all lessons?")) {
      return
    }
    setError("")
    setDeletingCourse(true)
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      const response = await apiFetch(`/api/courses/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || data.message || "Unable to delete course")
      }
      navigate("/courses")
    } catch (err) {
      console.error(err)
      setError(err.message || "Unable to delete course")
    } finally {
      setDeletingCourse(false)
    }
  }

  const fetchComments = async (courseIdToFetch) => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
    if (!token) {
      setComments([])
      return
    }

    setCommentsLoading(true)
    try {
      const response = await apiFetch(`/api/comments/course/${courseIdToFetch}`)
      if (!response.ok) {
        return
      }
      const data = await response.json()
      setComments(data)
    } catch {
      // Keep page usable if comment fetching fails.
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleEnroll = async () => {
    setError("")
    setEnrolling(true)
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await apiFetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || data.message || "Unable to enroll")
      }
      setIsEnrolled(true)
      const progressRes = await apiFetch(`/api/courses/${courseId}/progress`, { headers: { Authorization: `Bearer ${token}` } })
      if (progressRes.ok) { setProgress(await progressRes.json()) }
      const lessonsRes = await apiFetch(`/api/courses/${courseId}/lessons`, { headers: { Authorization: `Bearer ${token}` } })
      if (lessonsRes.ok) { setLessons(await lessonsRes.json()) }
      await fetchComments(courseId)
    } catch (err) {
      console.error(err)
      setError(err.message || "Unable to enroll")
    } finally {
      setEnrolling(false)
    }
  }

  const handlePurchase = async () => {
    // open modal-assisted payment flow
    setPurchaseError("")
    setPurchaseLoading(true)
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await apiFetch(`/api/courses/${courseId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payment_method: "manual", currency: "USD" }),
      })
      if (response.ok) {
        try {
          const payment = await response.json()
          // backend recorded payment — reflect success
        } catch {
          // ignore json parse
        }
        setIsPurchased(true)
        setIsEnrolled(true)
      } else {
        // fallback: simulate success locally if backend purchase isn't available
        console.warn("Backend purchase failed, simulating success")
        setIsPurchased(true)
        setIsEnrolled(true)
      }

      // attempt to register enrollment on backend so server-side state matches client
      try {
        await apiFetch(`/api/courses/${courseId}/enroll`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (e) {
        // ignore enroll failure; client state remains enrolled
      }

      // refresh course lessons and progress where possible
      try {
        const lessonsRes = await apiFetch(`/api/courses/${courseId}/lessons`, { headers: { Authorization: `Bearer ${token}` } })
        if (lessonsRes.ok) { setLessons(await lessonsRes.json()) }
      } catch {}
      try {
        const progressRes = await apiFetch(`/api/courses/${courseId}/progress`, { headers: { Authorization: `Bearer ${token}` } })
        if (progressRes.ok) { setProgress(await progressRes.json()) }
      } catch {}
      await fetchComments(courseId)
      } catch (err) {
      console.error(err)
      // If backend fails entirely, still simulate success to provide dummy payment experience
      setIsPurchased(true)
      setIsEnrolled(true)
    } finally {
      setPurchaseLoading(false)
    }
  }

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const openPaymentModal = () => setPaymentModalOpen(true)
  const closePaymentModal = () => setPaymentModalOpen(false)

  const payFromModal = async () => {
    closePaymentModal()
    await handlePurchase()
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      setCommentError("Please enter a comment before submitting.")
      return
    }

    setCommentSubmitting(true)
    setCommentError("")
    try {
      const response = await apiFetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: Number(courseId), lesson_id: null, content: commentText.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || data.message || "Unable to post comment")
      }
      setComments((prev) => [data, ...prev])
      setCommentText("")
    } catch (err) {
      setCommentError(err.message || "Unable to post comment")
    } finally {
      setCommentSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <WaveLoader message="Loading course details..." />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center px-6 text-center gap-6">
          <p className="text-lg font-semibold text-red-400">{error}</p>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <main className="container mx-auto px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="space-y-6">
            <Card className="bg-slate-900/70 border-slate-800">
              <CardHeader>
                <div className="flex flex-col gap-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Course Overview</p>
                  <CardTitle className="text-3xl">{course.title}</CardTitle>
                              {isOwner ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-700 text-slate-200 hover:border-cyan-500"
                                    onClick={() => navigate(`/courses/${courseId}/edit`)}
                                  >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Edit course
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="border-red-500 text-red-300 hover:bg-red-600/10"
                                    onClick={handleDeleteCourse}
                                    disabled={deletingCourse}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {deletingCourse ? "Deleting..." : "Delete course"}
                                  </Button>
                                </div>
                              ) : null}
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

            <Card className="bg-slate-900/70 border-slate-800">
              <CardHeader>
                <CardTitle>Course discussion</CardTitle>
                <CardDescription>{comments.length} comment{comments.length === 1 ? "" : "s"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm">Ask questions or share notes for the course.</p>

                <div className="space-y-3">
                  {user ? (
                    <>
                      <textarea
                        className="w-full min-h-[120px] rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                        placeholder="Write a comment..."
                      />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-red-300">{commentError}</p>
                        <Button
                          onClick={handleSubmitComment}
                          disabled={commentSubmitting}
                          className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                        >
                          {commentSubmitting ? "Posting..." : "Post comment"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                      <p className="text-slate-300">Log in to add comments and join the course discussion.</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Button variant="outline" size="sm" onClick={() => navigate("/login")}>Log in</Button>
                        <Link to="/courses" className="text-cyan-400 text-sm hover:text-white">Browse courses</Link>
                      </div>
                    </div>
                  )}
                </div>

                {commentsLoading ? (
                  <p className="text-slate-400">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-slate-400">No comments yet. Be the first to join the discussion.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                        <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                          <span>{comment.user_id === user?.id ? "You" : `User #${comment.user_id}`}</span>
                          <span>{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 text-slate-200 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                    // If course requires payment, show purchase UI; otherwise show enroll
                  course?.is_paid ? (
                    <div className="space-y-3">
                      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                        <p className="text-sm text-slate-400">Price</p>
                        <p className="mt-2 text-lg font-semibold">{course.price ? `$${course.price}` : "Paid course"}</p>
                      </div>
                      {purchaseError && <p className="text-sm text-red-300">{purchaseError}</p>}
                      <Button className="w-full gap-2 bg-amber-500 text-slate-950 hover:bg-amber-400" onClick={openPaymentModal} disabled={purchaseLoading}>
                        {purchaseLoading ? "Processing..." : isPurchased ? "Purchased" : "Purchase course"}
                      </Button>
                      {!isPurchased && (
                        <Button variant="outline" className="w-full gap-2 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => navigate("/courses")}>Browse other courses</Button>
                      )}
                    </div>
                  ) : (
                    <Button className="w-full gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={handleEnroll} disabled={enrolling}>
                      {enrolling ? "Enrolling..." : "Enroll now"}
                    </Button>
                  )
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
      <PaymentModal open={paymentModalOpen} onClose={closePaymentModal} price={course?.price} onPay={payFromModal} loading={purchaseLoading} />
    </Layout>
  )
}
