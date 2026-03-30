import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { courseApi } from "../../api/courseApi"
import { supportApi } from "../../api/supportApi"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Textarea } from "../../components/ui/textarea"
import { getApiErrorMessage } from "../../lib/apiError"
import { BookOpenCheck, Sparkles } from "lucide-react"

export function TrainerAssessments() {
  const queryClient = useQueryClient()
  const [courseId, setCourseId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [resolutionById, setResolutionById] = useState<Record<number, string>>({})

  const coursesQuery = useQuery({
    queryKey: ["trainerCoursesForAssessments"],
    queryFn: courseApi.getTrainerCourses,
  })

  const examsQuery = useQuery({
    queryKey: ["trainerGeneratedExams"],
    queryFn: supportApi.getTrainerExams,
  })

  const doubtsQuery = useQuery({
    queryKey: ["trainerOpenDoubts"],
    queryFn: supportApi.getOpenDoubts,
  })

  const generateMutation = useMutation({
    mutationFn: () => supportApi.generateExam(Number(courseId), {
      title,
      description,
      questionCount: 10,
      durationMinutes: 45,
    }),
    onSuccess: () => {
      setTitle("")
      setDescription("")
      void queryClient.invalidateQueries({ queryKey: ["trainerGeneratedExams"] })
    },
  })

  const resolveMutation = useMutation({
    mutationFn: ({ doubtId, resolution }: { doubtId: number; resolution: string }) => supportApi.resolveDoubt(doubtId, resolution),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trainerOpenDoubts"] })
    },
  })

  const examError = getApiErrorMessage(generateMutation.error, "Failed to generate exam.")

  return (
    <div className="flex-1 space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-white/10 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI exam generator
            </CardTitle>
            <CardDescription>Create a reusable exam definition from your course content and question bank.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {(coursesQuery.data ?? []).map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Exam title" />
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Exam description" rows={4} />
            {generateMutation.isError ? <p className="text-sm text-destructive">{examError}</p> : null}
            <Button disabled={!courseId || generateMutation.isPending} onClick={() => void generateMutation.mutateAsync()}>
              {generateMutation.isPending ? "Generating..." : "Generate exam"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5 text-primary" />
              Generated exams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(examsQuery.data ?? []).map((exam) => (
              <div key={exam.examId} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-semibold">{exam.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{exam.courseTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground">{exam.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-card/95">
        <CardHeader>
          <CardTitle>Open student doubts</CardTitle>
          <CardDescription>Resolve doubts directly from the trainer workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(doubtsQuery.data ?? []).map((doubt) => (
            <div key={doubt.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-sm font-semibold">{doubt.studentName} • {doubt.courseTitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">{doubt.question}</p>
              <Textarea
                value={resolutionById[doubt.id] ?? ""}
                onChange={(event) => setResolutionById((current) => ({ ...current, [doubt.id]: event.target.value }))}
                placeholder="Resolution for the student"
                rows={3}
                className="mt-3"
              />
              <Button
                className="mt-3"
                disabled={!resolutionById[doubt.id]?.trim() || resolveMutation.isPending}
                onClick={() => void resolveMutation.mutateAsync({ doubtId: doubt.id, resolution: resolutionById[doubt.id] })}
              >
                Resolve doubt
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
