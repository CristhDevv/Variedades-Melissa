'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Search, Heart } from 'lucide-react'
import { useCartStore } from '@/hooks/useCart'
import Image from 'next/image'

export default function Header() {
  const [mounted, setMounted] = useState(false)
  const count = useCartStore(s => s.items.reduce((a, i) => a + i.quantity, 0))
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && count > 0) {
      setAnimate(true)
      const timer = setTimeout(() => setAnimate(false), 300)
      return () => clearTimeout(timer)
    }
  }, [count, mounted])

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="flex items-center justify-between px-4 py-1">
        <Link href="/" className="no-underline">
          <div className="transition-transform active:scale-95">
            <Image
              src="/logo.png"
              alt="Variedades Melissa"
              width={200}
              height={60}
              priority
              className="object-contain h-14 w-auto"
            />
          </div>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/buscar" className="p-1.5 -m-1.5 transition-colors hover:text-brand text-gray-700">
            <Search size={22} className="stroke-[2px]" />
          </Link>
          <Link href="/favoritos" className="p-1.5 -m-1.5 transition-colors hover:text-brand text-gray-700">
            <Heart size={22} className="stroke-[2px]" />
          </Link>
          <div id="header-cart-icon" className="relative inline-flex">
            <Link href="/carrito" className="p-1.5 -m-1.5 transition-colors hover:text-brand text-gray-700">
              <ShoppingBag size={22} className="stroke-[2px]" />
            </Link>
            {mounted && count > 0 && (
              <span className={`badge absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 ${animate ? 'animate-[bounce_0.3s_ease-out]' : ''}`}>
                {count}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
