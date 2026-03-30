import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supportApi } from "../../api/supportApi"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Textarea } from "../../components/ui/textarea"

export function SupportDesk() {
  const queryClient = useQueryClient()
  const [resolutionById, setResolutionById] = useState<Record<number, string>>({})

  const doubtsQuery = useQuery({
    queryKey: ["adminOpenDoubts"],
    queryFn: supportApi.getOpenDoubts,
  })

  const resolveMutation = useMutation({
    mutationFn: ({ doubtId, resolution }: { doubtId: number; resolution: string }) => supportApi.resolveDoubt(doubtId, resolution),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminOpenDoubts"] })
    },
  })

  return (
    <div className="flex-1">
      <Card className="border-white/10 bg-card/95">
        <CardHeader>
          <CardTitle>Support Desk</CardTitle>
          <CardDescription>Admin review queue for unresolved academic doubts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(doubtsQuery.data ?? []).map((doubt) => (
            <div key={doubt.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-sm font-semibold">{doubt.studentName} • {doubt.courseTitle ?? "General"}</p>
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
