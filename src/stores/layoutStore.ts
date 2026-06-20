import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type LayoutMode = 'compact' | 'tablet'

interface LayoutStore {
  mode: LayoutMode
  setMode: (mode: LayoutMode) => void
  toggle: () => void
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      mode: 'compact',
      setMode: (mode) => set({ mode }),
      toggle: () => set({ mode: get().mode === 'compact' ? 'tablet' : 'compact' }),
    }),
    { name: 'turnflow-layout' }
  )
)
