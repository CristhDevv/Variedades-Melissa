'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Edit, Plus, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { Product } from '@/lib/types'

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data as Product[])
    }
    setLoading(false)
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setProducts(products.map(p => p.id === id ? { ...p, active: !currentStatus } : p))
    } catch {
      alert('Error al actualizar el estado del producto')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Productos
        </h1>
        <Link href="/admin/productos/nuevo" style={{ textDecoration: 'none' }}>
          <button className="btn-brand" style={{
            width: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            fontSize: 14
          }}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 size={32} className="animate-spin" color="var(--brand)" />
        </div>
      ) : products.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md-products-grid">
          {products.map((product) => {
            const thumbnail = product.images?.[0] || '/placeholder-product.png'
            return (
              <div key={product.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {/* Left: Square image 80px */}
                  <div style={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: '#F3F4F6',
                    border: '1px solid var(--border)',
                    flexShrink: 0
                  }}>
                    <Image
                      src={thumbnail}
                      alt={product.name}
                      fill
                      sizes="80px"
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </div>

                  {/* Right: Info in lines */}
                  <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.name}
                    </h3>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>
                      {formatPrice(product.price)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Categoría: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{product.categories?.name || 'Sin categoría'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Stock: <span style={{ fontWeight: 700, color: product.stock === 0 ? 'var(--error)' : 'var(--text)' }}>{product.stock}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom: Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span style={{
                    backgroundColor: product.active ? 'var(--brand-50)' : '#F3F4F6',
                    color: product.active ? 'var(--brand)' : 'var(--text-muted)',
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 600,
                    display: 'inline-block'
                  }}>
                    {product.active ? 'Activo' : 'Inactivo'}
                  </span>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      onClick={() => handleToggleActive(product.id, product.active)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: product.active ? 'var(--brand)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={product.active ? 'Desactivar' : 'Activar'}
                    >
                      {product.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>

                    <Link href={`/admin/productos/${product.id}`} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: 'white'
                    }}>
                      <Edit size={14} style={{ marginRight: 4 }} />
                      Editar
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No se han registrado productos aún.
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .md-products-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1200px) {
          .md-products-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
