import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { courseApi, type CourseOutline } from "../../api/courseApi"
import { supportApi } from "../../api/supportApi"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Skeleton } from "../../components/ui/skeleton"
import { Textarea } from "../../components/ui/textarea"
import { getApiErrorMessage } from "../../lib/apiError"
import { BadgeCheck, BrainCircuit, FileQuestion, GraduationCap, ShieldCheck, Sparkles } from "lucide-react"

export function SupportHub() {
  const queryClient = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all")
  const [concept, setConcept] = useState("")
  const [question, setQuestion] = useState("")

  const summaryQuery = useQuery({
    queryKey: ["studentSupportSummary"],
    queryFn: supportApi.getSummary,
  })

  const doubtsQuery = useQuery({
    queryKey: ["studentDoubts"],
    queryFn: supportApi.getMyDoubts,
  })

  const coursesQuery = useQuery({
    queryKey: ["publishedCoursesForSupport"],
    queryFn: () => courseApi.getPublishedCourses(0, 30),
  })

  const publishedCourses = coursesQuery.data?.content ?? []

  const outlineQueries = useQueries({
    queries: publishedCourses.map((course) => ({
      queryKey: ["supportCourseOutline", course.id],
      queryFn: () => courseApi.getCourseOutline(course.id),
      enabled: publishedCourses.length > 0,
    })),
  })

  const enrolledCourses = outlineQueries
    .map((query) => query.data)
    .filter((item): item is CourseOutline => Boolean(item))
    .filter((item) => item.isEnrolled)

  useEffect(() => {
    if (!selectedCourseId && enrolledCourses.length > 0) {
      setSelectedCourseId(String(enrolledCourses[0].courseId))
    }
  }, [enrolledCourses, selectedCourseId])

  const selectedCourse = useMemo(() => (
    enrolledCourses.find((course) => String(course.courseId) === selectedCourseId) ?? null
  ), [enrolledCourses, selectedCourseId])

  const examQueries = useQueries({
    queries: enrolledCourses.map((course) => ({
      queryKey: ["courseExams", course.courseId],
      queryFn: () => supportApi.getCourseExams(course.courseId),
      enabled: enrolledCourses.length > 0,
    })),
  })

  const exams = examQueries.flatMap((query) => query.data ?? [])

  const doubtMutation = useMutation({
    mutationFn: () => supportApi.createDoubt({
      courseId: selectedCourse ? selectedCourse.courseId : undefined,
      moduleId: selectedModuleId !== "all" ? Number(selectedModuleId) : undefined,
      concept,
      question,
    }),
    onSuccess: () => {
      setConcept("")
      setQuestion("")
      setSelectedModuleId("all")
      void queryClient.invalidateQueries({ queryKey: ["studentDoubts"] })
      void queryClient.invalidateQueries({ queryKey: ["studentSupportSummary"] })
    },
  })

  const currentModules = selectedCourse?.modules ?? []
  const summary = summaryQuery.data
  const doubts = doubtsQuery.data ?? []
  const submitError = getApiErrorMessage(doubtMutation.error, "Failed to submit doubt.")

  return (
    <div className="flex-1 space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 p-7 text-white shadow-[0_28px_90px_-38px_rgba(15,23,42,0.75)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.3),transparent_35%)]" />
          <div className="relative space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/75">
              <BrainCircuit className="h-3.5 w-3.5" />
              Support Hub
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">SkillBot, doubts, exams, and credentials in one place.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
                Use the existing AI tutor for concept help, raise academic doubts, attempt proctored exams, and track badges, certificates, and recommendations.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat label="Open doubts" value={String(summary?.openDoubts ?? 0)} />
              <HeroStat label="Exams taken" value={String(summary?.examsTaken ?? 0)} />
              <HeroStat label="Certificates" value={String(summary?.certificates.length ?? 0)} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-xl">
                <Link to="/student/skills">Open SkillBot</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-xl bg-white/10 text-white hover:bg-white/20">
                <Link to="/student">View analytics</Link>
              </Button>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Personalized next steps
            </CardTitle>
            <CardDescription>Recommendations are generated from your weaker tracked concepts and enrollment history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {summaryQuery.isLoading ? (
              <Skeleton className="h-48 rounded-2xl" />
            ) : (
              <>
                {(summary?.recommendations ?? []).map((recommendation) => (
                  <div key={recommendation.courseId} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{recommendation.courseTitle}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{recommendation.rationale}</p>
                      </div>
                      <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {Math.round(recommendation.matchScore)}%
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-primary" />
              Submit a doubt
            </CardTitle>
            <CardDescription>Students can raise course-linked questions for trainer or admin review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select enrolled course" />
                </SelectTrigger>
                <SelectContent>
                  {enrolledCourses.map((course) => (
                    <SelectItem key={course.courseId} value={String(course.courseId)}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modules</SelectItem>
                  {currentModules.map((module) => (
                    <SelectItem key={module.id} value={String(module.id)}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input value={concept} onChange={(event) => setConcept(event.target.value)} placeholder="Concept or topic" />
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Describe the academic doubt clearly so the instructor can answer it precisely."
              rows={5}
            />
            {doubtMutation.isError ? (
              <p className="text-sm text-destructive">{submitError}</p>
            ) : null}
            <Button
              onClick={() => void doubtMutation.mutateAsync()}
              disabled={!concept.trim() || !question.trim() || !selectedCourseId || doubtMutation.isPending}
            >
              {doubtMutation.isPending ? "Submitting..." : "Submit doubt"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Proctored exams
            </CardTitle>
            <CardDescription>Reusable course exams generated from backend course content and tracked with browser-side proctoring signals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {examQueries.some((query) => query.isLoading) ? (
              <Skeleton className="h-56 rounded-2xl" />
            ) : exams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No exams are published yet for your enrolled courses.
              </div>
            ) : (
              exams.map((exam) => (
                <div key={exam.examId} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{exam.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{exam.courseTitle}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{exam.description}</p>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/student/exams/${exam.examId}`}>Start</Link>
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                    <span>{exam.questionCount} questions</span>
                    <span>•</span>
                    <span>{exam.durationMinutes} min</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-card/95">
          <CardHeader>
            <CardTitle>Recent doubts</CardTitle>
            <CardDescription>Track pending and resolved instructor responses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {doubtsQuery.isLoading ? (
              <Skeleton className="h-56 rounded-2xl" />
            ) : doubts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No doubts submitted yet.
              </div>
            ) : (
              doubts.map((doubt) => (
                <div key={doubt.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{doubt.concept}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{doubt.courseTitle ?? "General"}</p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${doubt.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                      {doubt.status}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{doubt.question}</p>
                  {doubt.resolution ? (
                    <div className="mt-3 rounded-xl bg-primary/5 p-3 text-sm">
                      <p className="font-medium text-primary">Resolution</p>
                      <p className="mt-1 text-muted-foreground">{doubt.resolution}</p>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-card/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />
                Achievement badges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summaryQuery.isLoading ? (
                <Skeleton className="h-36 rounded-2xl" />
              ) : (
                (summary?.badges ?? []).map((badge) => (
                  <div key={badge.badgeCode} className="rounded-2xl border border-border/70 p-4">
                    <p className="text-sm font-semibold">{badge.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{badge.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-card/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Certificates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summaryQuery.isLoading ? (
                <Skeleton className="h-36 rounded-2xl" />
              ) : (
                (summary?.certificates ?? []).map((certificate) => (
                  <div key={certificate.certificateCode} className="rounded-2xl border border-border/70 p-4">
                    <p className="text-sm font-semibold">{certificate.courseTitle}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{certificate.certificateCode}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
