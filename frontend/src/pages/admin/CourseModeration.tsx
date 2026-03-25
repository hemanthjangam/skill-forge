import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "../../api/adminApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Skeleton } from "../../components/ui/skeleton"
import { Link } from "react-router-dom"
import { CheckCircle, XCircle, Loader2, Eye } from "lucide-react"

export function CourseModeration() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>("PENDING")

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminCourses', statusFilter],
    queryFn: () => adminApi.getCourses(0, 50, statusFilter === 'ALL' ? undefined : statusFilter),
  })

  const moderateMutation = useMutation({
    mutationFn: ({ courseId, approved }: { courseId: number, approved: boolean }) => 
      adminApi.moderateCourse(courseId, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] })
    }
  })

  const courses = data?.content ?? []

  const getStatusVariant = (status: string) => {
    if (status === 'APPROVED') return 'default'
    if (status === 'REJECTED') return 'destructive'
    return 'outline'
  }

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Course Moderation</h2>
          <p className="text-muted-foreground">Review and approve courses submitted by trainers.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={statusFilter === 'ALL' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('ALL')}
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'PENDING' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('PENDING')}
          >
            Pending
          </Button>
          <Button 
            variant={statusFilter === 'APPROVED' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('APPROVED')}
          >
            Approved
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Submissions</CardTitle>
          <CardDescription>
            {statusFilter === 'ALL' ? 'All courses on the platform' : `${statusFilter} courses waiting for review`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive py-4 text-center">Failed to load courses.</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center bg-muted/20 rounded-lg">
              No courses found for the selected filter.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map(course => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {course.title}
                        <p className="text-xs text-muted-foreground line-clamp-1">{course.description}</p>
                      </TableCell>
                      <TableCell>{course.trainerName}</TableCell>
                      <TableCell>
                        {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(course.approvalStatus)}>
                          {course.approvalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20">
                            <Link to={`/admin/courses/${course.id}/review`}>
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20"
                            onClick={() => moderateMutation.mutate({ courseId: course.id, approved: true })}
                            disabled={moderateMutation.isPending || course.approvalStatus === 'APPROVED'}
                          >
                            {(moderateMutation.isPending && moderateMutation.variables?.courseId === course.id && moderateMutation.variables.approved) ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                            onClick={() => moderateMutation.mutate({ courseId: course.id, approved: false })}
                            disabled={moderateMutation.isPending || course.approvalStatus === 'REJECTED'}
                          >
                            {(moderateMutation.isPending && moderateMutation.variables?.courseId === course.id && !moderateMutation.variables.approved) ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-1" />
                            )}
                            Reject
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
    </div>
  )
}
