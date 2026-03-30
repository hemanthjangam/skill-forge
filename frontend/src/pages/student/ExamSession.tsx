import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { supportApi } from "../../api/supportApi"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Progress } from "../../components/ui/progress"
import { getApiErrorMessage } from "../../lib/apiError"
import { ShieldAlert } from "lucide-react"

export function ExamSession() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const attemptIdRef = useRef<number | null>(null)

  const startQuery = useQuery({
    queryKey: ["examStart", examId],
    queryFn: () => supportApi.startExam(Number(examId)),
    enabled: Boolean(examId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!startQuery.data) return
    attemptIdRef.current = startQuery.data.attemptId
    setTimeLeft(startQuery.data.durationMinutes * 60)
  }, [startQuery.data])

  const proctorMutation = useMutation({
    mutationFn: (payload: Parameters<typeof supportApi.recordProctorEvent>[1]) => {
      if (!attemptIdRef.current) return Promise.resolve()
      return supportApi.recordProctorEvent(attemptIdRef.current, payload)
    },
  })

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!attemptIdRef.current || !startQuery.data) {
        throw new Error("Exam attempt is not ready")
      }
      return supportApi.submitExam(attemptIdRef.current, {
        answers: startQuery.data.questions.map((question) => ({
          questionId: question.id,
          selectedAnswer: answers[question.id] ?? "",
        })),
      })
    },
    onSuccess: (response) => {
      navigate(`/student/exams/attempts/${response.attemptId}/review`)
    },
  })

  useEffect(() => {
    if (!timeLeft || !startQuery.data) return
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          if (!submitMutation.isPending) {
            void submitMutation.mutateAsync()
          }
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [submitMutation, startQuery.data, timeLeft])

  useEffect(() => {
    if (!startQuery.data) return

    const requestFullscreen = async () => {
      if (document.fullscreenElement || !document.documentElement.requestFullscreen) return
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        void proctorMutation.mutateAsync({
          eventType: "FULLSCREEN_EXIT",
          severity: "MEDIUM",
          details: "Fullscreen request was blocked by the browser.",
        })
      }
    }

    const requestCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        stream.getTracks().forEach((track) => {
          track.onended = () => {
            void proctorMutation.mutateAsync({
              eventType: "FACE_MISSING",
              severity: "HIGH",
              details: "Camera stream stopped during the exam.",
            })
          }
        })
      } catch {
        void proctorMutation.mutateAsync({
          eventType: "FACE_MISSING",
          severity: "HIGH",
          details: "Camera permission was denied or unavailable.",
        })
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        void proctorMutation.mutateAsync({
          eventType: "TAB_SWITCH",
          severity: "HIGH",
          details: "Browser tab lost visibility.",
        })
      }
    }

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        void proctorMutation.mutateAsync({
          eventType: "FULLSCREEN_EXIT",
          severity: "HIGH",
          details: "Fullscreen mode was exited during the exam.",
        })
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Meta" || event.key === "Alt") {
        void proctorMutation.mutateAsync({
          eventType: "KEYBOARD_SHORTCUT",
          severity: "MEDIUM",
          details: `Restricted key used: ${event.key}`,
        })
      }
    }

    void requestFullscreen()
    void requestCamera()
    document.addEventListener("visibilitychange", onVisibilityChange)
    document.addEventListener("fullscreenchange", onFullscreenChange)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      document.removeEventListener("fullscreenchange", onFullscreenChange)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [proctorMutation, startQuery.data])

  const questions = startQuery.data?.questions ?? []
  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers])
  const canSubmit = questions.length > 0 && questions.every((question) => Boolean(answers[question.id]))
  const errorMessage = getApiErrorMessage(submitMutation.error, "Exam submission failed.")

  if (startQuery.isLoading) {
    return <div className="flex-1 rounded-3xl border border-border/70 bg-card/90 p-8">Preparing proctored exam...</div>
  }

  if (!startQuery.data) {
    return <div className="flex-1 rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-destructive">Unable to start the exam.</div>
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 p-7 text-white">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/60">Proctored examination</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">{startQuery.data.title}</h2>
              <p className="mt-3 max-w-2xl text-sm text-white/72">
                Fullscreen, tab switching, restricted keys, and camera availability are monitored and recorded with the attempt.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Time left</p>
              <p className="mt-2 text-2xl font-semibold">{formatTime(timeLeft)}</p>
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Session status
            </CardTitle>
            <CardDescription>Answer every question before submitting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                <span>Completion</span>
                <span>{answeredCount}/{questions.length}</span>
              </div>
              <Progress value={questions.length === 0 ? 0 : (answeredCount / questions.length) * 100} />
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
              Keep the window focused and stay in fullscreen. Serious violations reduce the proctoring score attached to your result.
            </div>
            {submitMutation.isError ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            <Button disabled={!canSubmit || submitMutation.isPending} onClick={() => void submitMutation.mutateAsync()}>
              {submitMutation.isPending ? "Submitting..." : "Submit exam"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id} className="border-white/10 bg-card/95">
            <CardHeader>
              <CardTitle className="text-lg">Question {index + 1}</CardTitle>
              <CardDescription>{question.concept} • {question.difficulty}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6">{question.statement}</p>
              <div className="grid gap-3">
                {question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      answers[question.id] === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:border-primary/30"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}
