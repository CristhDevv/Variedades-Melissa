'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Category } from '@/lib/types'

export default function AdminCategoriasPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setCategories(data as Category[])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
      setDeletingId(null)
      await fetchCategories()
    } catch {
      setErrorMsg('No se puede eliminar la categoría. Probablemente está asociada a productos existentes.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Categorías
        </h1>
        <button
          onClick={() => router.push('/admin/categorias/nuevo')}
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
          Nueva Categoría
        </button>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--error)', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
          {errorMsg}
        </div>
      )}

      {/* Categories List Cards */}
      <div>
        {loading ? (
          <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={28} className="animate-spin" color="var(--brand)" />
          </div>
        ) : categories.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md-cats-grid">
            {categories.map((cat) => {
              const img = cat.image_url || '/placeholder-category.png'
              return (
                <div key={cat.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {/* circular image */}
                    <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', flexShrink: 0 }}>
                      <Image src={img} alt={cat.name} fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                    
                    {/* Name and Slug */}
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{cat.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cat.slug}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Orden: </span>
                      <strong>{cat.sort_order}</strong>
                    </div>
                    
                    <span style={{
                      backgroundColor: cat.active ? 'var(--brand-50)' : '#F3F4F6',
                      color: cat.active ? 'var(--brand)' : 'var(--text-muted)',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      {cat.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Botones editar/eliminar abajo */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <button
                      onClick={() => router.push(`/admin/categorias/${cat.id}/editar`)}
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
                    
                    {deletingId === cat.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleDelete(cat.id)}
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
                        onClick={() => setDeletingId(cat.id)}
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
            No hay categorías registradas.
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .md-cats-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1200px) {
          .md-cats-grid {
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
