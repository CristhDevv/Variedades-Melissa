'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ClipboardList, PhoneCall, Mail, Info, Heart, ArrowRight, Loader2, LogOut } from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'

export default function CuentaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  
  // Login form state
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Contact details
  const whatsapp = '+57 311 728 4178'
  const email = 'variedadesmelissa@gmail.com'
  const whatsappUrl = 'https://wa.me/573117284178'

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const isAdminUser = await checkAdminStatus(session.user.id)
        if (isAdminUser) {
          router.push('/admin')
          return
        }
        setUser(session.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', userId)
        .single()
      return !!data
    } catch {
      return false
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoginLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput.trim()
      })

      if (error || !data.session) {
        setErrorMsg('Credenciales inválidas.')
        setLoginLoading(false)
        return
      }

      const isAdminUser = await checkAdminStatus(data.session.user.id)
      if (isAdminUser) {
        router.push('/admin')
      } else {
        setUser(data.session.user)
      }
    } catch {
      setErrorMsg('Ocurrió un error al iniciar sesión.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 80 }}>
        <Header />
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
        </main>
        <BottomNav />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 80 }}>
      <Header />

      <main style={{ padding: '20px 16px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {!user ? (
          /* Login View */
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32, margin: '20px auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ color: 'var(--brand)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}>Variedades</div>
              <div style={{ color: 'var(--brand)', fontWeight: 400, fontSize: 16, letterSpacing: '2px', marginTop: 4 }}>MELISSA</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 12 }}>INICIAR SESIÓN CLIENTE</div>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    outline: 'none',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    outline: 'none',
                    fontSize: 14
                  }}
                />
              </div>

              {errorMsg && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  padding: 12,
                  borderRadius: 8,
                  color: 'var(--error)',
                  fontSize: 13,
                  fontWeight: 500
                }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="btn-brand"
                disabled={loginLoading}
                style={{
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 8,
                  backgroundColor: 'var(--brand)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {loginLoading ? <Loader2 size={18} className="animate-spin" /> : 'Ingresar'}
              </button>
            </form>
          </div>
        ) : (
          /* Logged In View */
          <>
            {/* Profile Card Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 16px',
              background: 'linear-gradient(135deg, var(--brand) 0%, #D46A8A 100%)',
              borderRadius: 'var(--radius)',
              color: 'white',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={28} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>Mi Cuenta</h2>
                  <p style={{ fontSize: 12, opacity: 0.9, margin: 0 }}>{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Quick actions list */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Link href="/pedidos" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                textDecoration: 'none',
                color: 'var(--text)',
                borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ClipboardList size={18} color="var(--brand)" />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Mis Pedidos / Rastrear Compra</span>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </Link>

              <Link href="/favoritos" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                textDecoration: 'none',
                color: 'var(--text)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Heart size={18} color="var(--brand)" />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Mis Favoritos</span>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </Link>
            </div>

            {/* Contact info card */}
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                Contacto y Soporte
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontSize: 13
                }}>
                  <PhoneCall size={18} style={{ color: '#25D366' }} />
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>WhatsApp</span>
                    <span style={{ fontWeight: 500 }}>{whatsapp}</span>
                  </div>
                </a>

                <a href={`mailto:${email}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontSize: 13
                }}>
                  <Mail size={18} style={{ color: 'var(--brand)' }} />
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>Correo Electrónico</span>
                    <span style={{ fontWeight: 500 }}>{email}</span>
                  </div>
                </a>
              </div>
            </div>

            {/* About us section */}
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <Info size={18} color="var(--brand)" />
                Sobre Nosotros
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Variedades Melissa es tu tienda de moda femenina con las prendas más elegantes y modernas. Envíos a todo Colombia.
              </p>
            </div>
            
            {/* Cerrar sesión secondary button */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 8
              }}
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </>
        )}
      </main>

      <BottomNav />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
