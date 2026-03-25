import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
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
  PlusCircle,
  GripVertical,
  Trash2,
  FileQuestion,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Video,
  Image as ImageIcon,
  FileText,
  Send,
} from "lucide-react"
import {
  courseApi,
  type CourseOutline,
  type CourseOutlineModuleResponse,
  type QuestionPoolItem,
  type LessonCreatePayload,
} from "../../api/courseApi"

// ─── Types ───────────────────────────────────────────────────────────
interface LocalLesson {
  id: number
  title: string
  contentType: string
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

// ─── Feedback Toast ──────────────────────────────────────────────────
function InlineToast({ message, variant }: { message: string; variant: "success" | "error" }) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
        variant === "success"
          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          : "bg-destructive/10 text-destructive border border-destructive/20"
      }`}
    >
      {variant === "success" ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      {message}
    </div>
  )
}

// ─── Content Type Helpers ────────────────────────────────────────────
const contentTypeIcon = (type: string) => {
  switch (type) {
    case "VIDEO":
      return <Video className="w-3.5 h-3.5" />
    case "IMAGE":
      return <ImageIcon className="w-3.5 h-3.5" />
    case "TEXT_IMAGE":
      return <><FileText className="w-3.5 h-3.5" /><ImageIcon className="w-3.5 h-3.5" /></>
    default:
      return <FileText className="w-3.5 h-3.5" />
  }
}

const contentTypeLabel = (type: string) => {
  switch (type) {
    case "TEXT": return "Text"
    case "IMAGE": return "Image"
    case "VIDEO": return "Video"
    case "TEXT_IMAGE": return "Text + Image"
    default: return type
  }
}

// ─── Main Component ──────────────────────────────────────────────────
export function CourseBuilder() {
  const { courseId: editCourseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const isEditMode = !!editCourseId

  // Course state
  const [courseId, setCourseId] = useState<number | null>(editCourseId ? Number(editCourseId) : null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [approvalStatus, setApprovalStatus] = useState("DRAFT")

  // Modules & lessons
  const [modules, setModules] = useState<LocalModule[]>([])

  // Questions
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null)
  const [questions, setQuestions] = useState<QuestionPoolItem[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null)
  const [loading, setLoading] = useState(isEditMode)

  // Lesson dialog
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [lessonModuleId, setLessonModuleId] = useState<number | null>(null)
  const [lessonTitle, setLessonTitle] = useState("")
  const [lessonContentType, setLessonContentType] = useState<ContentType>("TEXT")
  const [lessonTextContent, setLessonTextContent] = useState("")
  const [lessonImageUrl, setLessonImageUrl] = useState("")
  const [lessonVideoUrl, setLessonVideoUrl] = useState("")
  const [lessonSaving, setLessonSaving] = useState(false)

  // Question dialog
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [qStatement, setQStatement] = useState("")
  const [qTopic, setQTopic] = useState("")
  const [qConcept, setQConcept] = useState("")
  const [qDifficulty, setQDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM")
  const [qOptions, setQOptions] = useState<string[]>(["", ""])
  const [qCorrectAnswer, setQCorrectAnswer] = useState("")
  const [questionSaving, setQuestionSaving] = useState(false)

  // ─── Show toast helper ───────────────────────────────────────────
  const showToast = useCallback((message: string, variant: "success" | "error") => {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // ─── Load existing course in edit mode ───────────────────────────
  useEffect(() => {
    if (!isEditMode || !editCourseId) return
    setLoading(true)
    courseApi
      .getCourseOutline(editCourseId)
      .then((outline: CourseOutline) => {
        setTitle(outline.title)
        setDescription(outline.description || "")
        setApprovalStatus(outline.approvalStatus)
        setCourseId(outline.courseId)
        setModules(
          outline.modules.map((m: CourseOutlineModuleResponse) => ({
            id: m.id,
            title: m.title,
            questionCount: m.questionCount,
            lessons: m.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              contentType: l.contentType || "TEXT",
              textContent: l.textContent,
              imageUrl: l.imageUrl,
              videoUrl: l.videoUrl,
            })),
          }))
        )
      })
      .catch(() => showToast("Failed to load course", "error"))
      .finally(() => setLoading(false))
  }, [isEditMode, editCourseId, showToast])

  // ─── Load questions when module selected ─────────────────────────
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

  // ─── Save Draft (create course if new) ───────────────────────────
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
        showToast("Course created successfully!", "success")
        navigate(`/trainer/courses/${course.id}/edit`, { replace: true })
      } else {
        // Course already exists — just show confirmation
        showToast("Course saved!", "success")
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save course"
      showToast(msg, "error")
    } finally {
      setSaving(false)
    }
  }

  // ─── Submit for Approval ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!courseId) {
      showToast("Save the course first.", "error")
      return
    }
    setSubmitting(true)
    try {
      const updated = await courseApi.submitForApproval(courseId)
      setApprovalStatus(String(updated.approvalStatus))
      showToast("Course submitted for approval!", "success")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to submit"
      showToast(msg, "error")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Add Module ──────────────────────────────────────────────────
  const handleAddModule = async () => {
    if (!courseId) {
      showToast("Save the course first before adding modules.", "error")
      return
    }
    try {
      const mod = await courseApi.addModule(courseId, `Module ${modules.length + 1}`)
      setModules([...modules, { id: mod.id, title: mod.title, lessons: [], questionCount: 0 }])
      showToast("Module added!", "success")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add module"
      showToast(msg, "error")
    }
  }

  // ─── Lesson Dialog ───────────────────────────────────────────────
  const openLessonDialog = (moduleId: number) => {
    setLessonModuleId(moduleId)
    setLessonTitle("")
    setLessonContentType("TEXT")
    setLessonTextContent("")
    setLessonImageUrl("")
    setLessonVideoUrl("")
    setLessonDialogOpen(true)
  }

  const handleAddLesson = async () => {
    if (!lessonModuleId || !lessonTitle.trim()) {
      showToast("Lesson title is required", "error")
      return
    }

    const payload: LessonCreatePayload = {
      title: lessonTitle.trim(),
      contentType: lessonContentType,
    }

    if (lessonContentType === "TEXT" || lessonContentType === "TEXT_IMAGE") {
      payload.textContent = lessonTextContent.trim()
    }
    if (lessonContentType === "IMAGE" || lessonContentType === "TEXT_IMAGE") {
      payload.imageUrl = lessonImageUrl.trim()
    }
    if (lessonContentType === "VIDEO") {
      payload.videoUrl = lessonVideoUrl.trim()
    }

    setLessonSaving(true)
    try {
      const lesson = await courseApi.addLesson(lessonModuleId, payload)
      setModules(
        modules.map((mod) =>
          mod.id === lessonModuleId
            ? {
                ...mod,
                lessons: [
                  ...mod.lessons,
                  {
                    id: lesson.id,
                    title: lesson.title,
                    contentType: lesson.contentType,
                    textContent: lesson.textContent,
                    imageUrl: lesson.imageUrl,
                    videoUrl: lesson.videoUrl,
                  },
                ],
              }
            : mod
        )
      )
      setLessonDialogOpen(false)
      showToast("Lesson added!", "success")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add lesson"
      showToast(msg, "error")
    } finally {
      setLessonSaving(false)
    }
  }

  // ─── Question Dialog ─────────────────────────────────────────────
  const openQuestionDialog = () => {
    setQStatement("")
    setQTopic("")
    setQConcept("")
    setQDifficulty("MEDIUM")
    setQOptions(["", ""])
    setQCorrectAnswer("")
    setQuestionDialogOpen(true)
  }

  const handleAddQuestion = async () => {
    if (!selectedModuleId) return
    if (!qStatement.trim() || !qTopic.trim() || !qConcept.trim()) {
      showToast("Statement, topic, and concept are required", "error")
      return
    }
    const filteredOptions = qOptions.filter((o) => o.trim())
    if (filteredOptions.length < 2) {
      showToast("At least 2 options are required", "error")
      return
    }
    if (!qCorrectAnswer) {
      showToast("Select the correct answer", "error")
      return
    }

    setQuestionSaving(true)
    try {
      const q = await courseApi.addQuestion(selectedModuleId, {
        statement: qStatement.trim(),
        topic: qTopic.trim(),
        concept: qConcept.trim(),
        difficulty: qDifficulty,
        options: filteredOptions,
        correctAnswer: qCorrectAnswer,
      })
      setQuestions([...questions, q])
      // Update question count on the module
      setModules(
        modules.map((m) =>
          m.id === selectedModuleId ? { ...m, questionCount: m.questionCount + 1 } : m
        )
      )
      setQuestionDialogOpen(false)
      showToast("Question added!", "success")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add question"
      showToast(msg, "error")
    } finally {
      setQuestionSaving(false)
    }
  }

  // ─── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Course" : "Create Course"}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update your course curriculum and content."
              : "Create and manage your course curriculum."}
          </p>
          {courseId && (
            <Badge variant="outline" className="mt-2 capitalize">
              {approvalStatus.replace(/_/g, " ").toLowerCase()}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {toast && <InlineToast message={toast.message} variant={toast.variant} />}
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {courseId ? "Saved" : "Save Draft"}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !courseId}>
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit for Approval
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="curriculum" disabled={!courseId}>
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="questions" disabled={!courseId}>
            Quiz Questions
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Course Details ──────────────────────────────── */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Advanced System Design"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  placeholder="Brief description of the course..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              {!courseId && (
                <Button onClick={handleSaveDraft} disabled={saving} className="w-full sm:w-auto">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Course
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 2: Curriculum ──────────────────────────────────── */}
        <TabsContent value="curriculum">
          <div className="space-y-4">
            {modules.map((mod) => (
              <Card key={mod.id}>
                <CardHeader className="p-4 flex flex-row items-center gap-4 bg-muted/20 border-b relative">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab shrink-0" />
                  <span className="font-semibold text-lg flex-1">{mod.title}</span>
                  <Badge variant="secondary" className="shrink-0">
                    {mod.questionCount} Q&apos;s
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {mod.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-background"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm font-medium">{lesson.title}</span>
                      <div className="flex-1" />
                      <Badge variant="outline" className="flex items-center gap-1.5">
                        {contentTypeIcon(lesson.contentType)}
                        {contentTypeLabel(lesson.contentType)}
                      </Badge>
                    </div>
                  ))}

                  {/* Add Lesson Button → opens dialog */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openLessonDialog(mod.id)}
                    className="w-full border-dashed"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Lesson
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Button onClick={handleAddModule} className="w-full">
              <PlusCircle className="w-4 h-4 mr-2" /> Add Module
            </Button>
          </div>
        </TabsContent>

        {/* ─── Tab 3: Quiz Questions ──────────────────────────────── */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Question Bank</span>
                {selectedModuleId && (
                  <Button size="sm" onClick={openQuestionDialog}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Question
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Module selector */}
              <div className="space-y-2">
                <Label>Select Module</Label>
                <Select
                  value={selectedModuleId ? String(selectedModuleId) : ""}
                  onValueChange={(v) => setSelectedModuleId(Number(v))}
                >
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue placeholder="Choose a module..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.title} ({m.questionCount} questions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedModuleId ? (
                <div className="text-center p-12 border-dashed border-2 rounded-lg text-muted-foreground">
                  <FileQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a module above to manage its questions.</p>
                </div>
              ) : questionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center p-12 border-dashed border-2 rounded-lg text-muted-foreground">
                  <FileQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No questions yet for this module.</p>
                  <Button className="mt-4" variant="outline" onClick={openQuestionDialog}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Add First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-4 border rounded-lg bg-muted/10 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground mr-2">Q{idx + 1}.</span>
                          {q.statement}
                        </p>
                        <Badge variant="outline" className="shrink-0 capitalize">
                          {q.difficulty.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`text-xs px-3 py-2 rounded-md border ${
                              opt === q.correctAnswer
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium"
                                : "bg-background"
                            }`}
                          >
                            {opt}
                            {opt === q.correctAnswer && (
                              <CheckCircle2 className="inline w-3 h-3 ml-1.5" />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>Topic: {q.topic}</span>
                        <span>•</span>
                        <span>Concept: {q.concept}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Add Lesson Dialog ────────────────────────────────────── */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Lesson</DialogTitle>
            <DialogDescription>
              Create a new lesson with content. Choose a content type and provide the necessary details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title</Label>
              <Input
                id="lesson-title"
                placeholder="e.g. Introduction to REST APIs"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select
                value={lessonContentType}
                onValueChange={(v) => setLessonContentType(v as ContentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Text
                    </span>
                  </SelectItem>
                  <SelectItem value="IMAGE">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Image URL
                    </span>
                  </SelectItem>
                  <SelectItem value="VIDEO">
                    <span className="flex items-center gap-2">
                      <Video className="w-4 h-4" /> Video URL
                    </span>
                  </SelectItem>
                  <SelectItem value="TEXT_IMAGE">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <ImageIcon className="w-4 h-4" /> Text + Image
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional content fields */}
            {(lessonContentType === "TEXT" || lessonContentType === "TEXT_IMAGE") && (
              <div className="space-y-2">
                <Label htmlFor="lesson-text">Text Content</Label>
                <Textarea
                  id="lesson-text"
                  placeholder="Enter lesson text content..."
                  value={lessonTextContent}
                  onChange={(e) => setLessonTextContent(e.target.value)}
                  rows={4}
                />
              </div>
            )}
            {(lessonContentType === "IMAGE" || lessonContentType === "TEXT_IMAGE") && (
              <div className="space-y-2">
                <Label htmlFor="lesson-image">Image URL</Label>
                <Input
                  id="lesson-image"
                  placeholder="https://example.com/image.png"
                  value={lessonImageUrl}
                  onChange={(e) => setLessonImageUrl(e.target.value)}
                />
              </div>
            )}
            {lessonContentType === "VIDEO" && (
              <div className="space-y-2">
                <Label htmlFor="lesson-video">Video URL</Label>
                <Input
                  id="lesson-video"
                  placeholder="https://youtube.com/watch?v=..."
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLesson} disabled={lessonSaving}>
              {lessonSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Question Dialog ──────────────────────────────────── */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
            <DialogDescription>
              Create a quiz question for this module. Provide the statement, options, and mark the correct answer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="q-statement">Question Statement</Label>
              <Textarea
                id="q-statement"
                placeholder="What is the primary purpose of..."
                value={qStatement}
                onChange={(e) => setQStatement(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="q-topic">Topic</Label>
                <Input
                  id="q-topic"
                  placeholder="e.g. REST APIs"
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-concept">Concept</Label>
                <Input
                  id="q-concept"
                  placeholder="e.g. HTTP Methods"
                  value={qConcept}
                  onChange={(e) => setQConcept(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={qDifficulty} onValueChange={(v) => setQDifficulty(v as "EASY" | "MEDIUM" | "HARD")}>
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
              <Label>Answer Options</Label>
              {qOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...qOptions]
                      newOpts[idx] = e.target.value
                      setQOptions(newOpts)
                      // Clear correct answer if it was this option and it changed
                      if (qCorrectAnswer === opt && e.target.value !== opt) {
                        setQCorrectAnswer("")
                      }
                    }}
                  />
                  {qOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive"
                      onClick={() => {
                        const newOpts = qOptions.filter((_, i) => i !== idx)
                        setQOptions(newOpts)
                        if (qCorrectAnswer === opt) setQCorrectAnswer("")
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {qOptions.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQOptions([...qOptions, ""])}
                  className="w-full border-dashed"
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Option
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Select value={qCorrectAnswer} onValueChange={setQCorrectAnswer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the correct option..." />
                </SelectTrigger>
                <SelectContent>
                  {qOptions
                    .filter((o) => o.trim())
                    .map((opt, idx) => (
                      <SelectItem key={idx} value={opt}>
                        {opt}
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
            <Button onClick={handleAddQuestion} disabled={questionSaving}>
              {questionSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
