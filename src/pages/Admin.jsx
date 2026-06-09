import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import { Users, Shield, Download, Upload, Search, Edit2, Check, X, Activity, BookOpen, GraduationCap, CreditCard, LogIn, Clock, Sparkles, Send } from "lucide-react"
import apiFetch, { apiUrl } from "@/lib/api"

const ROLES = ["student", "instructor", "admin"]

// Helper function to get action styling and icon
const getActionStyle = (action) => {
  const actionMap = {
    create_course: { icon: BookOpen, bg: "bg-blue-900/40", text: "text-blue-400", badge: "bg-blue-900/60 text-blue-200", label: "Course Created" },
    enroll_course: { icon: LogIn, bg: "bg-green-900/40", text: "text-green-400", badge: "bg-green-900/60 text-green-200", label: "Course Enrolled" },
    purchase_course: { icon: CreditCard, bg: "bg-yellow-900/40", text: "text-yellow-400", badge: "bg-yellow-900/60 text-yellow-200", label: "Course Purchased" },
    complete_lesson: { icon: GraduationCap, bg: "bg-purple-900/40", text: "text-purple-400", badge: "bg-purple-900/60 text-purple-200", label: "Lesson Completed" },
    list_users: { icon: Users, bg: "bg-slate-900/40", text: "text-slate-400", badge: "bg-slate-800/60 text-slate-200", label: "User List Viewed" },
    read_user: { icon: Users, bg: "bg-slate-900/40", text: "text-slate-400", badge: "bg-slate-800/60 text-slate-200", label: "User Viewed" },
    update_user: { icon: Users, bg: "bg-slate-900/40", text: "text-slate-400", badge: "bg-slate-800/60 text-slate-200", label: "User Updated" },
    import_users: { icon: Upload, bg: "bg-indigo-900/40", text: "text-indigo-400", badge: "bg-indigo-900/60 text-indigo-200", label: "Users Imported" },
    default: { icon: Activity, bg: "bg-slate-900/40", text: "text-slate-400", badge: "bg-slate-800/60 text-slate-200", label: "Activity" }
  }
  return actionMap[action] || actionMap.default
}

// Helper to format log details into human-readable text
const getLogDescription = (log) => {
  const action = log.action
  let description = ""
  
  if (action === "create_course") {
    description = "Created a new course"
  } else if (action === "enroll_course") {
    description = "Enrolled in a course"
  } else if (action === "purchase_course") {
    description = "Purchased a course"
  } else if (action === "complete_lesson") {
    description = "Completed a lesson"
  } else if (action === "import_users") {
    description = "Imported users from CSV"
  } else if (action === "update_user") {
    description = "Updated user details"
  } else if (action === "read_user") {
    description = "Viewed user details"
  } else if (action === "list_users") {
    description = "Viewed user list"
  }
  
  return description
}

export default function Admin() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("users") // "users" | "logs" | "ai"
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [aiMessages, setAiMessages] = useState([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")

const loadData = useCallback(async () => {
     setLoading(true)
     try {
       const [usersRes, logsRes] = await Promise.all([
         apiFetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
         apiFetch("/api/admin/logs", { headers: { Authorization: `Bearer ${token}` } }),
       ])
       if (usersRes.ok) setUsers(await usersRes.json())
       if (logsRes.ok) setLogs(await logsRes.json())
     } catch {
       setError("Failed to load admin data")
     } finally {
       setLoading(false)
     }
   }, [token])

   useEffect(() => {
     if (!token) { navigate("/login"); return }
     apiFetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
       .then((r) => r.ok ? r.json() : null)
       .then((user) => {
         if (!user || user.role !== "admin") { navigate("/home"); return }
         loadData()
       })
       .catch(() => navigate("/home"))
   }, [navigate, token, loadData])

  const startEdit = (user) => {
    setEditingUser(user.id)
    setEditForm({ full_name: user.full_name || "", role: user.role, is_active: user.is_active })
  }

  const saveEdit = async (userId) => {
    setSaving(true)
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error("Failed to update user")
      const updated = await res.json()
      setUsers((prev) => prev.map((u) => u.id === userId ? updated : u))
      setEditingUser(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    if (!importFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append("file", importFile)
      const res = await apiFetch("/api/admin/users/import-csv", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Import failed")
      setImportResult(data)
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleAiQuery = async (e) => {
    e.preventDefault()
    const query = aiInput.trim()
    if (!query) return

    const userMessage = { role: "user", content: query }
    setAiMessages((prev) => [...prev, userMessage])
    setAiInput("")
    setAiLoading(true)

    try {
      const res = await apiFetch("/api/admin/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to get AI insights")
      }
      if (!data.insight?.trim()) {
        throw new Error("AI returned empty insight. Check backend logs or quota.")
      }

      const aiMessage = { role: "assistant", content: data.insight }
      setAiMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      const errorMessage = { role: "assistant", content: `Error: ${err.message}` }
      setAiMessages((prev) => [...prev, errorMessage])
      setError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <WaveLoader message="Loading admin panel..." />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#60A5FA]" />
              Admin Panel
            </h1>
            <p className="text-slate-400 mt-1">Manage users and view system activity</p>
          </div>
          <a href={apiUrl("/api/admin/users/export-csv")} target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Users CSV
            </Button>
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: users.length, color: "text-[#60A5FA]" },
            { label: "Students", value: users.filter((u) => u.role === "student").length, color: "text-green-400" },
            { label: "Instructors", value: users.filter((u) => u.role === "instructor").length, color: "text-yellow-400" },
            { label: "Admins", value: users.filter((u) => u.role === "admin").length, color: "text-purple-400" },
          ].map((s) => (
            <Card key={s.label} className="bg-slate-900/50 border-slate-800 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-300">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
          {[
            { id: "users", label: "Users", icon: Users },
            { id: "logs", label: "Activity Logs", icon: Activity },
            { id: "ai", label: "AI Insights", icon: Sparkles },
            { id: "import", label: "Import CSV", icon: Upload },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-[#60A5FA] text-slate-950" : "text-slate-400 hover:text-white"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA]"
                  />
                </div>
                <span className="text-sm text-slate-500">{filteredUsers.length} users</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-widest">
                      <th className="text-left py-3 px-2">ID</th>
                      <th className="text-left py-3 px-2">Name</th>
                      <th className="text-left py-3 px-2">Email</th>
                      <th className="text-left py-3 px-2">Role</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                        <td className="py-3 px-2 text-slate-500">{user.id}</td>
                        <td className="py-3 px-2">
                          {editingUser === user.id ? (
                            <input
                              value={editForm.full_name}
                              onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white text-sm w-32 outline-none focus:border-[#60A5FA]"
                            />
                          ) : (
                            <span className="font-medium">{user.full_name || "—"}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-400">{user.email}</td>
                        <td className="py-3 px-2">
                          {editingUser === user.id ? (
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white text-sm outline-none focus:border-[#60A5FA]"
                            >
                              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              user.role === "admin" ? "bg-purple-900/40 text-purple-400 border border-purple-800" :
                              user.role === "instructor" ? "bg-yellow-900/40 text-yellow-400 border border-yellow-800" :
                              "bg-green-900/40 text-green-400 border border-green-800"
                            }`}>{user.role}</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {editingUser === user.id ? (
                            <select
                              value={editForm.is_active ? "true" : "false"}
                              onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.value === "true" }))}
                              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white text-sm outline-none focus:border-[#60A5FA]"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.is_active ? "bg-green-900/40 text-green-400 border border-green-800" : "bg-red-900/40 text-red-400 border border-red-800"}`}>
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {editingUser === user.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => saveEdit(user.id)} disabled={saving} className="p-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(user)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs tab */}
        {tab === "logs" && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Real-time system activity: courses, enrollments, lessons, purchases, and admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400">No activity logs yet. Activities will appear here as users interact with the system.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => {
                    const actionStyle = getActionStyle(log.action)
                    const ActionIcon = actionStyle.icon
                    const description = getLogDescription(log)
                    const timestamp = new Date(log.created_at)
                    const isToday = new Date().toDateString() === timestamp.toDateString()
                    const timeString = isToday 
                      ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : timestamp.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    
                    return (
                      <div key={log.id} className={`flex gap-4 p-4 rounded-xl border border-slate-700 ${actionStyle.bg} hover:border-slate-600 transition-colors`}>
                        <div className={`p-2.5 rounded-lg ${actionStyle.text} bg-slate-950/50 shrink-0 flex items-center justify-center`}>
                          <ActionIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${actionStyle.badge} border border-slate-700`}>
                                {actionStyle.label}
                              </span>
                              <span className="text-sm text-slate-300 font-medium">{description}</span>
                            </div>
                            <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeString}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">By:</span>
                              <span className="font-medium text-slate-300">{log.user_name || log.user_email}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-500">ID: {log.user_id}</span>
                            </div>
                            {log.details && (
                              <div className="mt-1 p-2 rounded bg-slate-950/40 border border-slate-800">
                                <p className="text-slate-300 font-mono text-xs">{log.details}</p>
                              </div>
                            )}
                            {log.ip_address && (
                              <div className="text-slate-500">
                                IP: <span className="text-slate-400 font-mono">{log.ip_address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Insights tab */}
        {tab === "ai" && (
          <Card className="bg-slate-900/50 border-slate-800 flex flex-col h-[600px]">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#60A5FA]" />
                AI System Insights
              </CardTitle>
              <CardDescription>
                Ask questions about user progress, courses, enrollments, and system activity
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {aiMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 mb-2">No messages yet</p>
                      <p className="text-sm text-slate-500">Try asking questions like:</p>
                      <ul className="text-xs text-slate-600 mt-2 space-y-1">
                        <li>• How many students completed the Python 101 course?</li>
                        <li>• What courses did instructor John create?</li>
                        <li>• Show me student progress summary</li>
                        <li>• Which lessons have the highest completion rates?</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  aiMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === "user" 
                          ? "bg-[#60A5FA] text-slate-950 rounded-br-none" 
                          : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-100 px-4 py-2 rounded-lg rounded-bl-none border border-slate-700">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: "0s"}}></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input area */}
              <form onSubmit={handleAiQuery} className="flex gap-2 pt-4 border-t border-slate-800">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask about users, courses, progress..."
                  disabled={aiLoading}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white text-sm outline-none focus:border-[#60A5FA] disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  className="gap-2 bg-[#60A5FA] hover:bg-[#60A5FA]/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Import tab */}
        {tab === "import" && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Import Users from CSV</CardTitle>
              <CardDescription>
                CSV must have columns: <code className="text-[#60A5FA]">email, password, full_name, role</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleImport} className="space-y-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#60A5FA]/10 file:text-[#60A5FA] hover:file:bg-[#60A5FA]/20"
                />
                <Button type="submit" disabled={importing || !importFile} className="gap-2">
                  <Upload className="w-4 h-4" />
                  {importing ? "Importing..." : "Import Users"}
                </Button>
              </form>
              {importResult && (
                <div className="mt-4 rounded-xl bg-green-900/20 border border-green-800 px-4 py-3 text-sm text-green-300">
                  <p className="font-semibold">Import complete: {importResult.imported} users imported</p>
                  {importResult.errors?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-yellow-400 font-medium">Errors ({importResult.errors.length}):</p>
                      <ul className="list-disc list-inside text-xs text-slate-400 mt-1 space-y-0.5">
                        {importResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
