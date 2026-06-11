import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/lib/types'

type CartStore = {
  items: CartItem[]
  add: (product: Product, quantity: number, size: string | null, color: string | null) => void
  remove: (productId: string, size: string | null, color: string | null) => void
  update: (productId: string, size: string | null, color: string | null, quantity: number) => void
  clear: () => void
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity, size, color) => {
        const items = get().items
        const key = `${product.id}-${size}-${color}`
        const existing = items.find(i => `${i.product.id}-${i.size}-${i.color}` === key)
        if (existing) {
          set({ items: items.map(i => `${i.product.id}-${i.size}-${i.color}` === key ? { ...i, quantity: i.quantity + quantity } : i) })
        } else {
          set({ items: [...items, { product, quantity, size, color }] })
        }
      },
      remove: (productId, size, color) => {
        set({ items: get().items.filter(i => !(i.product.id === productId && i.size === size && i.color === color)) })
      },
      update: (productId, size, color, quantity) => {
        set({ items: get().items.map(i => i.product.id === productId && i.size === size && i.color === color ? { ...i, quantity } : i) })
      },
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((a, i) => a + i.product.price * i.quantity, 0),
    }),
    { name: 'melissa-cart' }
  )
)
