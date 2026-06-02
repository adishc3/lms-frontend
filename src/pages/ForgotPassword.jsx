import { useState } from "react"
import { Link } from "react-router-dom"
import apiFetch from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await apiFetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Request failed")
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="fixed inset-0 bg-zinc-950 text-zinc-50 grid place-items-center px-4">
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />

      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900/70 backdrop-blur">
        <CardHeader className="space-y-1">
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <p className="text-sm text-zinc-300">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              </p>
              <p className="text-xs text-zinc-500">Check your inbox and follow the link to reset your password.</p>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600"
                  />
                </div>
              </div>
              {error && <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
              <Button type="submit" className="w-full bg-zinc-50 text-zinc-900 hover:bg-zinc-200" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </CardContent>
          </form>
        )}

        <CardFooter className="flex items-center justify-center text-sm text-zinc-400">
          <Link to="/login" className="flex items-center gap-1 text-zinc-300 hover:underline">
            <ArrowLeft className="w-3 h-3" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </section>
  )
}
