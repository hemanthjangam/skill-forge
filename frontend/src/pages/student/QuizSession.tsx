import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import { courseApi, type QuizAnswerPayload, type QuizQuestion, type QuizRoundResult, type QuizSubmitResult } from "../../api/courseApi"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Progress } from "../../components/ui/progress"
import { Badge } from "../../components/ui/badge"
import { Skeleton } from "../../components/ui/skeleton"
import { Clock, AlertCircle, HelpCircle } from "lucide-react"

const QUIZ_TIME_LIMIT = 600 // 10 minutes

export function QuizSession() {
  const { quizId: moduleId, courseId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as { moduleTitle?: string; courseId?: string } | null
  const resolvedCourseId = courseId ?? routeState?.courseId

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [roundQuestions, setRoundQuestions] = useState<QuizQuestion[]>([])
  const [roundAnswers, setRoundAnswers] = useState<Record<number, string>>({})
  const [allAnswers, setAllAnswers] = useState<QuizAnswerPayload[]>([])
  const [adaptiveMessage, setAdaptiveMessage] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME_LIMIT)

  const { data: initialQuestions, isLoading, isError } = useQuery({
    queryKey: ['quizQuestions', moduleId],
    queryFn: () => courseApi.getStudentQuizQuestions(Number(moduleId)),
    enabled: !!moduleId,
    retry: false,
  })

  useEffect(() => {
    if (initialQuestions && roundQuestions.length === 0) {
      setRoundQuestions(initialQuestions)
    }
  }, [initialQuestions, roundQuestions.length])

  const submitMutation = useMutation({
    mutationFn: (payload: { cumulativeAnswers: QuizAnswerPayload[]; currentRoundQuestionIds: number[] }) =>
      courseApi.submitQuizRound({
        moduleId: Number(moduleId),
        answers: payload.cumulativeAnswers,
        currentRoundQuestionIds: payload.currentRoundQuestionIds,
      }),
    onSuccess: (response: QuizRoundResult, variables) => {
      if (response.completed && response.result) {
        const result: QuizSubmitResult = {
          ...response.result,
          moduleTitle: routeState?.moduleTitle,
          courseId: resolvedCourseId ? Number(resolvedCourseId) : undefined,
        }
        navigate(`/student/quiz/${moduleId}/result`, { state: { result } })
        return
      }

      setAllAnswers(variables.cumulativeAnswers)
      setRoundQuestions(response.nextQuestions ?? [])
      setRoundAnswers({})
      setCurrentQuestionIndex(0)
      setAdaptiveMessage(
        response.weakConcepts.length > 0
          ? `Extra practice unlocked for ${response.weakConcepts.join(", ")}.`
          : "Extra practice questions unlocked."
      )
    },
  })

  const questions = roundQuestions

  const handleSubmit = useCallback(() => {
    if (!questions || submitMutation.isPending) return
    const currentRoundAnswers = questions.map(q => ({
      questionId: q.id,
      selectedAnswer: roundAnswers[q.id] ?? '',
    }))

    submitMutation.mutate({
      cumulativeAnswers: [...allAnswers, ...currentRoundAnswers],
      currentRoundQuestionIds: questions.map(q => q.id),
    })
  }, [questions, submitMutation, roundAnswers, allAnswers])

  // Timer
  useEffect(() => {
    if (!questions) return
    if (timeLeft <= 0) { handleSubmit(); return }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, questions, handleSubmit])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto space-y-6 w-full py-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  if (isError || questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
        <HelpCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Quiz Unavailable</h2>
        <p className="text-muted-foreground max-w-sm">
          This module doesn't have enough questions yet (at least 5 required). Check back after the trainer adds more questions.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = (currentQuestionIndex / questions.length) * 100
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const allAnswered = questions.every(q => roundAnswers[q.id] !== undefined)

  return (
    <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto space-y-6 w-full py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {routeState?.moduleTitle ? `${routeState.moduleTitle} — Knowledge Check` : 'Knowledge Check'}
          </h2>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
            {allAnswers.length > 0 ? ` • ${allAnswers.length} answered in previous rounds` : ''}
          </p>
        </div>
        <div className={`flex items-center gap-2 font-mono text-lg px-4 py-2 rounded-lg border ${timeLeft < 60 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-muted'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {adaptiveMessage ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {adaptiveMessage}
        </div>
      ) : null}

      <Progress value={progress} className="h-2" />

      {/* Question Card */}
      <Card className="flex-1 shadow-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.statement}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0 ml-4">{currentQuestion.concept}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = roundAnswers[currentQuestion.id] === option
            return (
              <button
                key={idx}
                onClick={() => setRoundAnswers(prev => ({ ...prev, [currentQuestion.id]: option }))}
                className={`w-full flex items-center p-4 border rounded-xl text-left transition-all
                  ${isSelected
                    ? 'border-primary ring-1 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50 border-border'
                  }
                `}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 shrink-0
                  ${isSelected ? 'border-primary' : 'border-muted-foreground'}`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                </div>
                <span className="text-base">{option}</span>
              </button>
            )
          })}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          {!isLastQuestion ? (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={roundAnswers[currentQuestion.id] === undefined}
            >
              Next Question
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {!allAnswered && isLastQuestion && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Please answer all questions before submitting.
        </div>
      )}
    </div>
  )
}
