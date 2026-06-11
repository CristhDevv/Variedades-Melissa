'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      })

      if (error || !data.session) {
        setErrorMsg('Credenciales inválidas.')
        setLoading(false)
        return
      }

      // Verify exists in admin_users
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      if (adminError || !adminUser) {
        await supabase.auth.signOut()
        setErrorMsg('Acceso no autorizado.')
        setLoading(false)
        return
      }

      // Redirect to Admin dashboard
      router.push('/admin')
    } catch {
      setErrorMsg('Ocurrió un error al iniciar sesión.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      padding: 16
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ color: 'var(--brand)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}>Variedades</div>
          <div style={{ color: 'var(--brand)', fontWeight: 400, fontSize: 16, letterSpacing: '2px', marginTop: 4 }}>MELISSA</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 12 }}>INICIAR SESIÓN ADMIN</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="admin@variedadesmelissa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            disabled={loading}
            style={{
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 8
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Ingresar'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
