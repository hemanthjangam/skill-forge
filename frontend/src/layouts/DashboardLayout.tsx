import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"
import { FadeIn } from "../components/shared/FadeIn"
import { useUiStore } from "../store/useUiStore"

export function DashboardLayout() {
  const { isSidebarCollapsed } = useUiStore()

  return (
    <div className="app-shell flex min-h-screen w-full">
      <Sidebar />
      <div className={`flex w-full flex-1 flex-col transition-[padding] duration-300 ${isSidebarCollapsed ? 'md:pl-24' : 'md:pl-64'}`}>
        <TopNav />
        <main className="relative flex-1 overflow-y-auto px-4 pb-8 pt-5 md:px-6 md:pb-10 lg:px-8 lg:pt-7">
          <FadeIn className="page-shell flex w-full flex-1 flex-col">
            <Outlet />
          </FadeIn>
        </main>
      </div>
    </div>
  )
}
