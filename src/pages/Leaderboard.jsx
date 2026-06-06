import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Layout from "@/components/Layout"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import { Trophy, ArrowRight } from "lucide-react"
import apiFetch from "@/lib/api"

export default function Leaderboard() {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
    if (!token) {
      navigate("/login")
      return
    }

    const fetchLeaderboard = async () => {
      setLoading(true)
      setError("")
      try {
        const response = await apiFetch("/api/insights/leaderboard", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || data.message || "Unable to load leaderboard")
        }
        const data = await response.json()
        setLeaderboard(data.leaderboard || [])
      } catch (err) {
        console.error(err)
        setError(err.message || "Failed to load leaderboard")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [navigate])

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-slate-400">See the top learners by points and level.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/home")}>Back to dashboard</Button>
        </div>

        {loading ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-16 text-center">
              <WaveLoader message="Loading leaderboard..." />
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="bg-red-950/70 border-red-800">
            <CardContent className="py-8 text-center">
              <p className="text-red-300">{error}</p>
              <Button variant="outline" onClick={() => navigate("/home")}>Return</Button>
            </CardContent>
          </Card>
        ) : leaderboard.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto mb-4 w-10 h-10 text-[#60A5FA]" />
              <p className="text-slate-400">No leaderboard data is available yet.</p>
              <Button variant="outline" className="mt-6" onClick={() => navigate("/courses")}>Browse Courses</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {leaderboard.map((row, index) => (
              <Card key={row.user_id} className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-slate-950 font-bold">{index + 1}</span>
                    {row.full_name || `User #${row.user_id}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-400">Points</p>
                    <p className="text-xl font-semibold text-white">{row.points}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Level</p>
                    <p className="text-xl font-semibold text-white">{row.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">User ID</p>
                    <p className="text-xl font-semibold text-white">{row.user_id}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
