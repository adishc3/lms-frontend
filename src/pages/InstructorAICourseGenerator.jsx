import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2, CheckCircle, AlertCircle, BookOpen } from "lucide-react"
import Layout from "@/components/Layout"
import apiFetch from "@/lib/api"

export default function InstructorAICourseGenerator() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [level, setLevel] = useState("beginner")
  const [durationWeeks, setDurationWeeks] = useState(4)
  const [numLessons, setNumLessons] = useState(8)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generating_and_creating, setGeneratingAndCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [generatedCourse, setGeneratedCourse] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    // Check if user is instructor
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
  }, [navigate, token])

  const handleGenerateStructure = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setGeneratedCourse(null)
    setGenerating(true)

    try {
      const response = await apiFetch("/api/courses/ai-generate/structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          level,
          duration_weeks: parseInt(durationWeeks),
          num_lessons: parseInt(numLessons),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to generate course structure")
      }

      setGeneratedCourse(data)
      setSuccess("Course structure generated successfully! Review it below.")
      setShowPreview(true)
    } catch (err) {
      setError(err.message || "Unable to generate course structure")
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateCourse = async () => {
    setError("")
    setSuccess("")
    setGeneratingAndCreating(true)

    try {
      const response = await apiFetch("/api/courses/ai-generate/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          level,
          duration_weeks: parseInt(durationWeeks),
          num_lessons: parseInt(numLessons),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to create course")
      }

      setSuccess("Course created successfully with AI-generated lessons!")
      setTimeout(() => {
        navigate(`/courses/${data.id}`)
      }, 2000)
    } catch (err) {
      setError(err.message || "Unable to create course")
    } finally {
      setGeneratingAndCreating(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-400" />
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-blue-400" />
              <h1 className="text-4xl font-bold">AI Course Generator</h1>
              <Sparkles className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-gray-400 text-lg">
              Create complete courses with AI-powered syllabus and lesson planning
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Details
                </CardTitle>
                <CardDescription>Provide information about your course</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateStructure} className="space-y-5">
                  <div>
                    <Label htmlFor="title" className="text-white">
                      Course Title *
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Advanced Python Programming"
                      className="mt-2 bg-slate-900 border-slate-600 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">
                      Course Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what students will learn..."
                      className="mt-2 bg-slate-900 border-slate-600 text-white placeholder:text-gray-500 min-h-24"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="level" className="text-white">
                        Level *
                      </Label>
                      <select
                        id="level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="mt-2 w-full bg-slate-900 border border-slate-600 rounded-md text-white px-3 py-2"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="duration" className="text-white">
                        Duration (weeks) *
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="52"
                        value={durationWeeks}
                        onChange={(e) => setDurationWeeks(e.target.value)}
                        className="mt-2 bg-slate-900 border-slate-600 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="lessons" className="text-white">
                      Number of Lessons *
                    </Label>
                    <Input
                      id="lessons"
                      type="number"
                      min="1"
                      max="50"
                      value={numLessons}
                      onChange={(e) => setNumLessons(e.target.value)}
                      className="mt-2 bg-slate-900 border-slate-600 text-white"
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-green-200 text-sm">{success}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={generating || generating_and_creating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Course Structure
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Preview */}
            {showPreview && generatedCourse && (
              <Card className="bg-slate-800/50 border-slate-700 md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Preview
                  </CardTitle>
                  <CardDescription>Review the AI-generated course structure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                  <div>
                    <h3 className="font-semibold text-white mb-2">{generatedCourse.course_title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{generatedCourse.course_description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Syllabus</h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {generatedCourse.syllabus.substring(0, 300)}...
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Lessons ({generatedCourse.lessons?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {generatedCourse.lessons?.map((lesson, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-slate-700/50 rounded border border-slate-600"
                        >
                          <p className="font-medium text-sm text-white">
                            {lesson.order}. {lesson.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {lesson.content.substring(0, 80)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateCourse}
                    disabled={generating_and_creating}
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-11 mt-4"
                  >
                    {generating_and_creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Course...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Create Course
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info Panel */}
            {!showPreview && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>AI-powered course creation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-white">Enter Course Details</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Provide title, description, level, and structure preferences
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-white">Generate Structure</p>
                        <p className="text-sm text-gray-400 mt-1">
                          AI creates a comprehensive syllabus and lesson plans
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-white">Review & Create</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Preview the generated content and create the course
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-white">Customize & Publish</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Edit lessons, add resources, and publish to students
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-600">
                    <p className="text-xs text-gray-400">
                      💡 Tip: Use descriptive details in your description for better AI-generated content
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
