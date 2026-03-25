import { Outlet } from "react-router-dom"
import { Award, BrainCircuit, ChartNoAxesColumn, Sparkles } from "lucide-react"

export function AuthLayout() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_24%),linear-gradient(180deg,#f8fafc,#eef6ff_42%,#f8fafc)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_24%),linear-gradient(180deg,#0f172a,#101827_42%,#09090b)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 mesh-overlay opacity-50" />
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-10 text-white shadow-[0_28px_90px_-38px_rgba(15,23,42,0.7)] lg:flex lg:flex-col">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-[0_18px_40px_-20px_rgba(125,211,252,0.45)]">
            <Award className="h-6 w-6" />
          </div>
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">SkillForge</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
              Professional learning UI with stronger motion, cleaner focus, and richer study feedback.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
              Sign in to continue your courses, keep your streak active, review skill mastery, and step into guided concept practice.
            </p>
          </div>
          <div className="mt-auto grid gap-4">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 p-4">
              <BrainCircuit className="mt-0.5 h-5 w-5 text-indigo-300" />
              <div>
                <p className="font-medium">AI-guided concept sessions</p>
                <p className="mt-1 text-sm text-white/68">Move from quiz data to focused concept teaching and reflection feedback.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 p-4">
              <ChartNoAxesColumn className="mt-0.5 h-5 w-5 text-sky-300" />
              <div>
                <p className="font-medium">Real streak analytics</p>
                <p className="mt-1 text-sm text-white/68">Contribution-style streak tracking and cleaner weekly performance signals.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 text-amber-300" />
              <div>
                <p className="font-medium">Project-heavy course experience</p>
                <p className="mt-1 text-sm text-white/68">Course discovery and detail pages now feel more intentional and professional.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_20px_45px_-24px_rgba(15,23,42,0.65)] dark:bg-white dark:text-slate-950 lg:mx-0">
                <Award className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Welcome to SkillForge</h1>
              <p className="text-sm text-muted-foreground">
                Continue learning with a cleaner, more focused workspace.
              </p>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
