import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/lib/types'

type FavoritesStore = {
  favorites: Product[]
  toggle: (product: Product) => void
  isFavorite: (id: string) => boolean
}

export const useFavorites = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggle: (product: Product) => {
        const current = get().favorites
        const exists = current.some((p) => p.id === product.id)
        if (exists) {
          set({ favorites: current.filter((p) => p.id !== product.id) })
        } else {
          set({ favorites: [...current, product] })
        }
      },
      isFavorite: (id: string) => {
        return get().favorites.some((p) => p.id === id)
      }
    }),
    {
      name: 'melissa-favorites'
    }
  )
)
