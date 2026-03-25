import { Bell, Menu, Moon, Sun, User, Monitor } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "../components/ui/sheet"
import { useThemeStore } from "../store/useThemeStore"
import { useAuthStore } from "../store/useAuthStore"
import { useUiStore } from "../store/useUiStore"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { getNavLinks } from "./Sidebar"
import { notificationApi } from "../api/notificationApi"

export function TopNav() {
  const { theme, setTheme } = useThemeStore()
  const { logout, user, role } = useAuthStore()
  const { isSidebarCollapsed, toggleSidebar } = useUiStore()
  const navigate = useNavigate()
  const location = useLocation()
  const mobileLinks = getNavLinks(role)
  const queryClient = useQueryClient()

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(0, 8),
  })

  const markReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] })
    },
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const notifications = notificationsQuery.data?.content ?? []
  const unreadCount = notifications.filter((item) => !item.read).length
  const routeTitle = deriveRouteTitle(location.pathname, role)

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-white/10 bg-background/55 px-4 backdrop-blur-2xl lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 border-white/20 bg-white/70 md:hidden dark:bg-white/5"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col bg-background/95">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <nav className="mt-6 grid gap-2 text-sm font-medium">
            {mobileLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} to={link.href} className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-muted">
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="hidden rounded-2xl border-white/20 bg-white/70 md:inline-flex dark:bg-white/5"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}</span>
          </Button>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{role ?? 'workspace'}</p>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{role ?? 'workspace'}</p>
            <p className="truncate text-lg font-semibold tracking-tight">{routeTitle}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="glass-panel flex min-w-[280px] items-center gap-3 rounded-[1.2rem] px-4 py-3 text-sm">
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              Live
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {user?.name ? `Welcome back, ${user.name}` : "Focused learning workspace"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Premium shell, adaptive practice, and course-aware AI tutoring.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-2xl">
              {theme === 'light' ? <Sun className="h-5 w-5" /> : theme === 'dark' ? <Moon className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-2xl bg-white/55 dark:bg-white/5">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[360px] p-0">
            <DropdownMenuLabel className="border-b border-border/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs font-normal text-muted-foreground">Recent activity across your workspace</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {unreadCount} unread
                </span>
              </div>
            </DropdownMenuLabel>
            <div className="max-h-[380px] overflow-y-auto">
              {notificationsQuery.isLoading ? (
                <div className="space-y-3 p-4 text-sm text-muted-foreground">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No notifications yet.</div>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => !item.read && markReadMutation.mutate(item.id)}
                    className={`block w-full border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${!item.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-6">{item.message}</p>
                      {!item.read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="h-11 rounded-2xl px-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="max-w-[120px] truncate text-sm font-semibold">{user?.name || "Account"}</p>
                <p className="max-w-[120px] truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {role || "user"}
                </p>
              </div>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name || 'My Account'}</span>
                {user?.email && (
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function deriveRouteTitle(pathname: string, role?: string | null) {
  if (pathname.includes("/student/skills")) return "AI Skill Mastery"
  if (pathname.includes("/student/leaderboard")) return "Leaderboard and Streaks"
  if (pathname.includes("/student/courses/") && pathname.includes("/player")) return "Course Player"
  if (pathname.includes("/student/courses/")) return "Course Overview"
  if (pathname.includes("/student/courses")) return "Course Discovery"
  if (pathname.includes("/trainer/courses/new")) return "Course Builder"
  if (pathname.includes("/trainer/courses")) return "Trainer Studio"
  if (pathname.includes("/admin/users")) return "User Management"
  if (pathname.includes("/admin/courses")) return "Course Moderation"
  if (pathname.includes("/profile")) return "Profile Settings"
  if (role === "ADMIN") return "Platform Control Center"
  if (role === "TRAINER") return "Trainer Dashboard"
  return "Learning Dashboard"
}
