import { useNavigate, useLocation, useParams } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { CheckCircle2, XCircle, ArrowRight, BarChart3, HelpCircle } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import type { QuizSubmitResult } from "../../api/courseApi"

type RouteState = { result: QuizSubmitResult } | null

export function QuizResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const { quizId: moduleId } = useParams()
  const state = location.state as RouteState
  const result = state?.result

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
        <HelpCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Results Found</h2>
        <p className="text-muted-foreground max-w-sm">
          It looks like you navigated here directly. Please complete a quiz first.
        </p>
        <Button variant="outline" onClick={() => navigate('/student/courses')}>
          Browse Courses
        </Button>
      </div>
    )
  }

  const score = result.scorePercentage
  const correct = result.correctAnswers
  const incorrect = result.totalQuestions - result.correctAnswers
  const conceptData = Object.entries(result.conceptAccuracy).map(([concept, accuracy]) => ({
    concept,
    accuracy: Math.round(accuracy),
  }))
  const circumference = 2 * Math.PI * 56 // r=56
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`

  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Knowledge Check Results</h2>
          <p className="text-muted-foreground">
            {result.moduleTitle ? `Module: ${result.moduleTitle}` : 'Review your performance and concept mastery.'}
          </p>
        </div>
        <Button onClick={() => navigate('/student')}>
          Back to Dashboard
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Score Overview */}
        <Card className="col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Total Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 pt-0">
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted" />
                <circle
                  cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  className={score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-primary' : 'text-destructive'}
                />
              </svg>
              <span className="absolute text-3xl font-bold">{Math.round(score)}%</span>
            </div>
            <div className="flex gap-4 mt-6 text-sm">
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{correct} Correct</span>
              </div>
              <div className="flex items-center gap-1.5 text-destructive">
                <XCircle className="w-4 h-4" />
                <span>{incorrect} Incorrect</span>
              </div>
            </div>

            {/* Grade label */}
            <div className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold ${
              score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
              : score >= 50 ? 'bg-primary/10 text-primary'
              : 'bg-destructive/10 text-destructive'
            }`}>
              {score >= 80 ? '🎉 Excellent!' : score >= 50 ? '👍 Good Effort' : '📚 Keep Practising'}
            </div>
          </CardContent>
        </Card>

        {/* Concept Accuracy Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Concept Accuracy
            </CardTitle>
            <CardDescription>How well you performed in each distinct concept area.</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px]">
            {conceptData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No concept data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conceptData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="concept" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value) => [`${value}%`, 'Accuracy']}
                  />
                  <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} barSize={20}>
                    {conceptData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.accuracy > 75 ? 'hsl(142 76% 36%)' : entry.accuracy > 40 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        {result.courseId ? (
          <Button variant="outline" onClick={() => navigate(`/student/courses/${result.courseId}/player`)}>
            Back to Course
          </Button>
        ) : (
          <div />
        )}
        <Button onClick={() => navigate(`/student/courses/${result.courseId ?? ''}/quiz/${moduleId}`, {
          state: { moduleTitle: result.moduleTitle, courseId: result.courseId }
        })}>
          Retake Quiz <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
