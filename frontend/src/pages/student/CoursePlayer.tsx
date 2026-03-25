import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, Link, useNavigate } from "react-router-dom"
import { courseApi } from "../../api/courseApi"
import { useAuthStore } from "../../store/useAuthStore"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion"
import { Skeleton } from "../../components/ui/skeleton"
import { PlayCircle, FileText, Circle, ArrowLeft, ArrowRight, CheckCircle, HelpCircle, Trophy } from "lucide-react"

type ActiveItem = { type: 'lesson'; id: string } | { type: 'quiz'; moduleId: string; moduleTitle: string }

export function CoursePlayer() {
  const queryClient = useQueryClient()
  const { role } = useAuthStore()
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { data: outline, isLoading, isError } = useQuery({
    queryKey: ['courseOutline', courseId],
    queryFn: () => courseApi.getCourseOutline(courseId!),
    enabled: !!courseId,
  })

  const completeMutation = useMutation({
    mutationFn: (lessonId: string) => courseApi.markLessonComplete(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseOutline', courseId] })
    }
  })

  const allLessons = outline?.modules.flatMap(m => m.lessons) ?? []

  // Determine effective active item: default to first lesson
  const effectiveActiveItem: ActiveItem = activeItem ?? (allLessons[0] ? { type: 'lesson', id: allLessons[0].id.toString() } : { type: 'lesson', id: '' })

  const activeLesson = effectiveActiveItem.type === 'lesson'
    ? allLessons.find(l => l.id.toString() === effectiveActiveItem.id) ?? null
    : null


  const buildNavItems = () => {
    if (!outline) return []
    const items: ActiveItem[] = []
    for (const mod of outline.modules) {
      for (const lesson of mod.lessons) {
        items.push({ type: 'lesson', id: lesson.id.toString() })
      }
      if (mod.questionCount >= 5) {
        items.push({ type: 'quiz', moduleId: mod.id.toString(), moduleTitle: mod.title })
      }
    }
    return items
  }

  const navItems = buildNavItems()
  const currentNavIndex = navItems.findIndex(item => {
    if (effectiveActiveItem.type === 'lesson' && item.type === 'lesson')
      return item.id === effectiveActiveItem.id
    if (effectiveActiveItem.type === 'quiz' && item.type === 'quiz')
      return item.moduleId === effectiveActiveItem.moduleId
    return false
  })

  const prevItem = currentNavIndex > 0 ? navItems[currentNavIndex - 1] : null
  const nextItem = currentNavIndex < navItems.length - 1 ? navItems[currentNavIndex + 1] : null

  const renderIcon = (type: string) => {
    if (type === 'VIDEO') return <PlayCircle className="w-4 h-4 text-muted-foreground shrink-0" />
    if (type === 'TEXT') return <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
    return <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
  }

  const renderContent = () => {
    if (effectiveActiveItem.type === 'quiz') {
      return (
        <Card className="w-full max-w-2xl mx-auto shadow-none border-dashed bg-muted/10">
          <CardContent className="pt-6 flex flex-col items-center justify-center p-12 text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Knowledge Check</h2>
              <p className="text-muted-foreground max-w-sm">
                Test your understanding of <strong>{effectiveActiveItem.moduleTitle}</strong>. You'll start with 5 questions, and if you miss a concept you'll get extra practice from that module's pool.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full max-w-xs h-12 text-base"
              onClick={() => navigate(`/student/courses/${courseId}/quiz/${effectiveActiveItem.moduleId}`, {
                state: { moduleTitle: effectiveActiveItem.moduleTitle, courseId }
              })}
            >
              Start Knowledge Check
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (!activeLesson) return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a lesson to begin
      </div>
    )

    if (activeLesson.contentType === 'VIDEO' && activeLesson.contentUrl) {
      const embedUrl = activeLesson.contentUrl
        .replace('watch?v=', 'embed/')
        .replace('youtu.be/', 'www.youtube.com/embed/')
      return (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={embedUrl}
            title={activeLesson.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    if (activeLesson.contentType === 'TEXT' && activeLesson.textContent) {
      return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: activeLesson.textContent }} />
        </div>
      )
    }

    if (activeLesson.imageUrl) {
      return (
        <div className="space-y-6">
          <img src={activeLesson.imageUrl} alt={activeLesson.title} className="rounded-xl w-full object-cover max-h-96" />
          {activeLesson.textContent && (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: activeLesson.textContent }} />
            </div>
          )}
        </div>
      )
    }

    return (
      <Card className="w-full max-w-2xl mx-auto shadow-none border-dashed bg-muted/10">
        <CardContent className="pt-6 flex flex-col items-center justify-center p-12 text-center gap-4">
          <h2 className="text-xl font-bold">{activeLesson.title}</h2>
          <p className="text-muted-foreground">Content for this lesson is being prepared.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-60px)] -m-4 lg:-m-6 border-t overflow-hidden">
        <div className="w-80 border-r bg-muted/20 flex flex-col">
          <div className="p-4 border-b"><Skeleton className="h-6 w-32" /></div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10" />)}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-64 w-full max-w-2xl mx-8" />
        </div>
      </div>
    )
  }

  if (isError || !outline) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-semibold mb-2">Failed to load course</p>
          <Button asChild variant="outline"><Link to={role === 'ADMIN' ? "/admin/courses" : "/student/courses"}>Back to Courses</Link></Button>
        </div>
      </div>
    )
  }

  const progress = outline.progressPercentage ?? 0

  return (
    <div className="flex h-[calc(100vh-60px)] -m-4 lg:-m-6 border-t overflow-hidden">
      {/* Sidebar Navigation */}
      <div className={`border-r bg-muted/20 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-0 overflow-hidden border-r-0'}`}>
        <div className="p-4 border-b bg-muted/40 font-semibold flex items-center justify-between">
          <span>Course Contents</span>
        </div>

        {/* Progress Bar */}
        {role === 'STUDENT' && (
          <div className="px-4 py-3 border-b bg-background/60">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progress</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Trophy className="w-3 h-3" /> Course Complete!
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {outline.modules.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No lessons available yet.</p>
          ) : (
            <Accordion type="multiple" defaultValue={outline.modules.map(m => m.id.toString())} className="w-full">
              {outline.modules.map((module) => (
                <AccordionItem value={module.id.toString()} key={module.id} className="border-b-0">
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 text-sm font-semibold tracking-tight">
                    {module.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="flex flex-col">
                      {module.lessons.map((lesson) => {
                        const lid = lesson.id.toString()
                        const isActive = effectiveActiveItem.type === 'lesson' && effectiveActiveItem.id === lid
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setActiveItem({ type: 'lesson', id: lid })}
                            className={`flex items-start text-left gap-3 px-6 py-3 text-sm transition-colors
                              ${isActive
                                ? 'bg-primary/10 border-r-2 border-primary text-primary font-medium'
                                : 'hover:bg-muted text-muted-foreground'
                              }`}
                          >
                            <div className="relative pt-0.5 shrink-0">
                              {renderIcon(lesson.contentType)}
                              {lesson.isCompleted && (
                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full">
                                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                                </div>
                              )}
                            </div>
                            <span className="line-clamp-2">{lesson.title}</span>
                          </button>
                        )
                      })}

                      {/* Knowledge Check entry if ≥5 questions exist */}
                      {module.questionCount >= 5 && (() => {
                        const isActive = effectiveActiveItem.type === 'quiz' && effectiveActiveItem.moduleId === module.id.toString()
                        return (
                          <button
                            onClick={() => setActiveItem({ type: 'quiz', moduleId: module.id.toString(), moduleTitle: module.title })}
                            className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors
                              ${isActive
                                ? 'bg-primary/10 border-r-2 border-primary text-primary font-medium'
                                : 'hover:bg-muted text-muted-foreground'
                              }`}
                          >
                            <HelpCircle className="w-4 h-4 shrink-0" />
                            <span>Knowledge Check</span>
                          </button>
                        )
                      })()}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
        <header className="h-14 border-b flex items-center px-4 justify-between bg-background z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
            </Button>
            <h1 className="font-semibold text-sm md:text-base hidden sm:block">
              {effectiveActiveItem.type === 'quiz'
                ? `Knowledge Check: ${effectiveActiveItem.moduleTitle}`
                : (activeLesson?.title ?? outline.title)}
            </h1>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={role === 'ADMIN' ? "/admin/courses" : `/student/courses/${courseId}`}>
              {role === 'ADMIN' ? 'Back to Approvals' : 'Back to Course'}
            </Link>
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-8 pb-24">
            <h1 className="text-3xl font-bold tracking-tight mb-8 sm:hidden">
              {effectiveActiveItem.type === 'quiz' ? 'Knowledge Check' : activeLesson?.title}
            </h1>
            {renderContent()}
          </div>
        </main>

        <footer className="border-t bg-background/95 backdrop-blur absolute bottom-0 w-full p-4 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={!prevItem}
            onClick={() => prevItem && setActiveItem(prevItem)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>

          <div className="flex-1 flex justify-center hidden sm:flex">
            {role === 'STUDENT' && effectiveActiveItem.type === 'lesson' && activeLesson && !activeLesson.isCompleted && (
              <Button
                variant="secondary"
                onClick={() => completeMutation.mutate(activeLesson.id.toString())}
                disabled={completeMutation.isPending}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            )}
            {role === 'STUDENT' && effectiveActiveItem.type === 'lesson' && activeLesson?.isCompleted && (
              <div className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-500">
                <CheckCircle className="w-4 h-4 mr-2" /> Completed
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {currentNavIndex + 1} / {navItems.length}
            </span>
            <Button
              disabled={!nextItem}
              onClick={() => nextItem && setActiveItem(nextItem)}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
