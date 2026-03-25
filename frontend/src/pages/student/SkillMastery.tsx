import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueries, useQuery } from "@tanstack/react-query"
import type { AxiosError } from "axios"
import { courseApi, leaderboardApi, type CourseOutline } from "../../api/courseApi"
import { aiApi, type AiChatMessage } from "../../api/aiApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Textarea } from "../../components/ui/textarea"
import { Skeleton } from "../../components/ui/skeleton"
import { deriveRecommendedConcept } from "../../lib/aiTutor"
import { BookOpen, Bot, BrainCircuit, CheckCircle2, ChevronRight, ClipboardList, MessageSquare, Sparkles, Trophy, WandSparkles } from "lucide-react"

export function SkillMastery() {
  const skillsQuery = useQuery({
    queryKey: ['mySkills'],
    queryFn: courseApi.getMySkills,
  })

  const streakQuery = useQuery({
    queryKey: ['myStreakSummary'],
    queryFn: leaderboardApi.getMyStreak,
  })

  const coursesQuery = useQuery({
    queryKey: ['publishedCoursesForMocks'],
    queryFn: () => courseApi.getPublishedCourses(0, 30),
  })

  const publishedCourses = coursesQuery.data?.content ?? []

  const outlineQueries = useQueries({
    queries: publishedCourses.map((course) => ({
      queryKey: ['courseOutlineForMock', course.id],
      queryFn: () => courseApi.getCourseOutline(course.id),
      enabled: publishedCourses.length > 0,
    })),
  })

  const outlines = outlineQueries
    .map((query) => query.data)
    .filter((item): item is CourseOutline => Boolean(item))

  const completedCourses = outlines.filter((outline) => outline.isEnrolled && outline.progressPercentage >= 100)
  const tutorContextCourses = completedCourses.length > 0 ? completedCourses : outlines.filter((outline) => outline.isEnrolled)

  const [selectedConcept, setSelectedConcept] = useState<string>("")
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all")
  const [doubtInput, setDoubtInput] = useState("")
  const [reflection, setReflection] = useState("")
  const [tutorMessages, setTutorMessages] = useState<AiChatMessage[]>([])
  const [activeMockCourseId, setActiveMockCourseId] = useState<number | null>(null)
  const [tutorRequestKey, setTutorRequestKey] = useState(0)
  const [mockRequestKey, setMockRequestKey] = useState(0)

  const skills = skillsQuery.data ?? []
  const recommendedConcept = useMemo(() => deriveRecommendedConcept(skills), [skills])

  useEffect(() => {
    if (!selectedConcept) {
      setSelectedConcept(recommendedConcept)
    }
  }, [recommendedConcept, selectedConcept])

  const totalSkillScore = useMemo(() => {
    if (skills.length === 0) return 0
    return Math.round(skills.reduce((sum, skill) => sum + skill.score, 0) / skills.length)
  }, [skills])

  const masteryBuckets = useMemo(() => {
    return {
      mastered: skills.filter((skill) => skill.mastered).length,
      growing: skills.filter((skill) => !skill.mastered && skill.score >= 55).length,
      focus: skills.filter((skill) => skill.score < 55).length,
    }
  }, [skills])

  const conceptOptions = useMemo(() => {
    if (skills.length === 0) return [recommendedConcept]
    return [...new Set(skills.map((skill) => skill.skill))]
  }, [skills, recommendedConcept])

  useEffect(() => {
    if (!selectedCourseId && tutorContextCourses.length > 0) {
      setSelectedCourseId(String(tutorContextCourses[0].courseId))
    }
  }, [selectedCourseId, tutorContextCourses])

  const selectedCourse = useMemo(() => {
    return tutorContextCourses.find((course) => String(course.courseId) === selectedCourseId) ?? null
  }, [selectedCourseId, tutorContextCourses])

  useEffect(() => {
    if (!selectedCourse) {
      setSelectedModuleId("all")
      return
    }
    const moduleExists = selectedCourse.modules.some((module) => String(module.id) === selectedModuleId)
    if (selectedModuleId === "all" || moduleExists) {
      return
    }
    setSelectedModuleId("all")
  }, [selectedCourse, selectedModuleId])

  useEffect(() => {
    setTutorMessages([])
    setDoubtInput("")
    setReflection("")
  }, [selectedConcept, selectedCourseId, selectedModuleId])

  const teachQuery = useQuery({
    queryKey: ['aiTeachConcept', selectedConcept, selectedCourseId, selectedModuleId, tutorRequestKey],
    enabled: Boolean(selectedConcept) && tutorRequestKey > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: () => aiApi.teach({
      concept: selectedConcept,
      courseId: selectedCourse ? selectedCourse.courseId : undefined,
      moduleId: selectedModuleId !== 'all' ? Number(selectedModuleId) : undefined,
    }),
  })

  const doubtMutation = useMutation({
    mutationFn: () => aiApi.askDoubt({
      concept: selectedConcept,
      courseId: selectedCourse ? selectedCourse.courseId : undefined,
      moduleId: selectedModuleId !== 'all' ? Number(selectedModuleId) : undefined,
      question: doubtInput.trim(),
      history: tutorMessages,
    }),
    onSuccess: (response) => {
      setTutorMessages((current) => [
        ...current,
        { role: 'user', content: doubtInput.trim() },
        {
          role: 'assistant',
          content: [response.answer, response.keyPoints.length > 0 ? `Key points: ${response.keyPoints.join(' | ')}` : '', response.followUpPrompt ? `Next: ${response.followUpPrompt}` : '']
            .filter(Boolean)
            .join('\n\n'),
        },
      ])
      setDoubtInput("")
    },
  })

  const feedbackMutation = useMutation({
    mutationFn: () => aiApi.getFeedback({
      concept: selectedConcept,
      courseId: selectedCourse ? selectedCourse.courseId : undefined,
      moduleId: selectedModuleId !== 'all' ? Number(selectedModuleId) : undefined,
      reflection: reflection.trim(),
    }),
  })

  const mocksQuery = useQuery({
    queryKey: ['aiMocks', completedCourses.map((course) => course.courseId).join(','), mockRequestKey],
    enabled: completedCourses.length > 0 && mockRequestKey > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: () => aiApi.generateMocks({ courseIds: completedCourses.map((course) => course.courseId) }),
  })

  const mockScenarios = mocksQuery.data?.mocks ?? []

  useEffect(() => {
    if (mockScenarios.length > 0 && activeMockCourseId == null) {
      setActiveMockCourseId(mockScenarios[0].courseId)
    }
  }, [activeMockCourseId, mockScenarios])

  const activeMock = useMemo(() => {
    return mockScenarios.find((mock) => mock.courseId === activeMockCourseId) ?? null
  }, [activeMockCourseId, mockScenarios])

  const handleAskTutor = () => {
    if (!doubtInput.trim() || doubtMutation.isPending) return
    void doubtMutation.mutateAsync()
  }

  const handleGenerateFeedback = () => {
    if (!reflection.trim() || feedbackMutation.isPending) return
    void feedbackMutation.mutateAsync()
  }

  const handleGenerateLesson = () => {
    if (!selectedConcept || teachQuery.isFetching) return
    setTutorRequestKey((current) => current + 1)
  }

  const handleGenerateMocks = () => {
    if (completedCourses.length === 0 || mocksQuery.isFetching) return
    setMockRequestKey((current) => current + 1)
  }

  const tutorSections = useMemo(() => {
    if (!teachQuery.data) return []
    return [
      { title: 'Summary', body: teachQuery.data.summary },
      { title: 'Intuition', body: teachQuery.data.intuition },
      { title: 'Project application', body: teachQuery.data.projectApplication },
      { title: 'Next step', body: teachQuery.data.nextStep },
    ]
  }, [teachQuery.data])

  const feedback = feedbackMutation.data

  const teachError = getErrorMessage(teachQuery.error)
  const doubtError = getErrorMessage(doubtMutation.error)
  const feedbackError = getErrorMessage(feedbackMutation.error)
  const mocksError = getErrorMessage(mocksQuery.error)

  return (
    <div className="flex-1 space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 p-7 text-white shadow-[0_28px_90px_-38px_rgba(15,23,42,0.75)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.35),transparent_32%)]" />
          <div className="relative space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/75">
              <BrainCircuit className="h-3.5 w-3.5" />
              AI Skill Studio
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Skill Mastery and guided concept practice.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
                Review your live concept scores, launch a Gemini-backed tutor session for weak areas, and generate premium mock drills from courses you have already finished.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat label="Average skill score" value={`${totalSkillScore}%`} />
              <HeroStat label="Mastered concepts" value={String(masteryBuckets.mastered)} />
              <HeroStat label="Current streak" value={`${streakQuery.data?.currentStreak ?? 0} days`} />
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Focus Recommendation
            </CardTitle>
            <CardDescription>Generated from your weakest tracked concept and current learning rhythm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {skillsQuery.isLoading ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : (
              <>
                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Recommended next concept</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">{recommendedConcept}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Spend one focused practice block here before moving to harder concepts. The tutor will emphasize explanation clarity, examples, and trade-offs.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniBadge label="Mastered" value={masteryBuckets.mastered} tone="emerald" />
                  <MiniBadge label="Growing" value={masteryBuckets.growing} tone="sky" />
                  <MiniBadge label="Needs focus" value={masteryBuckets.focus} tone="amber" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border-white/10 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-500" />
              Skill Graph
            </CardTitle>
            <CardDescription>Live concept scores from quiz performance across your completed practice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillsQuery.isLoading ? (
              [1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-18 rounded-2xl" />)
            ) : skills.length === 0 ? (
              <EmptyState
                title="No skill signals yet"
                description="Complete module quizzes to populate your concept mastery and unlock richer tutor guidance."
              />
            ) : (
              skills
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((skill) => (
                  <button
                    key={skill.skill}
                    onClick={() => setSelectedConcept(skill.skill)}
                    className={`block w-full rounded-2xl border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 ${selectedConcept === skill.skill ? 'border-primary/40 bg-primary/5' : 'border-border/70'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium capitalize">{skill.skill}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {skill.mastered ? 'Confident zone. Refine edge cases and articulation.' : skill.score >= 55 ? 'Promising progress. One more focused round will help.' : 'Needs deeper reinforcement and examples.'}
                        </p>
                      </div>
                      <Badge variant={skill.mastered ? 'default' : 'outline'}>
                        {Math.round(skill.score)}%
                      </Badge>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(skill.score, 100)}%` }} />
                    </div>
                  </button>
                ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-card/95">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Tutor
            </CardTitle>
            <CardDescription>Select a concept, ground it in course context, ask doubts, and get structured feedback.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {conceptOptions.map((concept) => (
                  <Button
                    key={concept}
                    type="button"
                    variant={selectedConcept === concept ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setSelectedConcept(concept)}
                  >
                    {concept}
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Course context</p>
                  <Select value={selectedCourseId || "none"} onValueChange={(value) => setSelectedCourseId(value === "none" ? "" : value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a course context" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General concept tutoring</SelectItem>
                      {tutorContextCourses.map((course) => (
                        <SelectItem key={course.courseId} value={String(course.courseId)}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Module focus</p>
                  <Select
                    value={selectedModuleId}
                    onValueChange={setSelectedModuleId}
                    disabled={!selectedCourse}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a module focus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Entire course</SelectItem>
                      {selectedCourse?.modules.map((module) => (
                        <SelectItem key={module.id} value={String(module.id)}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-4">
                <div>
                  <p className="text-sm font-medium">Generate AI teaching response</p>
                  <p className="text-xs text-muted-foreground">Create a focused teaching breakdown for the concept and context you selected.</p>
                </div>
                <Button onClick={handleGenerateLesson} disabled={teachQuery.isFetching || !selectedConcept}>
                  {teachQuery.isFetching ? 'Generating...' : 'Generate lesson'}
                </Button>
              </div>

              {teachQuery.isLoading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-36 rounded-2xl" />)}
                </div>
              ) : teachError ? (
                <InlineError message={teachError} />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {tutorSections.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-primary/80">{item.title}</p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {teachQuery.data ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <InfoListCard title="Practice steps" items={teachQuery.data.practiceSteps} />
                  <InfoListCard title="Common mistakes" items={teachQuery.data.commonMistakes} />
                  <InfoListCard title="Quick checks" items={teachQuery.data.quickChecks} />
                </div>
              ) : null}

              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <p className="font-medium">Ask a doubt</p>
                </div>
                <div className="mt-4 flex gap-3">
                  <Input
                    value={doubtInput}
                    onChange={(e) => setDoubtInput(e.target.value)}
                    placeholder={`Ask the tutor about ${selectedConcept}...`}
                  />
                  <Button onClick={handleAskTutor} disabled={doubtMutation.isPending}>
                    {doubtMutation.isPending ? 'Thinking...' : 'Ask'}
                  </Button>
                </div>
                {doubtError ? <InlineError className="mt-4" message={doubtError} /> : null}
                <div className="mt-4 space-y-3">
                  {tutorMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Start by asking for an example, a difference, a why-question, or help applying the concept to a project.</p>
                  ) : (
                    tutorMessages.slice(-6).map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'assistant' ? 'bg-primary/5 text-foreground' : 'bg-muted text-foreground'}`}>
                        <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{message.role === 'assistant' ? 'Tutor' : 'You'}</p>
                        <p>{message.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center gap-2">
                  <WandSparkles className="h-4 w-4 text-primary" />
                  <p className="font-medium">Reflection feedback</p>
                </div>
                <Textarea
                  className="mt-4 min-h-[120px]"
                  placeholder={`Write a short explanation of ${selectedConcept}, including what it solves and one project example.`}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">Best results come from clear cause-and-effect explanations.</p>
                  <Button onClick={handleGenerateFeedback} disabled={feedbackMutation.isPending}>
                    {feedbackMutation.isPending ? 'Reviewing...' : 'Get Feedback'}
                  </Button>
                </div>
                {feedbackError ? <InlineError className="mt-4" message={feedbackError} /> : null}
                {feedback ? (
                  <div className="mt-4 space-y-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-4 text-sm leading-6">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">Verdict</p>
                      <p className="mt-2">{feedback.verdict}</p>
                    </div>
                    <InfoList title="Strengths" items={feedback.strengths} />
                    <InfoList title="Improvements" items={feedback.improvements} />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">Rewrite hint</p>
                      <p className="mt-2">{feedback.revisedAnswerHint}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">Next step</p>
                      <p className="mt-2">{feedback.nextStep}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-card/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Mock Practice from Finished Courses
              </CardTitle>
              <CardDescription>Course-aware mock drills generated from modules you already completed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-4">
                <div>
                  <p className="text-sm font-medium">Generate AI mock set</p>
                  <p className="text-xs text-muted-foreground">Create a fresh set of project-oriented mock prompts from your completed courses.</p>
                </div>
                <Button onClick={handleGenerateMocks} disabled={completedCourses.length === 0 || mocksQuery.isFetching}>
                  {mocksQuery.isFetching ? 'Generating...' : 'Generate mocks'}
                </Button>
              </div>
              {coursesQuery.isLoading || outlineQueries.some((query) => query.isLoading) || mocksQuery.isLoading ? (
                [1, 2].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)
              ) : mocksError ? (
                <InlineError message={mocksError} />
              ) : mockRequestKey === 0 || mockScenarios.length === 0 ? (
                <EmptyState
                  title="Generate mocks when you are ready"
                  description={completedCourses.length === 0
                    ? "Complete a course fully and this section will generate targeted mock questions from its modules."
                    : "Click Generate mocks to create a targeted mock set from your finished courses."}
                />
              ) : (
                <>
                  <div className="grid gap-3">
                    {mockScenarios.map((mock) => (
                      <button
                        key={mock.courseId}
                        onClick={() => setActiveMockCourseId(mock.courseId)}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 ${activeMock?.courseId === mock.courseId ? 'border-primary/40 bg-primary/5' : 'border-border/70'}`}
                      >
                        <div>
                          <p className="font-medium">{mock.courseTitle}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{mock.prompts.length} targeted prompts generated from completed modules.</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>

                  {activeMock ? (
                    <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Selected mock</p>
                          <h3 className="mt-2 text-xl font-semibold">{activeMock.courseTitle}</h3>
                        </div>
                        <Badge variant="outline">Project-based mock</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeMock.focusConcepts.map((concept) => (
                          <Badge key={concept} variant="secondary">{concept}</Badge>
                        ))}
                      </div>
                      <div className="mt-5 space-y-4">
                        {activeMock.prompts.map((prompt, index) => (
                          <div key={prompt} className="rounded-2xl border border-border/70 p-4">
                            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              Prompt {index + 1}
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">{prompt}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">Evaluation focus</p>
                        <p className="mt-2">{activeMock.evaluationFocus}</p>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InlineError({ message, className = "" }: { message: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive ${className}`}>
      {message}
    </div>
  )
}

function InfoListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-primary/80">{title}</p>
      <InfoList title={title} items={items} className="mt-3" />
    </div>
  )
}

function InfoList({ title, items, className = "mt-3" }: { title: string; items: string[]; className?: string }) {
  if (items.length === 0) {
    return <p className={`${className} text-sm text-muted-foreground`}>No {title.toLowerCase()} available yet.</p>
  }

  return (
    <div className={className}>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.22em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function MiniBadge({ label, value, tone }: { label: string; value: number; tone: "emerald" | "sky" | "amber" }) {
  const classes = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  }
  return (
    <div className={`rounded-2xl px-4 py-4 ${classes[tone]}`}>
      <p className="text-xs uppercase tracking-[0.22em]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
      <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/60" />
      <p className="mt-4 font-medium">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function getErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string }>
  return axiosError?.response?.data?.message || axiosError?.message || ""
}
