import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"
import { useUiStore } from "../store/useUiStore"
import { cn } from "../lib/utils"
import {
  ArrowUpRight,
  BookOpen,
  LayoutDashboard,
  Award,
  BarChart,
  Users,
  BookOpenCheck,
  Sparkles,
  Rocket,
  ShieldCheck,
} from "lucide-react"

export function getNavLinks(role?: string | null) {
  const defaultLinks = [
    { name: "Dashboard", href: `/${role?.toLowerCase() || 'student'}`, icon: LayoutDashboard },
  ]

  if (role === 'STUDENT') {
    return [
      ...defaultLinks,
      { name: "My Courses", href: "/student/courses", icon: BookOpen },
      { name: "Skill Mastery", href: "/student/skills", icon: Award },
      { name: "Leaderboard", href: "/student/leaderboard", icon: BarChart },
    ]
  }

  if (role === 'TRAINER') {
    return defaultLinks
  }

  if (role === 'ADMIN') {
    return [
      ...defaultLinks,
      { name: "Course Approvals", href: "/admin/courses", icon: BookOpenCheck },
      { name: "User Management", href: "/admin/users", icon: Users },
    ]
  }

  return defaultLinks
}

export function Sidebar() {
  const { role, user } = useAuthStore()
  const { isSidebarCollapsed } = useUiStore()
  const location = useLocation()
  const links = getNavLinks(role)
  const roleTone = role === "ADMIN" ? "Platform Control" : role === "TRAINER" ? "Creator Studio" : "Skill Track"
  const roleSummary = role === "ADMIN"
    ? "Moderate courses, users, and platform quality."
    : role === "TRAINER"
      ? "Build stronger courses and manage publishing."
      : "Keep your streak, mastery, and projects moving."
  const roleIcon = role === "ADMIN" ? ShieldCheck : role === "TRAINER" ? Rocket : Sparkles
  const RoleIcon = roleIcon

  return (
    <aside className={`fixed hidden h-screen border-r border-sidebar-border/70 bg-sidebar/92 text-sidebar-foreground backdrop-blur-2xl transition-[width] duration-300 md:block ${isSidebarCollapsed ? 'w-24' : 'w-64'}`}>
      <div className="flex h-full max-h-screen flex-col gap-4 px-4 py-5">
        <div className="border-b border-sidebar-border/70 px-1 pb-5">
          <Link to="/" className={`flex items-center font-semibold ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_16px_40px_-20px_rgba(56,189,248,0.55)]">
              <Award className="h-5 w-5" />
            </div>
            <div className={cn("transition-opacity duration-200", isSidebarCollapsed && "hidden")}>
              <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">SkillForge</p>
              <p className="text-xs text-sidebar-foreground/60">Learning workspace</p>
            </div>
          </Link>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-white/8 via-white/5 to-white/0 px-4 py-4 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.55)]">
          <div className={`flex ${isSidebarCollapsed ? 'justify-center' : 'items-start gap-3'}`}>
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <RoleIcon className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div className={cn("transition-opacity duration-200", isSidebarCollapsed && "hidden")}>
              <p className="text-[11px] uppercase tracking-[0.24em] text-sidebar-foreground/55">{roleTone}</p>
              <p className="mt-1 text-sm font-semibold text-sidebar-foreground">{user?.name || "Workspace"}</p>
              <p className="mt-2 text-sm leading-6 text-sidebar-foreground/70">
                {roleSummary}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-4">
          <div className={cn("mb-3 px-2", isSidebarCollapsed && "hidden")}>
            <p className="text-[11px] uppercase tracking-[0.24em] text-sidebar-foreground/50">Navigation</p>
          </div>
          <nav className="grid items-start gap-1 px-1 text-sm font-medium">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.href || 
                (link.href !== '/student' && link.href !== '/trainer' && link.href !== '/admin' && location.pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "group flex items-center rounded-[1.25rem] px-3 py-3 transition-all duration-200",
                    isSidebarCollapsed ? "justify-center" : "gap-3",
                    isActive
                      ? "bg-white text-slate-950 shadow-[0_18px_45px_-28px_rgba(255,255,255,0.9)]"
                      : "text-sidebar-foreground/72 hover:bg-white/7 hover:text-sidebar-foreground"
                  )}
                  title={isSidebarCollapsed ? link.name : undefined}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                    isActive ? "bg-slate-950/8" : "bg-white/6 group-hover:bg-white/10"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={cn("transition-opacity duration-200", isSidebarCollapsed && "hidden")}>{link.name}</span>
                  {isActive && !isSidebarCollapsed ? <ArrowUpRight className="ml-auto h-4 w-4 opacity-70" /> : null}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className={cn("rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4", isSidebarCollapsed && "hidden")}>
          <p className="text-[11px] uppercase tracking-[0.24em] text-sidebar-foreground/50">Focus mode</p>
          <p className="mt-2 text-sm leading-6 text-sidebar-foreground/70">
            Cleaner surfaces, stronger hierarchy, and less visual noise across the app.
          </p>
        </div>
      </div>
    </aside>
  )
}
