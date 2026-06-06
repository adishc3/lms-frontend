import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ShieldCheck, BookOpen, BarChart2, Award, LogOut, Users, Brain, ClipboardList, Trophy, CreditCard, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

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

  const isActive = (path) => location.pathname === path
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
            <ShieldCheck className="w-7 h-7 text-[#60A5FA]" />
            <span className="text-xl font-bold">Learn@will</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {primaryLinks.map(({ label, path, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(path)
                    ? "bg-slate-800 text-[#60A5FA]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}

            {secondaryLinks.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMore((s) => !s)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="hidden lg:inline">More</span>
                </button>
                {showMore && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-900 border border-slate-800 shadow-lg z-40">
                    <div className="flex flex-col p-2">
                      {secondaryLinks.map(({ label, path, icon: Icon }) => (
                        <button
                          key={path}
                          onClick={() => { setShowMore(false); navigate(path) }}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 rounded"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

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
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
