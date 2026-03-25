import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"
import { FadeIn } from "../components/shared/FadeIn"
import { useUiStore } from "../store/useUiStore"

export function DashboardLayout() {
  const { isSidebarCollapsed } = useUiStore()

  return (
    <div className="app-shell flex min-h-screen w-full">
      <div className="mesh-overlay pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute left-[-8rem] top-28 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />
      <div className="pointer-events-none absolute right-[-6rem] top-10 h-80 w-80 rounded-full bg-blue-400/18 blur-3xl dark:bg-indigo-500/10" />
      <Sidebar />
      <div className={`flex w-full flex-1 flex-col transition-[padding] duration-300 ${isSidebarCollapsed ? 'md:pl-24' : 'md:pl-64'}`}>
        <TopNav />
        <main className="relative flex-1 overflow-y-auto px-4 pb-8 pt-4 md:px-6 md:pb-10 lg:px-8 lg:pt-6">
          <FadeIn className="page-shell flex w-full flex-1 flex-col">
            <Outlet />
          </FadeIn>
        </main>
      </div>
    </div>
  )
}
