import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Cloud,
  Code2,
  Database,
  GitBranchPlus,
  Layers3,
  ServerCog,
} from "lucide-react"

export type CourseTheme = {
  category: string
  level: string
  duration: string
  thumbnail: string
  gradient: string
  glow: string
  accent: string
  icon: LucideIcon
  highlights: string[]
}

const defaultTheme: CourseTheme = {
  category: "Core Learning Path",
  level: "All levels",
  duration: "8+ hours",
  thumbnail:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  gradient: "from-slate-950/90 via-slate-800/70 to-zinc-700/50",
  glow: "shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)]",
  accent: "bg-slate-500",
  icon: Layers3,
  highlights: ["Structured modules", "Hands-on learning", "Knowledge checks"],
}

const themeEntries: Array<{ match: RegExp; theme: CourseTheme }> = [
  {
    match: /react/i,
    theme: {
      category: "Frontend Project Studio",
      level: "Intermediate",
      duration: "18 hours",
      thumbnail:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      gradient: "from-cyan-950/90 via-sky-800/75 to-blue-500/45",
      glow: "shadow-[0_28px_90px_-36px_rgba(14,165,233,0.55)]",
      accent: "bg-sky-400",
      icon: Code2,
      highlights: ["Dashboard architecture", "Mutation UX", "Production polish"],
    },
  },
  {
    match: /spring boot api delivery|microservices|spring boot/i,
    theme: {
      category: "Backend Delivery Track",
      level: "Intermediate to advanced",
      duration: "20 hours",
      thumbnail:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
      gradient: "from-emerald-950/90 via-green-800/75 to-lime-500/40",
      glow: "shadow-[0_28px_90px_-36px_rgba(34,197,94,0.5)]",
      accent: "bg-emerald-400",
      icon: ServerCog,
      highlights: ["API contracts", "Transactions", "Operational security"],
    },
  },
  {
    match: /devops/i,
    theme: {
      category: "Release Engineering Lab",
      level: "Intermediate",
      duration: "16 hours",
      thumbnail:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
      gradient: "from-stone-950/90 via-orange-900/75 to-amber-500/45",
      glow: "shadow-[0_28px_90px_-36px_rgba(245,158,11,0.5)]",
      accent: "bg-amber-400",
      icon: GitBranchPlus,
      highlights: ["CI quality gates", "Rollback playbooks", "Incident response"],
    },
  },
  {
    match: /data engineering|analytics/i,
    theme: {
      category: "Data Platform Projects",
      level: "Intermediate",
      duration: "17 hours",
      thumbnail:
        "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&q=80",
      gradient: "from-violet-950/90 via-fuchsia-900/70 to-pink-500/45",
      glow: "shadow-[0_28px_90px_-36px_rgba(217,70,239,0.5)]",
      accent: "bg-fuchsia-400",
      icon: Database,
      highlights: ["Pipeline reliability", "Semantic modeling", "Decision-ready dashboards"],
    },
  },
  {
    match: /cloud architecture|system design/i,
    theme: {
      category: "Architecture Systems Lab",
      level: "Advanced",
      duration: "19 hours",
      thumbnail:
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
      gradient: "from-indigo-950/90 via-blue-900/75 to-cyan-500/40",
      glow: "shadow-[0_28px_90px_-36px_rgba(59,130,246,0.5)]",
      accent: "bg-cyan-400",
      icon: Cloud,
      highlights: ["Capacity planning", "Resilience patterns", "Evolution strategy"],
    },
  },
  {
    match: /database|sql/i,
    theme: {
      category: "Database Mastery",
      level: "Intermediate",
      duration: "12 hours",
      thumbnail:
        "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80",
      gradient: "from-neutral-950/90 via-zinc-800/75 to-emerald-500/35",
      glow: "shadow-[0_28px_90px_-36px_rgba(16,185,129,0.45)]",
      accent: "bg-emerald-400",
      icon: Database,
      highlights: ["Relational modeling", "Query performance", "ACID reasoning"],
    },
  },
  {
    match: /java/i,
    theme: {
      category: "Language Foundations",
      level: "Beginner to intermediate",
      duration: "14 hours",
      thumbnail:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
      gradient: "from-zinc-950/90 via-red-900/70 to-orange-500/40",
      glow: "shadow-[0_28px_90px_-36px_rgba(249,115,22,0.45)]",
      accent: "bg-orange-400",
      icon: Activity,
      highlights: ["Core syntax", "OOP depth", "Collections and threads"],
    },
  },
]

export function getCourseTheme(title: string): CourseTheme {
  const lowerTitle = title.trim()
  return themeEntries.find((entry) => entry.match.test(lowerTitle))?.theme ?? defaultTheme
}
