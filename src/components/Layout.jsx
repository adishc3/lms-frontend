import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ShieldCheck, BookOpen, BarChart2, Award, LogOut, Users, Brain, ClipboardList, Trophy, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import NavBar from "@/components/NavBar"

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [locale, setLocale] = useState("en")

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
    if (!token) return
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setUser(data) })
      .catch(() => {})
    const stored = localStorage.getItem("locale") || navigator.language?.slice(0,2) || "en"
    setLocale(stored)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    sessionStorage.removeItem("access_token")
    navigate("/login")
  }

  const primaryLinks = [
    { label: "Dashboard", path: "/home", icon: BarChart2 },
    { label: "Courses", path: "/courses", icon: BookOpen },
    { label: "My Courses", path: "/my-courses", icon: ClipboardList },
    { label: "Progress", path: "/progress", icon: BarChart2 },
  ]

  const secondaryLinks = []
  if (user?.role === "student") {
    secondaryLinks.push({ label: "Certificates", path: "/certificates", icon: Award })
    secondaryLinks.push({ label: "AI Assistant", path: "/ai", icon: Brain })
    secondaryLinks.push({ label: "Leaderboard", path: "/leaderboard", icon: Trophy })
    secondaryLinks.push({ label: "Payments", path: "/payments", icon: CreditCard })
  }
  if (user?.role === "instructor") {
    secondaryLinks.push({ label: "Leaderboard", path: "/leaderboard", icon: Trophy })
  }
  if (user?.role === "admin") {
    secondaryLinks.push({ label: "Admin", path: "/admin", icon: Users })
    secondaryLinks.push({ label: "Organizations", path: "/organizations", icon: Users })
    secondaryLinks.push({ label: "Leaderboard", path: "/leaderboard", icon: Trophy })
  }

  const navLinks = [
    { label: "Dashboard", path: "/home" },
    { label: "Courses", path: "/courses" },
    { label: "My Courses", path: "/my-courses" },
    { label: "Progress", path: "/progress" },
  ]

  if (user?.role === "student") {
    navLinks.push({ label: "Certificates", path: "/certificates" })
    navLinks.push({ label: "AI Assistant", path: "/ai" })
    navLinks.push({ label: "Leaderboard", path: "/leaderboard" })
    navLinks.push({ label: "Payments", path: "/payments" })
  }
  if (user?.role === "instructor") {
    navLinks.push({ label: "Leaderboard", path: "/leaderboard" })
  }
  if (user?.role === "admin") {
    navLinks.push({ label: "Admin", path: "/admin" })
    navLinks.push({ label: "Organizations", path: "/organizations" })
    navLinks.push({ label: "Leaderboard", path: "/leaderboard" })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
            <NavBar
        brand="Learn@will"
        navLinks={navLinks}
        rightContent={(
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold">{user.full_name || user.email}</span>
                <span className="text-xs text-slate-400 capitalize">{user.role}</span>
              </div>
            )}
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="text-[#60A5FA] font-bold text-sm">
                {(user?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
              </span>
            </div>
            <select
              value={locale}
              onChange={(e) => { setLocale(e.target.value); localStorage.setItem("locale", e.target.value); window.location.reload(); }}
              className="hidden sm:inline rounded-lg bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 mr-2"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-700 text-slate-400 hover:text-white gap-1.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        )}
      />

      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

