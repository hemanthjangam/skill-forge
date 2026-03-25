import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { courseApi } from "../../api/courseApi"
import { MetricCard } from "../../components/shared/MetricCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Skeleton } from "../../components/ui/skeleton"
import { BookOpen, Users, FileQuestion, GraduationCap, PlusCircle, Clock, Loader2, Trash2 } from "lucide-react"
import { dashboardApi } from "../../api/dashboardApi"
import { Link } from "react-router-dom"

const getStatusVariant = (status: string) => {
  if (status === 'APPROVED') return 'default'
  if (status === 'DRAFT') return 'secondary'
  return 'outline'
}

export function TrainerDashboard() {
  const queryClient = useQueryClient()

  const dashQuery = useQuery({
    queryKey: ['trainerDashboard'],
    queryFn: dashboardApi.getTrainerDashboard,
  })

  const coursesQuery = useQuery({
    queryKey: ['trainerCourses'],
    queryFn: courseApi.getTrainerCourses,
  })

  const deleteMutation = useMutation({
    mutationFn: (courseId: number) => courseApi.deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainerCourses'] })
      queryClient.invalidateQueries({ queryKey: ['trainerDashboard'] })
    },
  })

  const data = dashQuery.data
  const courses = coursesQuery.data ?? []
  const pendingCourses = courses.filter(c => c.approvalStatus === 'PENDING')

  const handleDelete = (courseId: number, title: string) => {
    const confirmed = window.confirm(`Delete "${title}"? This will permanently remove the course and its related content.`)
    if (!confirmed) {
      return
    }

    deleteMutation.mutate(courseId)
  }

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trainer Dashboard</h2>
          <p className="text-muted-foreground">Manage your courses, track performance, and build new content.</p>
        </div>
        <Button asChild>
          <Link to="/trainer/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      {dashQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : dashQuery.isError ? (
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          Failed to load dashboard data. Please refresh.
        </div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Courses Created"
            value={String(data.createdCourses)}
            icon={BookOpen}
            description={`${data.pendingCourseApprovals} pending approval`}
          />
          <MetricCard
            title="Total Enrollments"
            value={data.totalEnrollments.toLocaleString()}
            icon={Users}
            trend={{ value: "Across all courses", positive: true }}
          />
          <MetricCard
            title="Questions Created"
            value={String(data.questionsCreated)}
            icon={FileQuestion}
          />
          <MetricCard
            title="Quiz Attempts"
            value={data.quizAttemptsOnTrainerModules.toLocaleString()}
            icon={GraduationCap}
            description="Across all modules"
          />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>All courses you have created.</CardDescription>
          </CardHeader>
          <CardContent>
            {deleteMutation.isError ? (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Failed to delete the course. Please try again.
              </div>
            ) : null}
            {coursesQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : coursesQuery.isError ? (
              <p className="text-sm text-destructive text-center py-6">Failed to load courses.</p>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <BookOpen className="w-12 h-12 text-muted-foreground/40" />
                <div>
                  <p className="font-medium text-muted-foreground">No courses yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Create your first course to get started</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/trainer/courses/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Course
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trainer</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(course.approvalStatus)}>
                            {course.approvalStatus.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{course.trainerName}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/trainer/courses/${course.id}/edit`}>Edit</Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(course.id, course.title)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending && deleteMutation.variables === course.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Courses waiting for admin review</CardDescription>
          </CardHeader>
          <CardContent>
            {coursesQuery.isLoading ? (
              <Skeleton className="h-20" />
            ) : pendingCourses.length > 0 ? (
              <div className="space-y-3">
                {pendingCourses.map(course => (
                  <div key={course.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                    <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                    <p className="font-medium text-sm line-clamp-2">{course.title}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-sm text-muted-foreground">
                No courses pending approval.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
