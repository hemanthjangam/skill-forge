import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userApi, type UpdateProfileRequest } from "../../api/userApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"
import { Skeleton } from "../../components/ui/skeleton"
import { User, Mail, Shield, BookOpen, Target, Lightbulb, Edit2, Check, X, Sparkles } from "lucide-react"

export function Profile() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['myProfile'],
    queryFn: userApi.getMyProfile,
  })

  const [form, setForm] = useState<UpdateProfileRequest>({})

  const mutation = useMutation({
    mutationFn: userApi.updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] })
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  })

  const handleEdit = () => {
    if (profile) {
      setForm({
        name: profile.name,
        email: profile.email,
        educationLevel: profile.educationLevel ?? '',
        learningGoal: profile.learningGoal ?? '',
        specialization: profile.specialization ?? '',
        bio: profile.bio ?? '',
      })
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setForm({})
  }

  const handleSave = () => {
    mutation.mutate(form)
  }

  const getRoleBadgeVariant = (role?: string) => {
    if (role === 'ADMIN') return 'destructive'
    if (role === 'TRAINER') return 'secondary'
    return 'default'
  }

  const getStatusBadgeClass = (status?: string) => {
    if (status === 'ACTIVE') return 'bg-green-500 hover:bg-green-600'
    if (status === 'INACTIVE') return 'bg-yellow-500 hover:bg-yellow-600'
    return 'bg-gray-500 hover:bg-gray-600'
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 max-w-3xl mx-auto w-full">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load profile</h3>
          <p className="text-muted-foreground">Please refresh the page and try again.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
          <p className="text-muted-foreground">Manage your identity, learning context, and role-specific profile details.</p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 dark:bg-green-500/10 px-4 py-2 rounded-lg border border-green-200 dark:border-green-500/20">
            <Check className="w-4 h-4" /> Profile saved successfully!
          </div>
        )}
      </div>

      {/* Account Info Card */}
      <Card className="overflow-hidden border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your role, status, and login details.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={getRoleBadgeVariant(profile?.role)}>{profile?.role}</Badge>
            <Badge className={getStatusBadgeClass(profile?.status)}>{profile?.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
            <User className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-semibold">
                {isEditing
                  ? <Input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-8 mt-1" />
                  : profile?.name
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
            <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-semibold">
                {isEditing
                  ? <Input value={form.email ?? profile?.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1 h-8" />
                  : profile?.email
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Account ID</p>
              <p className="font-mono text-sm"># {profile?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Profile Card */}
      <Card className="overflow-hidden border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Learning Profile</CardTitle>
            <CardDescription>Personalize your learning journey.</CardDescription>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit2 className="w-4 h-4 mr-2" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={mutation.isPending}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
                <Check className="w-4 h-4 mr-1" />
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Profile quality matters
            </div>
            <p className="mt-2 leading-6">
              Clear education goals, specialization, and bio context help the platform feel more personalized and improve how your learning path is framed across the app.
            </p>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              Education Level
            </Label>
            {isEditing
              ? <Input
                  placeholder="e.g. Bachelor's in Computer Science"
                  value={form.educationLevel ?? ''}
                  onChange={e => setForm(f => ({ ...f, educationLevel: e.target.value }))}
                />
              : <p className="text-sm pl-6 text-foreground">{profile?.educationLevel || <span className="text-muted-foreground italic">Not set</span>}</p>
            }
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              Learning Goal
            </Label>
            {isEditing
              ? <Input
                  placeholder="e.g. Become a full-stack developer"
                  value={form.learningGoal ?? ''}
                  onChange={e => setForm(f => ({ ...f, learningGoal: e.target.value }))}
                />
              : <p className="text-sm pl-6 text-foreground">{profile?.learningGoal || <span className="text-muted-foreground italic">Not set</span>}</p>
            }
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              Specialization
            </Label>
            {isEditing
              ? <Input
                  placeholder="e.g. Frontend Development, Spring Boot"
                  value={form.specialization ?? ''}
                  onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                />
              : <p className="text-sm pl-6 text-foreground">{profile?.specialization || <span className="text-muted-foreground italic">Not set</span>}</p>
            }
          </div>

          <div className="grid gap-2">
            <Label>Bio</Label>
            {isEditing
              ? <Textarea
                  placeholder="Tell us something about yourself..."
                  value={form.bio ?? ''}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={4}
                />
              : <p className="text-sm text-foreground whitespace-pre-wrap">{profile?.bio || <span className="text-muted-foreground italic">No bio yet. Click Edit to add one.</span>}</p>
            }
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">Failed to save. Please try again.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
