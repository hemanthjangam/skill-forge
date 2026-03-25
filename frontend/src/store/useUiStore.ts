import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (value: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),
    }),
    {
      name: 'skillforge-ui',
    }
  )
)
