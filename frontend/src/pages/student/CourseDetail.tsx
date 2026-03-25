import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, Link } from "react-router-dom"
import { courseApi } from "../../api/courseApi"
import { useAuthStore } from "../../store/useAuthStore"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent } from "../../components/ui/card"
import { Skeleton } from "../../components/ui/skeleton"
import { Play, CheckCircle, BookOpen, User, LayersIcon, Clock3, Sparkles } from "lucide-react"
import { getCourseTheme } from "../../lib/courseThemes"

export function CourseDetail() {
  const queryClient = useQueryClient()
  const { role } = useAuthStore()
  const { courseId } = useParams()
  const [enrolling, setEnrolling] = useState(false)

  const { data: outline, isLoading, isError } = useQuery({
    queryKey: ['courseOutline', courseId],
    queryFn: () => courseApi.getCourseOutline(courseId!),
    enabled: !!courseId,
  })

  const enrollMutation = useMutation({
    mutationFn: () => courseApi.enrollInCourse(courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseOutline', courseId] })
    },
    onSettled: () => setEnrolling(false),
  })

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full">
        <Skeleton className="h-64 rounded-xl w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (isError || !outline) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Course not found</h3>
          <p className="text-muted-foreground mb-4">This course may not be available or you may not have access.</p>
          <Button asChild variant="outline">
            <Link to="/student/courses">Back to Courses</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const totalLessons = outline.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const totalQuestions = outline.modules.reduce((sum, m) => sum + m.questionCount, 0)
  const theme = getCourseTheme(outline.title)
  const HeroIcon = theme.icon

  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full">
      {/* Course Header Banner */}
      <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 p-6 md:p-10 ${theme.glow}`}>
        <img
          src={theme.thumbnail}
          alt={outline.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%)]" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
        <div className="flex-1 space-y-5 text-white">
          {role !== 'STUDENT' && (
            <Badge variant={outline.approvalStatus === 'APPROVED' ? 'default' : 'secondary'} className="border-white/20 bg-white/12 text-white backdrop-blur-sm">
              {outline.approvalStatus}
            </Badge>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.accent} text-slate-950 shadow-lg`}>
              <HeroIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">{theme.category}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/75">
                <span>{theme.level}</span>
                <span>•</span>
                <span>{theme.duration}</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{outline.title}</h1>
          <p className="max-w-2xl text-lg text-white/82">{outline.description}</p>

          <div className="flex flex-wrap gap-6 pt-2 text-sm text-white/88">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-white/65" />
              <span>{outline.trainerName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LayersIcon className="w-4 h-4 text-white/65" />
              <span>{outline.modules.length} modules · {totalLessons} lessons</span>
            </div>
            {totalQuestions > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-white/65" />
                <span>{totalQuestions} quiz questions</span>
              </div>
            )}
          </div>

          <div className="grid gap-2 pt-2 md:grid-cols-3">
            {theme.highlights.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-sm text-white/90 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-white/80" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full shrink-0 border-0 bg-white/10 text-white shadow-2xl backdrop-blur-md md:w-[320px]">
          <CardContent className="p-6 flex flex-col gap-4 text-center">
            <h3 className="font-semibold text-xl">Ready to learn?</h3>
            <div className="flex items-center justify-center gap-2 text-sm text-white/75">
              <Clock3 className="h-4 w-4" />
              Structured around project modules and practice pools
            </div>
            {outline.isEnrolled ? (
              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{outline.progressPercentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                    <div className="h-full bg-white transition-all duration-500" style={{ width: `${outline.progressPercentage}%` }} />
                  </div>
                </div>
                <Button asChild size="lg" className="h-12 w-full text-base bg-white text-slate-950 hover:bg-white/90">
                  <Link to={`/student/courses/${courseId}/player`}>
                    <Play className="w-5 h-5 mr-2" fill="currentColor" />
                    {outline.progressPercentage === 0 ? 'Start Learning' : 'Continue Learning'}
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  className="h-12 w-full text-base bg-white text-slate-950 hover:bg-white/90"
                  onClick={() => { setEnrolling(true); enrollMutation.mutate() }}
                  disabled={enrolling}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link to={`/student/courses/${courseId}/player`}>
                    <Play className="w-5 h-5 mr-2" fill="currentColor" />
                    Preview
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Course Modules */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Course Content</h2>
        {outline.modules.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No modules available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outline.modules.map((mod, index) => (
              <Card key={mod.id} className="overflow-hidden border-border/70 bg-card/95">
                <div className="flex items-center justify-between p-4 transition-colors hover:bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${theme.accent} text-slate-950 font-bold`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{mod.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
                        {mod.questionCount > 0 && ` · ${mod.questionCount} quiz question${mod.questionCount !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
