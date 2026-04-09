import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "../../store/useAuthStore"
import { dashboardApi } from "../../api/dashboardApi"
import { MetricCard } from "../../components/shared/MetricCard"
import { StreakHeatmap } from "../../components/shared/StreakHeatmap"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Skeleton } from "../../components/ui/skeleton"
import { BookOpen, Flame, Star, Target, CheckSquare, Bell, CalendarDays, Trophy } from "lucide-react"
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
      .filter(item => parseDateKey(item.date) >= weekAgo)
      .reduce((sum, item) => sum + item.knowledgeChecks, 0)

    const recentTrend = activity.slice(-8).map((item) => ({
      label: parseDateKey(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      checks: item.knowledgeChecks,
      score: Math.round(item.averageScore),
    }))

    const weeklyMap = new Map<string, { week: string; checks: number }>()
    activity.forEach((item) => {
      const date = parseDateKey(item.date)
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
        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.24)]">
          <div className="flex h-full w-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Student dashboard</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-[2.8rem] md:leading-[1.06]">
                  Welcome back, {user?.name || 'Student'}.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Track your learning consistency, quiz performance, and weekly study rhythm in one place.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryStat label="Current streak" value={`${data?.currentStreak ?? 0} days`} tone="orange" />
                <SummaryStat label="Best streak" value={`${data?.bestStreak ?? 0} days`} tone="sky" />
                <SummaryStat label="Active days" value={String(analytics.activeDays)} tone="emerald" />
              </div>
            </div>
          </div>
        </div>

        <Card className="h-full min-h-[340px] overflow-hidden rounded-[2rem] border-white/10 bg-card/90 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.25)]">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              Streak Summary
            </CardTitle>
            <CardDescription>Daily study consistency across the last six months.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-col space-y-5 pt-6">
            {isLoading ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-border/70 bg-muted/35 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">This week</p>
                    <p className="mt-2 text-2xl font-semibold">{analytics.currentWeekChecks}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-border/70 bg-muted/35 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Checks</p>
                    <p className="mt-2 text-2xl font-semibold">{data?.knowledgeChecksCompleted ?? 0}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-border/70 bg-muted/35 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Points</p>
                    <p className="mt-2 text-2xl font-semibold">{data?.totalPoints ?? 0}</p>
                  </div>
                </div>
                <div className="flex-1 rounded-[1.6rem] border border-border/70 bg-background/70 p-4">
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
          <p className="text-muted-foreground">Your recent learning consistency, quiz accuracy, and weekly practice volume.</p>
        </div>
      </div>

      {renderMetrics()}

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="col-span-4 overflow-hidden rounded-[1.8rem] border-white/10 bg-card/90 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Accuracy Trend</CardTitle>
                <CardDescription>Average score across your most recent knowledge checks.</CardDescription>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-background/70 px-3 py-2 text-right">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Latest score</p>
                <p className="mt-1 text-lg font-semibold">{analytics.recentTrend.at(-1)?.score ?? 0}%</p>
              </div>
            </div>
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
                  <Tooltip content={<ChartTooltip suffix="%" label="Avg score" />} />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#scoreFill)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 overflow-hidden rounded-[1.8rem] border-white/10 bg-card/90 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Weekly Output</CardTitle>
                <CardDescription>Total knowledge checks completed each week.</CardDescription>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-background/70 px-3 py-2 text-right">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Current week</p>
                <p className="mt-1 text-lg font-semibold">{analytics.currentWeekChecks}</p>
              </div>
            </div>
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
                  <Tooltip content={<ChartTooltip label="Knowledge checks" />} />
                  <Bar dataKey="checks" radius={[8, 8, 0, 0]} fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[1.6rem] border-white/10 bg-card/90">
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
        <Card className="rounded-[1.6rem] border-white/10 bg-card/90">
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
        <Card className="rounded-[1.6rem] border-white/10 bg-card/90">
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
        <Card className="rounded-[1.6rem] border-white/10 bg-card/90">
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

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: "orange" | "sky" | "emerald" }) {
  const tones = {
    orange: "border-orange-500/15 bg-orange-500/[0.05]",
    sky: "border-sky-500/15 bg-sky-500/[0.05]",
    emerald: "border-emerald-500/15 bg-emerald-500/[0.05]",
  }

  return (
    <div className={`rounded-[1.4rem] border p-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function ChartTooltip({ active, payload, label, suffix }: { active?: boolean; payload?: Array<{ value?: number | string; payload?: { label?: string; week?: string } }>; label: string; suffix?: string }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const point = payload[0]
  const raw = point?.value
  const title = point?.payload?.label || point?.payload?.week || ""

  return (
    <div className="rounded-[1rem] border border-border/70 bg-background/95 px-3 py-2 shadow-xl">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm font-medium text-foreground">
        {label}: {raw}{suffix ?? ""}
      </p>
    </div>
  )
}
