import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { courseApi } from "../../api/courseApi"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Skeleton } from "../../components/ui/skeleton"
import { Search, BookOpen, User, Clock3, Sparkles } from "lucide-react"
import { getCourseTheme } from "../../lib/courseThemes"

export function CourseList() {
  const [search, setSearch] = useState("")

  const { data, isLoading, isError } = useQuery({
    queryKey: ['publishedCourses'],
    queryFn: () => courseApi.getPublishedCourses(0, 50),
  })

  const courses = data?.content ?? []

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Browse Courses</h2>
          <p className="text-muted-foreground">Discover new skills or continue where you left off.</p>
        </div>
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="w-full pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-sm text-destructive border border-destructive/30 rounded-lg bg-destructive/5">
          Failed to load courses. Please refresh.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <BookOpen className="w-12 h-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-muted-foreground">
              {search ? "No courses match your search." : "No published courses yet."}
            </p>
            {search && (
              <p className="text-sm text-muted-foreground/70 mt-1">Try a different keyword.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(course => (
            <Card key={course.id} className={`group flex h-full flex-col overflow-hidden border-white/10 bg-card/95 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${getCourseTheme(course.title).glow}`}>
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={getCourseTheme(course.title).thumbnail}
                  alt={course.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${getCourseTheme(course.title).gradient}`} />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                  <Badge className="border-white/20 bg-white/12 text-white backdrop-blur-sm hover:bg-white/12">
                    {getCourseTheme(course.title).category}
                  </Badge>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${getCourseTheme(course.title).accent} text-slate-950 shadow-lg`}>
                    {(() => {
                      const Icon = getCourseTheme(course.title).icon
                      return <Icon className="h-5 w-5" />
                    })()}
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/80">
                    <span>{getCourseTheme(course.title).level}</span>
                    <span>•</span>
                    <span>{getCourseTheme(course.title).duration}</span>
                  </div>
                  <h3 className="line-clamp-2 text-lg font-semibold leading-tight">{course.title}</h3>
                </div>
              </div>
              <CardHeader className="p-4 pb-2 flex-1">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Badge variant="outline" className="border-border/70 bg-muted/40">
                    {course.approvalStatus}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {getCourseTheme(course.title).duration}
                  </div>
                </div>
                <CardTitle className="line-clamp-2 text-base">{getCourseTheme(course.title).category}</CardTitle>
                <CardDescription className="line-clamp-3">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  {course.trainerName}
                </div>
                <div className="grid gap-2">
                  {getCourseTheme(course.title).highlights.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-foreground/80">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button asChild className="w-full" variant="default">
                  <Link to={`/student/courses/${course.id}`}>View Course</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !isError && data && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filtered.length} of {data.totalElements} courses
        </p>
      )}
    </div>
  )
}
