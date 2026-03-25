import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { leaderboardApi } from "../../api/courseApi"
import { useAuthStore } from "../../store/useAuthStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Skeleton } from "../../components/ui/skeleton"
import { Flame, Trophy, Award, Crown, Zap } from "lucide-react"

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState("points")
  const { user } = useAuthStore()

  const pointsQuery = useQuery({
    queryKey: ['leaderboard', 'points'],
    queryFn: () => leaderboardApi.getLeaderboard(0, 20),
    enabled: activeTab === 'points',
  })

  const streaksQuery = useQuery({
    queryKey: ['leaderboard', 'streaks'],
    queryFn: () => leaderboardApi.getStreakBoard(0, 20),
    enabled: activeTab === 'streaks',
  })

  const renderRank = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500 mx-auto" />
    if (rank === 2) return <Trophy className="w-5 h-5 text-slate-400 mx-auto" />
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600 mx-auto" />
    return <span className="font-semibold text-muted-foreground">{rank}</span>
  }

  const isLoading = activeTab === 'points' ? pointsQuery.isLoading : streaksQuery.isLoading
  const isError = activeTab === 'points' ? pointsQuery.isError : streaksQuery.isError

  const renderPointsRows = () => {
    const entries = pointsQuery.data?.content ?? []
    if (entries.length === 0) return (
      <TableRow>
        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
          No entries yet. Start learning to get on the board!
        </TableCell>
      </TableRow>
    )
    return entries.map(entry => {
      const isMe = entry.userName === user?.name
      return (
        <TableRow key={entry.userId} className={isMe ? "bg-primary/5 font-semibold" : "group"}>
          <TableCell className="text-center font-medium">{renderRank(entry.rank)}</TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border bg-muted">
                <AvatarFallback>{entry.userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className={isMe ? "text-primary" : ""}>{entry.userName}{isMe ? ' (You)' : ''}</span>
            </div>
          </TableCell>
          <TableCell className="text-right font-mono font-medium">{entry.points.toLocaleString()}</TableCell>
        </TableRow>
      )
    })
  }

  const renderStreakRows = () => {
    const entries = streaksQuery.data?.content ?? []
    if (entries.length === 0) return (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
          No streak entries yet. Build a learning streak to appear here!
        </TableCell>
      </TableRow>
    )
    return entries.map(entry => {
      const isMe = entry.userName === user?.name
      return (
        <TableRow key={entry.userId} className={isMe ? "bg-primary/5 font-semibold" : "group"}>
          <TableCell className="text-center font-medium">{renderRank(entry.rank)}</TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border bg-muted">
                <AvatarFallback>{entry.userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className={isMe ? "text-primary" : ""}>{entry.userName}{isMe ? ' (You)' : ''}</span>
            </div>
          </TableCell>
          <TableCell className="text-right font-mono font-medium">{entry.points.toLocaleString()}</TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1.5 font-medium">
              <Flame className={`w-4 h-4 ${entry.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              {entry.currentStreak}
            </div>
          </TableCell>
          <TableCell className="text-right hidden sm:table-cell text-muted-foreground font-medium">
            {entry.bestStreak}
          </TableCell>
        </TableRow>
      )
    })
  }

  const renderSkeleton = (cols: number) => (
    <>{[1, 2, 3, 4, 5].map(i => (
      <TableRow key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
        ))}
      </TableRow>
    ))}</>
  )

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-7 text-white shadow-[0_28px_90px_-38px_rgba(15,23,42,0.7)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.25),transparent_34%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/75">
              <Crown className="h-3.5 w-3.5" />
              Competitive Learning
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">Global Leaderboard</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              Compare points, streak consistency, and learning momentum against the strongest active learners.
            </p>
          </div>
        </div>

        <Card className="border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
          <CardContent className="grid h-full gap-3 p-6 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Points board</p>
              <p className="mt-2 text-sm text-muted-foreground">Ranks learners by total earned points.</p>
            </div>
            <div className="rounded-2xl bg-orange-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400">Streak board</p>
              <p className="mt-2 text-sm text-muted-foreground">Highlights consistent daily practice and endurance.</p>
            </div>
            <div className="rounded-2xl bg-sky-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-sky-600 dark:text-sky-400">Your advantage</p>
              <p className="mt-2 text-sm text-muted-foreground">Daily quizzes compound into better ranking faster than irregular bursts.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="points" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="points" className="flex items-center gap-2">
            <Award className="w-4 h-4" /> Top Points
          </TabsTrigger>
          <TabsTrigger value="streaks" className="flex items-center gap-2">
            <Flame className="w-4 h-4" /> Top Streaks
          </TabsTrigger>
        </TabsList>

        <Card className="mt-6 overflow-hidden border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
          <CardHeader>
            <CardTitle>{activeTab === 'points' ? 'Highest Points' : 'Longest Streaks'}</CardTitle>
            <CardDescription>
              Rankings are updated in real-time based on {activeTab === 'points' ? 'total points earned' : 'current active streak days'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <p className="text-sm text-destructive text-center py-6">Failed to load leaderboard. Please refresh.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {activeTab === 'points' ? (
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16 text-center">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                      </TableRow>
                    ) : (
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16 text-center">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right">Current Streak</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Best Streak</TableHead>
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>
                    {isLoading
                      ? renderSkeleton(activeTab === 'points' ? 3 : 5)
                      : activeTab === 'points' ? renderPointsRows() : renderStreakRows()
                    }
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoading && !isError && (
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Rankings update as knowledge checks are recorded.
                </div>
                <p>
                  {activeTab === 'points'
                    ? `${pointsQuery.data?.totalElements ?? 0} total entries`
                    : `${streaksQuery.data?.totalElements ?? 0} total entries`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
