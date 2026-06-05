import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import { Users, Shield, Download, Upload, Search, Edit2, Check, X, Activity } from "lucide-react"
import apiFetch, { apiUrl } from "@/lib/api"

const ROLES = ["student", "instructor", "admin"]

export default function Admin() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("users") // "users" | "logs"
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

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
              <CardDescription>Recent admin actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No activity logs yet.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                      <Activity className="w-4 h-4 text-[#60A5FA] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{log.action}</span>
                          <span className="text-xs text-slate-500">by user #{log.user_id}</span>
                          {log.ip_address && <span className="text-xs text-slate-600">{log.ip_address}</span>}
                        </div>
                        {log.details && <p className="text-xs text-slate-500 mt-0.5">{log.details}</p>}
                        <p className="text-xs text-slate-600 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
