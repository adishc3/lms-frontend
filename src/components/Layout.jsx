import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ShieldCheck, BookOpen, BarChart2, Award, LogOut, Settings, Users, Brain, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
    if (!token) return
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setUser(data) })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    sessionStorage.removeItem("access_token")
    navigate("/login")
  }

  const navLinks = [
    { label: "Dashboard", path: "/home", icon: BarChart2 },
    ...(user?.role === "student" ? [
      { label: "Courses", path: "/courses", icon: BookOpen },
      { label: "My Courses", path: "/my-courses", icon: ClipboardList },
      { label: "Progress", path: "/progress", icon: BarChart2 },
      { label: "Certificates", path: "/certificates", icon: Award },
      { label: "AI Assistant", path: "/ai", icon: Brain },
    ] : []),
    ...(user?.role === "instructor" ? [
      { label: "My Courses", path: "/my-courses", icon: BookOpen },
    ] : []),
    ...(user?.role === "admin" ? [
      { label: "Admin", path: "/admin", icon: Users },
    ] : []),
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
            <ShieldCheck className="w-7 h-7 text-[#60A5FA]" />
            <span className="text-xl font-bold">BeginnerLMS</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, path, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(path)
                    ? "bg-slate-800 text-[#60A5FA]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
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
