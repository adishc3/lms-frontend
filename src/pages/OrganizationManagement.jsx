import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import { Users, Plus, ArrowRight } from "lucide-react"
import apiFetch from "@/lib/api"

export default function OrganizationManagement() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [assignOrgId, setAssignOrgId] = useState("")
  const [assignUserId, setAssignUserId] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
    if (!token) {
      navigate("/login")
      return
    }

    const fetchOrganizations = async () => {
      setLoading(true)
      setError("")
      try {
        const response = await apiFetch("/api/organizations", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || data.message || "Unable to load organizations")
        }
        const data = await response.json()
        setOrganizations(data)
      } catch (err) {
        console.error(err)
        setError(err.message || "Failed to load organizations")
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [navigate])

  const handleCreate = async () => {
    setError("")
    setStatus("")
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) return navigate("/login")
      const response = await apiFetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || data.message || "Unable to create organization")
      }
      const data = await response.json()
      setOrganizations((prev) => [...prev, data])
      setName("")
      setStatus("Organization created successfully.")
    } catch (err) {
      console.error(err)
      setError(err.message || "Unable to create organization")
    }
  }

  const handleAssign = async () => {
    setError("")
    setStatus("")
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
      if (!token) return navigate("/login")
      const response = await apiFetch(`/api/organizations/${assignOrgId}/assign-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: Number(assignUserId) }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || data.message || "Unable to assign user")
      }
      setAssignOrgId("")
      setAssignUserId("")
      setStatus("User assigned successfully.")
    } catch (err) {
      console.error(err)
      setError(err.message || "Unable to assign user")
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organizations</h1>
            <p className="text-slate-400">Manage organizations and assign users for enterprise access.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin")}>Back to admin</Button>
        </div>

        {loading ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-16 text-center">
              <WaveLoader message="Loading organizations..." />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle>Existing organizations</CardTitle>
                  <CardDescription>View the configured organizations available to assign users.</CardDescription>
                </CardHeader>
                <CardContent>
                  {organizations.length === 0 ? (
                    <p className="text-slate-400">No organizations have been created yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {organizations.map((org) => (
                        <div key={org.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold text-white">{org.name}</p>
                              <p className="text-slate-500 text-sm">ID: {org.id}</p>
                            </div>
                            <Users className="w-6 h-6 text-cyan-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle>Create organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Organization name"
                    className="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                  <Button onClick={handleCreate} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={!name.trim()}>
                    <Plus className="w-4 h-4 mr-2" /> Create organization
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Assign user to organization</CardTitle>
                <CardDescription>Provide a user ID and select an organization.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  value={assignOrgId}
                  onChange={(e) => setAssignOrgId(e.target.value)}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                <input
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  placeholder="User ID"
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
                <Button onClick={handleAssign} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={!assignOrgId || !assignUserId}>
                  Assign user
                </Button>
                {status && <p className="text-green-300">{status}</p>}
                {error && <p className="text-red-300">{error}</p>}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
