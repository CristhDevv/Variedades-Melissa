'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, Heart, ShoppingBag, User } from 'lucide-react'

const tabs = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/catalogo', icon: Grid3X3, label: 'Catálogo' },
  { href: '/favoritos', icon: Heart, label: 'Favoritos' },
  { href: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { href: '/cuenta', icon: User, label: 'Cuenta' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] glass-nav flex z-50 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = path === href || (href !== '/' && path.startsWith(href))
        return (
          <Link 
            key={href} 
            href={href} 
            className={`flex-1 flex flex-col items-center py-2.5 no-underline gap-1 transition-all duration-200 active:scale-95 ${
              active ? 'text-brand font-semibold scale-105' : 'text-gray-400 font-medium hover:text-gray-600'
            }`}
          >
            <div className={`relative flex items-center justify-center transition-colors duration-200 ${
              active ? 'bg-brand/10 p-1.5 rounded-full text-brand' : 'p-1.5 text-gray-500'
            }`}>
              <Icon size={22} className={active ? "stroke-[2.5px]" : "stroke-[2px]"} />
            </div>
            <span className="text-[10px] leading-tight">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
