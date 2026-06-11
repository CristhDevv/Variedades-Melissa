'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Tag, FolderKanban, ShoppingBag, Image as ImageIcon, Ticket, LogOut, Menu, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', icon: Tag },
  { href: '/admin/categorias', label: 'Categorías', icon: FolderKanban },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/cupones', label: 'Cupones', icon: Ticket },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  const [loading, setLoading] = useState(!isLoginPage)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }

    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/admin/login')
        return
      }

      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error || !adminUser) {
        await supabase.auth.signOut()
        router.replace('/admin/login')
        return
      }

      setLoading(false)
    }

    checkAdmin()
  }, [isLoginPage, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="var(--brand)" />
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Cargando panel administrador...</span>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    )
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, backgroundColor: 'white', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, paddingLeft: 8 }}>
        <div style={{ color: 'var(--brand)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', lineHeight: 1 }}>Variedades</div>
        <div style={{ color: 'var(--brand)', fontWeight: 400, fontSize: 14, letterSpacing: '2px', lineHeight: 1, marginTop: 4 }}>MELISSA</div>
        <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, marginTop: 4 }}>PANEL ADMIN</div>
      </div>

      {/* Menu Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                backgroundColor: isActive ? 'var(--brand-50)' : 'transparent',
                color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 8,
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--error)',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          marginTop: 'auto'
        }}
      >
        <LogOut size={18} />
        Cerrar Sesión
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', maxWidth: '100vw', margin: 0, backgroundColor: 'var(--bg)', overflowX: 'hidden' }}>
      {/* Desktop Sidebar (Left side, fixed width 260px) */}
      <aside style={{ width: 260, flexShrink: 0, display: 'none', position: 'sticky', top: 0, height: '100vh' }} className="md:block">
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Topbar (visible in mobile, contains menu hamburger) */}
        <header style={{
          height: 60,
          backgroundColor: 'white',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6
            }}
            className="md:hidden"
          >
            <Menu size={24} />
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>ADMINISTRADOR</span>
          </div>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 99,
              animation: 'fadeIn 0.2s'
            }}
          >
            {/* Drawer Container */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 260,
                height: '100%',
                backgroundColor: 'white',
                position: 'absolute',
                left: 0,
                top: 0,
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                <button
                  onClick={() => setMobileOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={24} />
                </button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main style={{ padding: '16px 20px', flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .md\\:block { display: block !important; }
          .md\\:hidden { display: none !important; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}
