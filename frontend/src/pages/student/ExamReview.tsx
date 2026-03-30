import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { supportApi } from "../../api/supportApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react"

export function ExamReview() {
  const { attemptId } = useParams()
  const reviewQuery = useQuery({
    queryKey: ["examReview", attemptId],
    queryFn: () => supportApi.getAttemptReview(Number(attemptId)),
    enabled: Boolean(attemptId),
  })

  if (reviewQuery.isLoading) {
    return <div className="flex-1 rounded-3xl border border-border/70 bg-card/90 p-8">Loading review...</div>
  }

  if (!reviewQuery.data) {
    return <div className="flex-1 rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-destructive">Review not available.</div>
  }

  const review = reviewQuery.data

  return (
    <div className="flex-1 space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{Math.round(review.scorePercentage)}%</p>
            <p className="mt-2 text-sm text-muted-foreground">{review.correctAnswers} of {review.totalQuestions} correct</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proctoring score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{Math.round(review.proctoringScore)}%</p>
            <p className="mt-2 text-sm text-muted-foreground">{review.violationCount} recorded violation(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Course</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{review.courseTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">{review.examTitle}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Review and feedback
          </CardTitle>
          <CardDescription>Answer-level correctness and explanations to improve the next attempt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {review.questions.map((question, index) => (
            <div key={question.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Question {index + 1}</p>
                  <p className="mt-2 text-sm">{question.statement}</p>
                </div>
                {question.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <p>Your answer: <span className="font-medium text-foreground">{question.selectedAnswer}</span></p>
                <p>Correct answer: <span className="font-medium text-foreground">{question.correctAnswer}</span></p>
                <p>Explanation: {question.explanation}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
