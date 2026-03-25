import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "../../api/dashboardApi"
import { MetricCard } from "../../components/shared/MetricCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Skeleton } from "../../components/ui/skeleton"
import { Users, UserX, ShieldCheck, CheckCircle, Clock, Info } from "lucide-react"

export function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: dashboardApi.getAdminDashboard,
  })

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Portal</h2>
          <p className="text-muted-foreground">Platform overview and moderation queues.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : isError ? (
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          Failed to load dashboard data. Please refresh.
        </div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard title="Total Users" value={data.totalUsers.toLocaleString()} icon={Users} />
          <MetricCard title="Active Users" value={data.activeUsers.toLocaleString()} icon={CheckCircle} />
          <MetricCard title="Inactive Users" value={data.inactiveUsers.toLocaleString()} icon={UserX} />
          <MetricCard title="Pending Trainers" value={String(data.pendingTrainerApprovals)} icon={Clock} />
          <MetricCard title="Pending Courses" value={String(data.pendingCourseApprovals)} icon={Clock} />
          <MetricCard title="Approved Courses" value={data.approvedCourses.toLocaleString()} icon={ShieldCheck} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Moderation Queue</CardTitle>
            <CardDescription>Pending trainer and course approvals.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : data ? (
              <div className="space-y-4">
                {data.pendingTrainerApprovals > 0 && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{data.pendingTrainerApprovals} Trainer Approval{data.pendingTrainerApprovals !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-muted-foreground">Awaiting your review</p>
                      </div>
                    </div>
                  </div>
                )}
                {data.pendingCourseApprovals > 0 && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{data.pendingCourseApprovals} Course Approval{data.pendingCourseApprovals !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-muted-foreground">Awaiting your review</p>
                      </div>
                    </div>
                  </div>
                )}
                {data.pendingTrainerApprovals === 0 && data.pendingCourseApprovals === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    ✅ No pending approvals. All caught up!
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
            <CardDescription>Key platform health metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : data ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">User Activation Rate</span>
                  <span className="font-bold text-sm">
                    {data.totalUsers > 0 ? Math.round((data.activeUsers / data.totalUsers) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Approved Courses</span>
                  <span className="font-bold text-sm">{data.approvedCourses.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Total Pending Items</span>
                  <span className="font-bold text-sm">{data.pendingTrainerApprovals + data.pendingCourseApprovals}</span>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 mt-4">
                  <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">Activity logs and detailed audit trails will be available in a future release.</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
