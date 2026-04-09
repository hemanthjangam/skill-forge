import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileQuestion,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  PencilLine,
  PlusCircle,
  Save,
  Send,
  Trash2,
  Video,
} from "lucide-react"
import {
  courseApi,
  type CourseOutline,
  type CourseOutlineModuleResponse,
  type LessonCreatePayload,
  type QuestionPoolItem,
  type QuestionCreatePayload,
} from "../../api/courseApi"

interface LocalLesson {
  id: number
  title: string
  contentType: ContentType
  textContent?: string
  imageUrl?: string
  videoUrl?: string
}

interface LocalModule {
  id: number
  title: string
  lessons: LocalLesson[]
  questionCount: number
}

type ContentType = "TEXT" | "IMAGE" | "VIDEO" | "TEXT_IMAGE"
type Difficulty = "EASY" | "MEDIUM" | "HARD"

function InlineToast({ message, variant }: { message: string; variant: "success" | "error" }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
        variant === "success"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-destructive/20 bg-destructive/10 text-destructive"
      }`}
    >
      {variant === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {message}
    </div>
  )
}

const contentTypeLabel = (type: ContentType) => {
  switch (type) {
    case "TEXT":
      return "Text"
    case "IMAGE":
      return "Image"
    case "VIDEO":
      return "Video"
    case "TEXT_IMAGE":
      return "Text + Image"
  }
}

const contentTypeIcon = (type: ContentType) => {
  switch (type) {
    case "VIDEO":
      return <Video className="h-3.5 w-3.5" />
    case "IMAGE":
      return <ImageIcon className="h-3.5 w-3.5" />
    case "TEXT_IMAGE":
      return (
        <>
          <FileText className="h-3.5 w-3.5" />
          <ImageIcon className="h-3.5 w-3.5" />
        </>
      )
    default:
      return <FileText className="h-3.5 w-3.5" />
  }
}

function buildLessonPayload(
  title: string,
  contentType: ContentType,
  textContent: string,
  imageUrl: string,
  videoUrl: string,
): LessonCreatePayload {
  const payload: LessonCreatePayload = {
    title: title.trim(),
    contentType,
  }

  if (contentType === "TEXT" || contentType === "TEXT_IMAGE") {
    payload.textContent = textContent.trim()
  }
  if (contentType === "IMAGE" || contentType === "TEXT_IMAGE") {
    payload.imageUrl = imageUrl.trim()
  }
  if (contentType === "VIDEO") {
    payload.videoUrl = videoUrl.trim()
  }

  return payload
}

export function CourseBuilder() {
  const { courseId: routeCourseId } = useParams<{ courseId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdminMode = location.pathname.startsWith("/admin/")
  const isEditMode = Boolean(routeCourseId)

  const [courseId, setCourseId] = useState<number | null>(routeCourseId ? Number(routeCourseId) : null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [approvalStatus, setApprovalStatus] = useState("DRAFT")
  const [modules, setModules] = useState<LocalModule[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null)
  const [questions, setQuestions] = useState<QuestionPoolItem[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEditMode)
  const [moduleSavingId, setModuleSavingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null)

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [lessonEditingId, setLessonEditingId] = useState<number | null>(null)
  const [lessonModuleId, setLessonModuleId] = useState<number | null>(null)
  const [lessonTitle, setLessonTitle] = useState("")
  const [lessonContentType, setLessonContentType] = useState<ContentType>("TEXT")
  const [lessonTextContent, setLessonTextContent] = useState("")
  const [lessonImageUrl, setLessonImageUrl] = useState("")
  const [lessonVideoUrl, setLessonVideoUrl] = useState("")
  const [lessonSaving, setLessonSaving] = useState(false)

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [questionEditingId, setQuestionEditingId] = useState<number | null>(null)
  const [qStatement, setQStatement] = useState("")
  const [qTopic, setQTopic] = useState("")
  const [qConcept, setQConcept] = useState("")
  const [qDifficulty, setQDifficulty] = useState<Difficulty>("MEDIUM")
  const [qOptions, setQOptions] = useState<string[]>(["", ""])
  const [qCorrectAnswer, setQCorrectAnswer] = useState("")
  const [questionSaving, setQuestionSaving] = useState(false)

  const showToast = useCallback((message: string, variant: "success" | "error") => {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const pageTitle = isAdminMode
    ? "Review And Edit Course"
    : isEditMode
      ? "Edit Course"
      : "Create Course"

  const pageDescription = isAdminMode
    ? "Refine course content, preview the learner experience, and approve only after the course is production-ready."
    : isEditMode
      ? "Update your course structure, lessons, and question bank."
      : "Create a course, structure the curriculum, and submit it for review."

  useEffect(() => {
    if (!isEditMode || !routeCourseId) {
      return
    }

    setLoading(true)
    courseApi
      .getCourseOutline(routeCourseId)
      .then((outline: CourseOutline) => {
        setCourseId(outline.courseId)
        setTitle(outline.title)
        setDescription(outline.description || "")
        setApprovalStatus(outline.approvalStatus)
        setModules(
          outline.modules.map((module: CourseOutlineModuleResponse) => ({
            id: module.id,
            title: module.title,
            questionCount: module.questionCount,
            lessons: module.lessons.map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              contentType: (lesson.contentType || "TEXT") as ContentType,
              textContent: lesson.textContent,
              imageUrl: lesson.imageUrl,
              videoUrl: lesson.videoUrl,
            })),
          })),
        )
      })
      .catch(() => showToast("Failed to load course", "error"))
      .finally(() => setLoading(false))
  }, [isEditMode, routeCourseId, showToast])

  useEffect(() => {
    if (!selectedModuleId) {
      setQuestions([])
      return
    }

    setQuestionsLoading(true)
    courseApi
      .getModuleQuestions(selectedModuleId)
      .then(setQuestions)
      .catch(() => showToast("Failed to load questions", "error"))
      .finally(() => setQuestionsLoading(false))
  }, [selectedModuleId, showToast])

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? null,
    [modules, selectedModuleId],
  )

  const previewHref = courseId
    ? isAdminMode
      ? `/admin/courses/${courseId}/review`
      : undefined
    : undefined

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      showToast("Course title is required", "error")
      return
    }

    setSaving(true)
    try {
      if (!courseId) {
        const course = await courseApi.createCourse(title.trim(), description.trim())
        setCourseId(course.id)
        setApprovalStatus(String(course.approvalStatus))
        showToast("Course created successfully", "success")
        navigate(`/trainer/courses/${course.id}/edit`, { replace: true })
      } else {
        const updated = await courseApi.updateCourse(courseId, title.trim(), description.trim())
        setApprovalStatus(String(updated.approvalStatus))
        showToast(isAdminMode ? "Course changes saved for review" : "Course updated", "success")
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save course"
      showToast(message, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!courseId) {
      showToast("Save the course first", "error")
      return
    }

    setSubmitting(true)
    try {
      const updated = await courseApi.submitForApproval(courseId)
      setApprovalStatus(String(updated.approvalStatus))
      showToast("Course submitted for approval", "success")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to submit course"
      showToast(message, "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddModule = async () => {
    if (!courseId) {
      showToast("Save the course before adding modules", "error")
      return
    }

    try {
      const module = await courseApi.addModule(courseId, `Module ${modules.length + 1}`)
      setModules((current) => [...current, { id: module.id, title: module.title, lessons: [], questionCount: 0 }])
      showToast("Module added", "success")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add module"
      showToast(message, "error")
    }
  }

  const handleUpdateModule = async (moduleId: number, nextTitle: string) => {
    if (!nextTitle.trim()) {
      showToast("Module title cannot be empty", "error")
      return
    }

    setModuleSavingId(moduleId)
    try {
      const updated = await courseApi.updateModule(moduleId, nextTitle.trim())
      setModules((current) =>
        current.map((module) => (module.id === moduleId ? { ...module, title: updated.title } : module)),
      )
      showToast("Module updated", "success")
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update module"
      showToast(message, "error")
    } finally {
      setModuleSavingId(null)
    }
  }

  const openLessonDialogForCreate = (moduleId: number) => {
    setLessonEditingId(null)
    setLessonModuleId(moduleId)
    setLessonTitle("")
    setLessonContentType("TEXT")
    setLessonTextContent("")
    setLessonImageUrl("")
    setLessonVideoUrl("")
    setLessonDialogOpen(true)
  }

  const openLessonDialogForEdit = (moduleId: number, lesson: LocalLesson) => {
    setLessonEditingId(lesson.id)
    setLessonModuleId(moduleId)
    setLessonTitle(lesson.title)
    setLessonContentType(lesson.contentType)
    setLessonTextContent(lesson.textContent || "")
    setLessonImageUrl(lesson.imageUrl || "")
    setLessonVideoUrl(lesson.videoUrl || "")
    setLessonDialogOpen(true)
  }

  const handleSaveLesson = async () => {
    if (!lessonModuleId || !lessonTitle.trim()) {
      showToast("Lesson title is required", "error")
      return
    }

    const payload = buildLessonPayload(
      lessonTitle,
      lessonContentType,
      lessonTextContent,
      lessonImageUrl,
      lessonVideoUrl,
    )

    setLessonSaving(true)
    try {
      if (lessonEditingId) {
        const updated = await courseApi.updateLesson(lessonEditingId, payload)
        setModules((current) =>
          current.map((module) =>
            module.id === lessonModuleId
              ? {
                  ...module,
                  lessons: module.lessons.map((lesson) =>
                    lesson.id === lessonEditingId
                      ? {
                          id: updated.id,
                          title: updated.title,
                          contentType: updated.contentType as ContentType,
                          textContent: updated.textContent,
                          imageUrl: updated.imageUrl,
                          videoUrl: updated.videoUrl,
                        }
                      : lesson,
                  ),
                }
              : module,
          ),
        )
        showToast("Lesson updated", "success")
      } else {
        const created = await courseApi.addLesson(lessonModuleId, payload)
        setModules((current) =>
          current.map((module) =>
            module.id === lessonModuleId
              ? {
                  ...module,
                  lessons: [
                    ...module.lessons,
                    {
                      id: created.id,
                      title: created.title,
                      contentType: created.contentType as ContentType,
                      textContent: created.textContent,
                      imageUrl: created.imageUrl,
                      videoUrl: created.videoUrl,
                    },
                  ],
                }
              : module,
          ),
        )
        showToast("Lesson added", "success")
      }
      setLessonDialogOpen(false)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save lesson"
      showToast(message, "error")
    } finally {
      setLessonSaving(false)
    }
  }

  const openQuestionDialogForCreate = () => {
    setQuestionEditingId(null)
    setQStatement("")
    setQTopic("")
    setQConcept("")
    setQDifficulty("MEDIUM")
    setQOptions(["", ""])
    setQCorrectAnswer("")
    setQuestionDialogOpen(true)
  }

  const openQuestionDialogForEdit = (question: QuestionPoolItem) => {
    setQuestionEditingId(question.id)
    setQStatement(question.statement)
    setQTopic(question.topic)
    setQConcept(question.concept)
    setQDifficulty(question.difficulty as Difficulty)
    setQOptions(question.options)
    setQCorrectAnswer(question.correctAnswer)
    setQuestionDialogOpen(true)
  }

  const handleSaveQuestion = async () => {
    if (!selectedModuleId) {
      showToast("Select a module first", "error")
      return
    }
    if (!qStatement.trim() || !qTopic.trim() || !qConcept.trim()) {
      showToast("Statement, topic, and concept are required", "error")
      return
    }

    const filteredOptions = qOptions.map((option) => option.trim()).filter(Boolean)
    if (filteredOptions.length < 2) {
      showToast("At least 2 options are required", "error")
      return
    }
    if (!qCorrectAnswer.trim()) {
      showToast("Select the correct answer", "error")
      return
    }

    const payload: QuestionCreatePayload = {
      statement: qStatement.trim(),
      topic: qTopic.trim(),
      concept: qConcept.trim(),
      difficulty: qDifficulty,
      options: filteredOptions,
      correctAnswer: qCorrectAnswer.trim(),
    }

    setQuestionSaving(true)
    try {
      if (questionEditingId) {
        const updated = await courseApi.updateQuestion(questionEditingId, payload)
        setQuestions((current) => current.map((question) => (question.id === updated.id ? { ...question, ...updated } : question)))
        showToast("Question updated", "success")
      } else {
        const created = await courseApi.addQuestion(selectedModuleId, payload)
        setQuestions((current) => [...current, created])
        setModules((current) =>
          current.map((module) =>
            module.id === selectedModuleId ? { ...module, questionCount: module.questionCount + 1 } : module,
          ),
        )
        showToast("Question added", "success")
      }
      setQuestionDialogOpen(false)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save question"
      showToast(message, "error")
    } finally {
      setQuestionSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
      <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em]">
                {isAdminMode ? "Admin Review" : "Course Studio"}
              </Badge>
              {courseId ? (
                <Badge variant="secondary" className="capitalize">
                  {approvalStatus.replace(/_/g, " ").toLowerCase()}
                </Badge>
              ) : null}
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">{pageTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{pageDescription}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {toast ? <InlineToast message={toast.message} variant={toast.variant} /> : null}
            {previewHref ? (
              <Button asChild variant="outline">
                <Link to={previewHref}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
            {!isAdminMode ? (
              <Button onClick={handleSubmit} disabled={submitting || !courseId}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit for approval
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4 grid w-full max-w-xl grid-cols-3 rounded-2xl bg-muted/60 p-1">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="curriculum" disabled={!courseId}>
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="questions" disabled={!courseId}>
            Question Bank
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="rounded-[1.8rem] border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle>Core course information</CardTitle>
              <CardDescription>Keep the title, description, and review status sharp before publishing.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course title</Label>
                  <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Advanced System Design" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={7}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Outline what learners will be able to build or understand after completing this course."
                  />
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Editorial checklist</p>
                <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">Clear outcome</p>
                    <p className="mt-1">Make sure the description states what learners will ship, solve, or master.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Clean structure</p>
                    <p className="mt-1">Use module titles that read like milestones, not placeholders.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Review readiness</p>
                    <p className="mt-1">Preview the course before approval to verify the student experience.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum">
          <div className="space-y-4">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                isSaving={moduleSavingId === module.id}
                onSaveModule={handleUpdateModule}
                onAddLesson={() => openLessonDialogForCreate(module.id)}
                onEditLesson={(lesson) => openLessonDialogForEdit(module.id, lesson)}
              />
            ))}

            <Button onClick={handleAddModule} variant="outline" className="w-full rounded-[1.4rem] border-dashed py-6">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add module
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="questions">
          <Card className="rounded-[1.8rem] border-border/70 bg-card/95">
            <CardHeader className="flex flex-col gap-4 border-b border-border/60 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Question bank</CardTitle>
                <CardDescription>Review each module’s quiz pool and clean up wording before learners see it.</CardDescription>
              </div>
              {selectedModuleId ? (
                <Button onClick={openQuestionDialogForCreate}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add question
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label>Select module</Label>
                <Select value={selectedModuleId ? String(selectedModuleId) : ""} onValueChange={(value) => setSelectedModuleId(Number(value))}>
                  <SelectTrigger className="w-full sm:w-96">
                    <SelectValue placeholder="Choose a module..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={String(module.id)}>
                        {module.title} ({module.questionCount} questions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedModule ? (
                <EmptyState
                  title="Select a module"
                  description="Choose a module to review or edit the question bank."
                  icon={<FileQuestion className="h-12 w-12 opacity-45" />}
                />
              ) : questionsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : questions.length === 0 ? (
                <EmptyState
                  title="No questions yet"
                  description="Add the first question for this module to build the learner assessment flow."
                  icon={<FileQuestion className="h-12 w-12 opacity-45" />}
                />
              ) : (
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div key={question.id} className="rounded-[1.4rem] border border-border/70 bg-background/65 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            <span className="mr-2 text-muted-foreground">Q{index + 1}.</span>
                            {question.statement}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>Topic: {question.topic}</span>
                            <span>Concept: {question.concept}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {question.difficulty.toLowerCase()}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => openQuestionDialogForEdit(question)}>
                            <PencilLine className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={`${question.id}-${optionIndex}`}
                            className={`rounded-xl border px-3 py-2 text-xs ${
                              option === question.correctAnswer
                                ? "border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400"
                                : "border-border/70 bg-card"
                            }`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{lessonEditingId ? "Edit lesson" : "Add lesson"}</DialogTitle>
            <DialogDescription>Shape the lesson content the way learners will actually see it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson title</Label>
              <Input id="lesson-title" value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Content type</Label>
              <Select value={lessonContentType} onValueChange={(value) => setLessonContentType(value as ContentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="IMAGE">Image</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="TEXT_IMAGE">Text + Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {lessonContentType === "TEXT" || lessonContentType === "TEXT_IMAGE" ? (
              <div className="space-y-2">
                <Label htmlFor="lesson-text">Text content</Label>
                <Textarea id="lesson-text" rows={6} value={lessonTextContent} onChange={(event) => setLessonTextContent(event.target.value)} />
              </div>
            ) : null}
            {lessonContentType === "IMAGE" || lessonContentType === "TEXT_IMAGE" ? (
              <div className="space-y-2">
                <Label htmlFor="lesson-image">Image URL</Label>
                <Input id="lesson-image" value={lessonImageUrl} onChange={(event) => setLessonImageUrl(event.target.value)} />
              </div>
            ) : null}
            {lessonContentType === "VIDEO" ? (
              <div className="space-y-2">
                <Label htmlFor="lesson-video">Video URL</Label>
                <Input id="lesson-video" value={lessonVideoUrl} onChange={(event) => setLessonVideoUrl(event.target.value)} />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLesson} disabled={lessonSaving}>
              {lessonSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {lessonEditingId ? "Save lesson" : "Add lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-h-[85vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{questionEditingId ? "Edit question" : "Add question"}</DialogTitle>
            <DialogDescription>Keep question wording precise and assessment-ready.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto py-2">
            <div className="space-y-2">
              <Label htmlFor="question-statement">Statement</Label>
              <Textarea id="question-statement" rows={4} value={qStatement} onChange={(event) => setQStatement(event.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="question-topic">Topic</Label>
                <Input id="question-topic" value={qTopic} onChange={(event) => setQTopic(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="question-concept">Concept</Label>
                <Input id="question-concept" value={qConcept} onChange={(event) => setQConcept(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={qDifficulty} onValueChange={(value) => setQDifficulty(value as Difficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Answer options</Label>
              {qOptions.map((option, index) => (
                <div key={`${index}-${option}`} className="flex items-center gap-2">
                  <Input
                    value={option}
                    placeholder={`Option ${index + 1}`}
                    onChange={(event) => {
                      const next = [...qOptions]
                      const previousValue = next[index]
                      next[index] = event.target.value
                      setQOptions(next)
                      if (qCorrectAnswer === previousValue && previousValue !== event.target.value) {
                        setQCorrectAnswer("")
                      }
                    }}
                  />
                  {qOptions.length > 2 ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        const removed = qOptions[index]
                        setQOptions((current) => current.filter((_, currentIndex) => currentIndex !== index))
                        if (qCorrectAnswer === removed) {
                          setQCorrectAnswer("")
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
              {qOptions.length < 6 ? (
                <Button variant="outline" className="w-full border-dashed" onClick={() => setQOptions((current) => [...current, ""])}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add option
                </Button>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Correct answer</Label>
              <Select value={qCorrectAnswer} onValueChange={setQCorrectAnswer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the correct option..." />
                </SelectTrigger>
                <SelectContent>
                  {qOptions.filter((option) => option.trim()).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={questionSaving}>
              {questionSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {questionEditingId ? "Save question" : "Add question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ModuleCard({
  module,
  isSaving,
  onSaveModule,
  onAddLesson,
  onEditLesson,
}: {
  module: LocalModule
  isSaving: boolean
  onSaveModule: (moduleId: number, title: string) => void
  onAddLesson: () => void
  onEditLesson: (lesson: LocalLesson) => void
}) {
  const [title, setTitle] = useState(module.title)

  useEffect(() => {
    setTitle(module.title)
  }, [module.title])

  return (
    <Card className="rounded-[1.8rem] border-border/70 bg-card/95">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-2">
              <Label htmlFor={`module-${module.id}`} className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Module title
              </Label>
              <Input
                id={`module-${module.id}`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="min-w-[280px]"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{module.questionCount} questions</Badge>
            <Button variant="outline" size="sm" disabled={isSaving} onClick={() => onSaveModule(module.id, title)}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save module
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-5">
        {module.lessons.length === 0 ? (
          <EmptyState
            title="No lessons yet"
            description="Add the first lesson to start shaping the learner journey."
            icon={<FileText className="h-10 w-10 opacity-45" />}
            compact
          />
        ) : (
          module.lessons.map((lesson) => (
            <div key={lesson.id} className="flex flex-col gap-3 rounded-[1.3rem] border border-border/70 bg-background/65 p-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{lesson.title}</p>
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    {contentTypeIcon(lesson.contentType)}
                    {contentTypeLabel(lesson.contentType)}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {lesson.textContent || lesson.imageUrl || lesson.videoUrl || "No preview content yet."}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onEditLesson(lesson)}>
                <PencilLine className="mr-1 h-4 w-4" />
                Edit lesson
              </Button>
            </div>
          ))
        )}

        <Button variant="outline" onClick={onAddLesson} className="w-full rounded-[1.2rem] border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add lesson
        </Button>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  title,
  description,
  icon,
  compact = false,
}: {
  title: string
  description: string
  icon: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={`rounded-[1.4rem] border-2 border-dashed border-border/70 bg-background/45 text-center text-muted-foreground ${
        compact ? "px-6 py-8" : "px-6 py-14"
      }`}
    >
      <div className="mx-auto mb-4 flex justify-center">{icon}</div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm">{description}</p>
    </div>
  )
}
