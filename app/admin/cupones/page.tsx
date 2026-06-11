'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Coupon } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

export default function AdminCuponesPage() {
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('code', { ascending: true })

    if (!error && data) {
      setCoupons(data as Coupon[])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDeletingId(null)
      await fetchCoupons()
    } catch {
      setErrorMsg('No se pudo eliminar el cupón.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Cupones de Descuento
        </h1>
        <button
          onClick={() => router.push('/admin/cupones/nuevo')}
          className="btn-brand"
          style={{
            width: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            fontSize: 14,
            borderRadius: 'var(--radius)'
          }}
        >
          <Plus size={16} />
          Nuevo Cupón
        </button>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--error)', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
          {errorMsg}
        </div>
      )}

      {/* Coupons List Cards */}
      <div>
        {loading ? (
          <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={28} className="animate-spin" color="var(--brand)" />
          </div>
        ) : coupons.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md-coupons-grid">
            {coupons.map((c) => {
              const discountLabel = c.discount_type === 'percentage' ? `${c.discount_value}%` : formatPrice(c.discount_value)
              const usagePercentage = c.max_uses > 0 ? Math.round((c.used_count / c.max_uses) * 100) : 0
              const expiryDate = c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-CO') : 'Nunca'
              const isExpired = c.expires_at && new Date(c.expires_at) < new Date()

              return (
                <div key={c.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Código destacado */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.5px' }}>
                      {c.code}
                    </span>
                    <span style={{
                      backgroundColor: (c.active && !isExpired) ? 'var(--brand-50)' : '#F3F4F6',
                      color: (c.active && !isExpired) ? 'var(--brand)' : 'var(--text-muted)',
                      borderRadius: 999,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      {isExpired ? 'Vencido' : c.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Descuento */}
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    <strong style={{ color: 'var(--text-muted)' }}>Descuento:</strong> {discountLabel}
                  </div>

                  {/* Usos */}
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    <strong style={{ color: 'var(--text-muted)' }}>Usos:</strong> {c.used_count} / {c.max_uses} 
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({usagePercentage}%)</span>
                  </div>

                  {/* Fecha de vencimiento */}
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    <strong style={{ color: 'var(--text-muted)' }}>Vence:</strong> {expiryDate}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                    <button
                      onClick={() => router.push(`/admin/cupones/${c.id}/editar`)}
                      style={{
                        border: '1px solid var(--border)',
                        background: 'white',
                        color: 'var(--text)',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={12} />
                      Editar
                    </button>

                    {deletingId === c.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleDelete(c.id)}
                          style={{ backgroundColor: 'var(--error)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                        >
                          Sí, eliminar
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          style={{ backgroundColor: 'white', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(c.id)}
                        style={{
                          border: '1px solid var(--border)',
                          background: 'white',
                          color: 'var(--error)',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={12} />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No hay cupones registrados.
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .md-coupons-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1200px) {
          .md-coupons-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
