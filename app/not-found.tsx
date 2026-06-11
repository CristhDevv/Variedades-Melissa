import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      textAlign: 'center',
      backgroundColor: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        backgroundColor: '#FEF2F2',
        color: 'var(--error)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        boxShadow: 'var(--shadow)'
      }}>
        <AlertTriangle size={40} />
      </div>
      
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px 0' }}>
        Página no encontrada
      </h1>
      
      <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 360, lineHeight: 1.6, margin: '0 0 28px 0' }}>
        Lo sentimos, la ruta a la que estás intentando ingresar no existe o ha sido movida temporalmente.
      </p>

      <Link href="/" className="btn-brand" style={{
        textDecoration: 'none',
        padding: '14px 28px',
        fontWeight: 600,
        borderRadius: 'var(--radius)',
        display: 'inline-block'
      }}>
        Volver al inicio
      </Link>
    </div>
  )
}
