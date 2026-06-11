'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Banner } from '@/lib/types'

export default function AdminBannersPage() {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setBanners(data as Banner[])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDeletingId(null)
      await fetchBanners()
    } catch {
      setErrorMsg('Error al eliminar el banner.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Banners Promocionales
        </h1>
        <button
          onClick={() => router.push('/admin/banners/nuevo')}
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
          Nuevo Banner
        </button>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--error)', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
          {errorMsg}
        </div>
      )}

      {/* Banners List */}
      <div>
        {loading ? (
          <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={28} className="animate-spin" color="var(--brand)" />
          </div>
        ) : banners.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md-banners-grid">
            {banners.map((b) => (
              <div key={b.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Visual Preview 16:9 */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: '#E5E7EB',
                  border: '1px solid var(--border)',
                  flexShrink: 0
                }}>
                  <Image src={b.image_url} alt={b.title || 'Banner'} fill style={{ objectFit: 'cover' }} unoptimized />
                </div>

                {/* Banner Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  {(b.title || b.subtitle) && (
                    <div>
                      {b.title && <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{b.title}</h3>}
                      {b.subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{b.subtitle}</p>}
                    </div>
                  )}

                  {b.link && (
                    <div style={{ fontSize: 12, color: 'var(--brand)', wordBreak: 'break-all' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Link:</strong> {b.link}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: 4 }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Orden: </span>
                      <strong>{b.sort_order}</strong>
                    </div>
                    
                    <span style={{
                      backgroundColor: b.active ? 'var(--brand-50)' : '#F3F4F6',
                      color: b.active ? 'var(--brand)' : 'var(--text-muted)',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      {b.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <button
                    onClick={() => router.push(`/admin/banners/${b.id}/editar`)}
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

                  {deletingId === b.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleDelete(b.id)}
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
                      onClick={() => setDeletingId(b.id)}
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
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No se han registrado banners promocionales.
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .md-banners-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1200px) {
          .md-banners-grid {
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
