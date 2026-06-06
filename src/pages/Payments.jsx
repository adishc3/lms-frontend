import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Layout from "@/components/Layout"
import { WaveLoader } from "@/components/WaveLoader.jsx"
import { CreditCard, ArrowRight } from "lucide-react"
import apiFetch from "@/lib/api"

export default function Payments() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
    if (!token) {
      navigate("/login")
      return
    }

    const fetchPayments = async () => {
      setLoading(true)
      setError("")
      try {
        const response = await apiFetch("/api/courses/payments", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || data.message || "Unable to load payments")
        }
        const data = await response.json()
        // merge with locally simulated payments (for dummy flows)
        const local = JSON.parse(localStorage.getItem("simulated_payments") || "[]")
        const merged = [...(data || []), ...local]
        setPayments(merged)
      } catch (err) {
        console.error(err)
        setError(err.message || "Failed to load payments")
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [navigate])

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment History</h1>
            <p className="text-slate-400">View your purchased courses and payment records.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/courses")}>Browse courses</Button>
        </div>

        {loading ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-16 text-center">
              <WaveLoader message="Loading payment history..." />
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="bg-red-950/70 border-red-800">
            <CardContent className="py-8 text-center">
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        ) : payments.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12 text-center">
              <CreditCard className="mx-auto mb-4 w-10 h-10 text-[#60A5FA]" />
              <p className="text-slate-400">No payments have been made yet.</p>
              <Button variant="outline" className="mt-6" onClick={() => navigate("/courses")}>Purchase a course</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {payments.map((payment) => (
              <Card key={payment.id} className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-4">
                    <span>Course #{payment.course_id}</span>
                    <span className="text-sm text-slate-400">{new Date(payment.created_at).toLocaleDateString()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-400">Amount</p>
                    <p className="text-white text-lg font-semibold">{payment.currency} {payment.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    <p className="text-lg font-semibold text-green-300">{payment.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Payment ID</p>
                    <p className="text-sm text-slate-200">{payment.id}</p>
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  <Button variant="link" className="text-[#60A5FA]" onClick={() => navigate(`/courses/${payment.course_id}`)}>
                    View course <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
