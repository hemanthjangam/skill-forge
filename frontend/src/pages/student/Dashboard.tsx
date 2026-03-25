import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "../../store/useAuthStore"
import { dashboardApi } from "../../api/dashboardApi"
import { MetricCard } from "../../components/shared/MetricCard"
import { StreakHeatmap } from "../../components/shared/StreakHeatmap"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Skeleton } from "../../components/ui/skeleton"
import { BookOpen, Flame, Star, Target, CheckSquare, Bell, TrendingUp, CalendarDays, Trophy } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function StudentDashboard() {
  const { user } = useAuthStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: dashboardApi.getStudentDashboard,
  })

  const activityQuery = useQuery({
    queryKey: ['studentActivity'],
    queryFn: () => dashboardApi.getStudentActivity(182),
  })

  const activity = activityQuery.data ?? []

  const analytics = useMemo(() => {
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 6)

    const activeDays = activity.filter(item => item.knowledgeChecks > 0).length
    const currentWeekChecks = activity
      .filter(item => new Date(item.date) >= weekAgo)
      .reduce((sum, item) => sum + item.knowledgeChecks, 0)

    const recentTrend = activity.slice(-8).map((item) => ({
      label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      checks: item.knowledgeChecks,
      score: Math.round(item.averageScore),
    }))

    const weeklyMap = new Map<string, { week: string; checks: number }>()
    activity.forEach((item) => {
      const date = new Date(item.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7))
      const key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
      const existing = weeklyMap.get(key)
      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (existing) {
        existing.checks += item.knowledgeChecks
      } else {
        weeklyMap.set(key, { week: label, checks: item.knowledgeChecks })
      }
    })

    return {
      activeDays,
      currentWeekChecks,
      recentTrend,
      weeklyChecks: Array.from(weeklyMap.values()).slice(-8),
    }
  }, [activity])

  const renderMetrics = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      )
    }

    if (isError || !data) {
      return (
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          Failed to load dashboard data. Please refresh.
        </div>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Points"
          value={data.totalPoints.toLocaleString()}
          icon={Star}
          trend={{ value: `${data.knowledgeChecksCompleted} checks completed`, positive: true }}
        />
        <MetricCard
          title="Current Streak"
          value={`${data.currentStreak} days`}
          icon={Flame}
          trend={{ value: `Best: ${data.bestStreak} days`, positive: data.currentStreak > 0 }}
        />
        <MetricCard
          title="Avg Quiz Score"
          value={`${Math.round(data.averageQuizScore)}%`}
          icon={Target}
          trend={{ value: `${data.quizAttempts} total attempts`, positive: data.averageQuizScore >= 60 }}
        />
        <MetricCard
          title="Enrolled Courses"
          value={String(data.enrolledCourses)}
          icon={BookOpen}
          description={`${data.unreadNotifications} unread notification${data.unreadNotifications !== 1 ? 's' : ''}`}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="relative flex h-full min-h-[340px] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-7 text-white shadow-[0_28px_90px_-38px_rgba(15,23,42,0.75)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_35%)]" />
          <div className="relative flex w-full flex-col justify-between gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/75">
              <TrendingUp className="h-3.5 w-3.5" />
              Premium Learning Workspace
            </div>
            <div className="space-y-5">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Welcome back, {user?.name || 'Student'}.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
                  Keep your streak alive, push your quiz accuracy higher, and turn daily practice into measurable momentum.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60">Current streak</p>
                  <p className="mt-2 text-2xl font-semibold">{data?.currentStreak ?? 0} days</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60">Best streak</p>
                  <p className="mt-2 text-2xl font-semibold">{data?.bestStreak ?? 0} days</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60">Active days</p>
                  <p className="mt-2 text-2xl font-semibold">{analytics.activeDays}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="h-full min-h-[340px] overflow-hidden border-white/10 bg-card/90 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.25)]">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              Streak Summary
            </CardTitle>
            <CardDescription>Daily consistency, similar to contribution tracking on coding platforms.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-col space-y-5 pt-6">
            {isLoading ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">This week</p>
                    <p className="mt-2 text-2xl font-semibold">{analytics.currentWeekChecks}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Checks</p>
                    <p className="mt-2 text-2xl font-semibold">{data?.knowledgeChecksCompleted ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Points</p>
                    <p className="mt-2 text-2xl font-semibold">{data?.totalPoints ?? 0}</p>
                  </div>
                </div>
                <div className="flex-1 rounded-2xl border border-border/70 bg-background/70 p-4">
                  <StreakHeatmap data={activity.map((item) => ({ date: item.date, count: item.knowledgeChecks }))} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">Performance Overview</h3>
          <p className="text-muted-foreground">A cleaner summary of your study rhythm, completion pattern, and quiz accuracy.</p>
        </div>
      </div>

      {renderMetrics()}

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="col-span-4 overflow-hidden border-white/10 bg-card/90 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
          <CardHeader className="border-b border-border/60">
            <CardTitle>Accuracy Trend</CardTitle>
            <CardDescription>Recent knowledge checks and average score movement.</CardDescription>
          </CardHeader>
          <CardContent className="h-[290px] pt-6">
            {activityQuery.isLoading ? (
              <Skeleton className="h-full rounded-2xl" />
            ) : analytics.recentTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Complete a knowledge check to start seeing your analytics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.recentTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#scoreFill)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 overflow-hidden border-white/10 bg-card/90 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
          <CardHeader className="border-b border-border/60">
            <CardTitle>Weekly Output</CardTitle>
            <CardDescription>How consistently you are showing up each week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[290px] pt-6">
            {activityQuery.isLoading ? (
              <Skeleton className="h-full rounded-2xl" />
            ) : analytics.weeklyChecks.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Weekly analytics will appear after your first quiz attempt.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weeklyChecks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="checks" radius={[8, 8, 0, 0]} fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/10 bg-card/90">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Knowledge checks</p>
              <p className="text-2xl font-semibold">{data?.knowledgeChecksCompleted ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/90">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active days</p>
              <p className="text-2xl font-semibold">{analytics.activeDays}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/90">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This week</p>
              <p className="text-2xl font-semibold">{analytics.currentWeekChecks}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/90">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unread notifications</p>
              <p className="text-2xl font-semibold">{data?.unreadNotifications ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
