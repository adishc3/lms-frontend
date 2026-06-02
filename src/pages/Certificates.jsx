import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Layout from "@/components/Layout"
import { Award, Download, ExternalLink, CheckCircle } from "lucide-react"

export default function Certificates() {
  const navigate = useNavigate()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [verifyId, setVerifyId] = useState("")
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifying, setVerifying] = useState(false)

  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")

  useEffect(() => {
    if (!token) { navigate("/login"); return }
    fetch("/api/certificates/my", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject("Failed to load certificates"))
      .then(setCertificates)
      .catch((e) => setError(typeof e === "string" ? e : "Unable to load certificates"))
      .finally(() => setLoading(false))
  }, [navigate, token])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!verifyId.trim()) return
    setVerifying(true)
    setVerifyResult(null)
    try {
      const res = await fetch(`/api/certificates/verify/${verifyId.trim()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Certificate not found")
      setVerifyResult({ valid: true, ...data })
    } catch (err) {
      setVerifyResult({ valid: false, message: err.message })
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#60A5FA] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">My Certificates</h1>
          <p className="text-slate-400 mt-1">Certificates earned by completing courses</p>
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-800 px-4 py-3 text-sm text-red-300">{error}</div>}

        {/* Certificates grid */}
        {certificates.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-16 text-center">
              <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">No certificates yet</p>
              <p className="text-slate-400 mb-6">Complete a course to earn your first certificate.</p>
              <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {certificates.map((cert) => (
              <Card key={cert.certificate_id} className="bg-slate-900/70 border-slate-800 hover:border-yellow-500/40 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <Award className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{cert.course_title || "Course Certificate"}</CardTitle>
                      <CardDescription className="mt-1">
                        Issued {new Date(cert.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </CardDescription>
                      <p className="text-xs text-slate-600 mt-1 font-mono">{cert.certificate_id}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <a
                      href={`/api/certificates/download/${cert.certificate_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full gap-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20" variant="outline">
                        <Download className="w-4 h-4" />
                        Download PDF
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Certificate Verification */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#60A5FA]" />
              Verify a Certificate
            </CardTitle>
            <CardDescription>Enter a certificate ID to verify its authenticity</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="flex gap-3">
              <input
                type="text"
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                placeholder="Enter certificate ID..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/20"
              />
              <Button type="submit" disabled={verifying || !verifyId.trim()}>
                {verifying ? "Verifying..." : "Verify"}
              </Button>
            </form>

            {verifyResult && (
              <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${verifyResult.valid ? "bg-green-900/20 border-green-800 text-green-300" : "bg-red-900/20 border-red-800 text-red-300"}`}>
                {verifyResult.valid ? (
                  <div className="space-y-1">
                    <p className="font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Valid Certificate
                    </p>
                    <p>Issued: {new Date(verifyResult.issued_at).toLocaleDateString()}</p>
                    <p>User ID: {verifyResult.user_id} · Course ID: {verifyResult.course_id}</p>
                  </div>
                ) : (
                  <p>{verifyResult.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
