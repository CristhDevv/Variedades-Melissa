'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import ProductCard from '@/components/ProductCard'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function FavoritosPage() {
  const [mounted, setMounted] = useState(false)
  const { favorites } = useFavorites()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 80 }}>
      <Header />
      
      <main style={{ padding: '20px 16px', flexGrow: 1 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
          Mis Favoritos
        </h1>

        {!mounted ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando favoritos...</span>
          </div>
        ) : favorites.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16
          }}>
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 16px',
            textAlign: 'center',
            gap: 16,
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px dashed var(--border)'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'var(--brand-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand)'
            }}>
              <Heart size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px 0' }}>
                Tu lista está vacía
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Guarda los artículos que más te gusten presionando el ícono de corazón.
              </p>
            </div>
            <Link href="/catalogo" className="btn-brand" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '12px 24px' }}>
              Ver catálogo
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
