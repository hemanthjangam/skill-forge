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
import { BookOpen, Bot, ChevronRight, ClipboardList, MessageSquare, Sparkles, Target, Trophy, WandSparkles } from "lucide-react"

type TutorThreadMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; keyPoints: string[]; followUpPrompt?: string }

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
  const [tutorMessages, setTutorMessages] = useState<TutorThreadMessage[]>([])
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
      history: tutorMessages.map((message) => ({
        role: message.role,
        content: message.role === 'assistant'
          ? [message.content, message.keyPoints?.length ? `Key points: ${message.keyPoints.join(' | ')}` : '', message.followUpPrompt ? `Next: ${message.followUpPrompt}` : '']
              .filter(Boolean)
              .join('\n\n')
          : message.content,
      })) as AiChatMessage[],
    }),
    onSuccess: (response) => {
      setTutorMessages((current) => [
        ...current,
        { role: 'user', content: doubtInput.trim() },
        {
          role: 'assistant',
          content: response.answer,
          keyPoints: response.keyPoints,
          followUpPrompt: response.followUpPrompt,
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
      { title: 'Next step', body: teachQuery.data.nextStep },
    ]
  }, [teachQuery.data])

  const feedback = feedbackMutation.data
  const suggestedQuestions = useMemo(() => {
    return [
      `Give me a real project example for ${selectedConcept}.`,
      `What is the most common mistake in ${selectedConcept}?`,
      `How do I explain ${selectedConcept} in an interview?`,
    ]
  }, [selectedConcept])

  const teachError = getErrorMessage(teachQuery.error)
  const doubtError = getErrorMessage(doubtMutation.error)
  const feedbackError = getErrorMessage(feedbackMutation.error)
  const mocksError = getErrorMessage(mocksQuery.error)

  return (
    <div className="mx-auto flex-1 max-w-[1480px] space-y-10 px-1">
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="rounded-[2.15rem] border border-border/70 bg-card/95 p-8 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.24)]">
          <div className="space-y-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Student workspace</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-[2.8rem] md:leading-[1.06]">
                  Sharpen weak concepts, ask better questions, and practice with realistic mock scenarios.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px]">
                  Use Skill Mastery to focus on the concepts that need work, generate structured lesson briefs, and rehearse with scenario-based mock exercises tied to courses you have completed.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-border/70 bg-background/70 px-4 py-3 text-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Recommended focus</p>
                <p className="mt-2 font-semibold capitalize text-foreground">{recommendedConcept}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <HeroStat label="Average skill score" value={`${totalSkillScore}%`} accent="sky" />
              <HeroStat label="Mastered concepts" value={String(masteryBuckets.mastered)} accent="emerald" />
              <HeroStat label="Current streak" value={`${streakQuery.data?.currentStreak ?? 0} days`} accent="amber" />
            </div>
          </div>
        </div>

        <Card className="h-full overflow-hidden rounded-[2rem] border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
          <CardHeader className="border-b border-border/60 pb-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Focus Recommendation
            </CardTitle>
            <CardDescription>Generated from your weakest tracked concept and current learning rhythm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {skillsQuery.isLoading ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : (
              <>
                <div className="rounded-[1.75rem] border border-primary/15 bg-[linear-gradient(180deg,rgba(59,130,246,0.07),rgba(59,130,246,0.02))] p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Recommended next concept</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight md:text-[2rem]">{recommendedConcept}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Spend one focused practice block here before moving to harder concepts. The tutor now returns a lesson brief, project applications, and execution steps instead of generic AI text.
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

      <div className="grid items-start gap-6 xl:grid-cols-[0.84fr_1.16fr]">
        <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.28)] xl:sticky xl:top-24">
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
                    className={`block w-full rounded-[1.5rem] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.045] ${selectedConcept === skill.skill ? 'border-primary/35 bg-primary/[0.05] shadow-[0_16px_34px_-26px_rgba(37,99,235,0.45)]' : 'border-border/70 bg-background/65'}`}
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
          <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.24)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Tutor
              </CardTitle>
              <CardDescription>Select a concept, ground it in course context, ask doubts, and get structured coaching instead of raw AI output.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-5 rounded-[1.75rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Tutor focus</p>
                    <p className="text-xs text-muted-foreground">Choose what you want the lesson and follow-up coaching to optimize for.</p>
                  </div>
                  <Badge variant="outline">Context aware</Badge>
                </div>

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
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/70 bg-background/60 px-5 py-4">
                <div>
                  <p className="text-sm font-medium">Generate AI teaching response</p>
                  <p className="text-xs text-muted-foreground">Create a focused teaching breakdown for the concept and context you selected.</p>
                </div>
                <Button onClick={handleGenerateLesson} disabled={teachQuery.isFetching || !selectedConcept}>
                  {teachQuery.isFetching ? 'Generating...' : 'Build lesson brief'}
                </Button>
              </div>

              {teachQuery.isLoading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-36 rounded-2xl" />)}
                </div>
              ) : teachError ? (
                <InlineError message={teachError} />
              ) : (
                <div className="grid gap-3 lg:grid-cols-3">
                  {tutorSections.map((item) => (
                    <div key={item.title} className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                      <p className="text-xs uppercase tracking-[0.22em] text-primary/80">{item.title}</p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {teachQuery.data ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <InfoListCard title="Project applications" items={teachQuery.data.projectApplication} />
                  <InfoListCard title="Practice steps" items={teachQuery.data.practiceSteps} />
                  <InfoListCard title="Common mistakes" items={teachQuery.data.commonMistakes} />
                  <InfoListCard title="Quick checks" items={teachQuery.data.quickChecks} />
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <p className="font-medium">Ask a doubt</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => setDoubtInput(question)}
                      className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.04] hover:text-foreground"
                    >
                      {question}
                    </button>
                  ))}
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
                      message.role === 'assistant' ? (
                        <div key={`${message.role}-${index}`} className="rounded-[1.5rem] border border-primary/15 bg-primary/5 px-4 py-4 text-sm leading-6">
                          <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-primary/80">Tutor response</p>
                          <p className="text-foreground">{message.content}</p>
                          {message.keyPoints.length > 0 ? (
                            <div className="mt-4">
                              <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">Key points</p>
                              <InfoList title="Key points" items={message.keyPoints} className="mt-3" />
                            </div>
                          ) : null}
                          {message.followUpPrompt ? (
                            <div className="mt-4 rounded-[1.25rem] border border-primary/10 bg-background/70 px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">Recommended next question</p>
                              <p className="mt-2 text-foreground">{message.followUpPrompt}</p>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div key={`${message.role}-${index}`} className="rounded-[1.25rem] bg-muted px-4 py-3 text-sm leading-6 text-foreground">
                          <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">You</p>
                          <p>{message.content}</p>
                        </div>
                      )
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-5">
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
                  <div className="mt-4 space-y-3 rounded-[1.5rem] border border-primary/15 bg-primary/5 px-4 py-4 text-sm leading-6">
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
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.24)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Mock Practice from Finished Courses
              </CardTitle>
              <CardDescription>Course-aware scenario briefs generated from modules you already completed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/70 bg-background/60 px-5 py-4">
                <div>
                  <p className="text-sm font-medium">Generate AI mock studio</p>
                  <p className="text-xs text-muted-foreground">Create scenario briefs with tasks, constraints, and evaluation criteria from your completed courses.</p>
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
                  <div className="grid gap-4 xl:grid-cols-[0.42fr_0.58fr]">
                    <div className="space-y-3 rounded-[1.75rem] border border-border/60 bg-background/45 p-3">
                    {mockScenarios.map((mock) => (
                      <button
                        key={mock.courseId}
                        onClick={() => setActiveMockCourseId(mock.courseId)}
                        className={`flex w-full items-center justify-between rounded-[1.35rem] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.045] ${activeMock?.courseId === mock.courseId ? 'border-primary/35 bg-primary/[0.05] shadow-[0_16px_34px_-26px_rgba(37,99,235,0.42)]' : 'border-border/70 bg-background/80'}`}
                      >
                        <div>
                          <p className="font-medium">{mock.scenarioTitle || mock.courseTitle}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{mock.taskChecklist.length} execution steps for {mock.courseTitle}.</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                    </div>

                  {activeMock ? (
                    <div className="rounded-[1.9rem] border border-border/70 bg-background/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Selected scenario</p>
                          <h3 className="mt-2 text-xl font-semibold">{activeMock.scenarioTitle || activeMock.courseTitle}</h3>
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{activeMock.scenarioBrief}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full px-3 py-1">Scenario brief</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeMock.focusConcepts.map((concept) => (
                          <Badge key={concept} variant="secondary">{concept}</Badge>
                        ))}
                      </div>
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                            <Target className="h-4 w-4 text-primary" />
                            Learner goal
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">{activeMock.learnerGoal}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            Deliverable
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">{activeMock.deliverable}</p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">Execution plan</p>
                          <ol className="mt-3 space-y-3">
                            {activeMock.taskChecklist.map((task, index) => (
                              <li key={task} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                  {index + 1}
                                </span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="space-y-4">
                          <InfoListCard title="Evaluation focus" items={activeMock.evaluationFocus} />
                          <InfoListCard title="Constraints" items={activeMock.constraints} />
                        </div>
                      </div>
                    </div>
                  ) : null}
                  </div>
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

function HeroStat({ label, value, accent }: { label: string; value: string; accent: "sky" | "emerald" | "amber" }) {
  const accentClasses = {
    sky: "border-sky-400/18 bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
    emerald: "border-emerald-400/18 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
    amber: "border-amber-300/18 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  }

  return (
    <div className={`rounded-[1.4rem] border p-4 backdrop-blur-sm ${accentClasses[accent]}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function MiniBadge({ label, value, tone }: { label: string; value: number; tone: "emerald" | "sky" | "amber" }) {
  const classes = {
    emerald: "border border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    sky: "border border-sky-500/15 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    amber: "border border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  }
  return (
    <div className={`rounded-[1.35rem] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${classes[tone]}`}>
      <p className="text-xs uppercase tracking-[0.22em]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-border/70 bg-muted/20 p-8 text-center">
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
