'use client'
import { useState, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import ProductCard from '@/components/ProductCard'
import BottomNav from '@/components/BottomNav'
import { Product } from '@/lib/types'

export default function BuscarPage() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    const delayDebounce = setTimeout(async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .ilike('name', `%${query}%`)
      
      if (!error && data) {
        setProducts(data as Product[])
      }
      setLoading(false)
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [query])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 80 }}>
      <Header />

      <main style={{ marginTop: 20, padding: '0 16px' }}>
        {/* Search Input Container */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Buscar vestidos, blusas, conjuntos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              paddingLeft: 40,
              boxShadow: 'var(--shadow)'
            }}
            autoFocus
          />
          <div style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            color: 'var(--text-muted)'
          }}>
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
          </div>
        </div>

        {/* CSS Animations helper insidebuscar/page */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>

        {/* Results Area */}
        {query.trim() === '' ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 16px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <Search size={40} strokeWidth={1.5} color="var(--brand)" />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Busca tus prendas favoritas
            </h2>
            <p style={{ fontSize: 13, margin: 0 }}>
              Escribe el nombre de la prenda que estás buscando.
            </p>
          </div>
        ) : loading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 16px',
            color: 'var(--text-muted)',
            fontSize: 14
          }}>
            Buscando prendas...
          </div>
        ) : products.length > 0 ? (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
              Resultados obtenidos ({products.length})
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16
            }}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 16px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Sin resultados
            </h2>
            <p style={{ fontSize: 13, margin: 0 }}>
              No encontramos prendas que coincidan con &quot;{query}&quot;. Intenta con otro término.
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
