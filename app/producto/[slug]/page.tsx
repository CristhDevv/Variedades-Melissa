import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import ProductGallery from '@/components/ProductGallery'
import AddToCartButton from '@/components/AddToCartButton'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'
import { formatPrice } from '@/lib/utils'
import { Product } from '@/lib/types'

export const revalidate = 0

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createSupabaseServer()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!product) return {}

  return {
    title: product.meta_title || `${product.name} | Variedades Melissa`,
    description: product.meta_description || product.description || `Compra ${product.name} al mejor precio en Variedades Melissa.`,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const supabase = createSupabaseServer()

  // Fetch product with join to category
  const { data: productData } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('slug', params.slug)
    .single()

  if (!productData) {
    notFound()
  }

  const product = productData as Product

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 120 }}>
      <Header />

      <main style={{ padding: '0 16px 16px 16px' }}>
        {/* Gallery with back button overlaid */}
        <div style={{ position: 'relative' }}>
          <ProductGallery images={product.images} name={product.name} />
          <Link href="/catalogo" style={{
            position: 'absolute',
            top: 12,
            left: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'white',
            textDecoration: 'none',
            backgroundColor: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(6px)',
            zIndex: 10
          }}>
            <ArrowLeft size={20} />
          </Link>
        </div>

        {/* Product Info */}
        <div style={{ marginTop: 20 }}>
          {product.categories?.name && (
            <span className="badge" style={{ marginBottom: 8, display: 'inline-block' }}>
              {product.categories.name}
            </span>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text)', lineHeight: 1.3 }}>
            {product.name}
          </h1>

          {/* Pricing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>
              {formatPrice(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span style={{ fontSize: 16, textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                {formatPrice(product.compare_price)}
              </span>
            )}
          </div>

          {/* Stock status info */}
          <div style={{ marginBottom: 24, fontSize: 13, color: product.stock > 0 ? 'var(--text-muted)' : 'var(--error)' }}>
            {product.stock > 0 ? (
              <span>Stock disponible: <strong>{product.stock}</strong> unidades</span>
            ) : (
              <strong>Agotado temporalmente</strong>
            )}
          </div>

          {/* Form / AddToCartButton component (handles sizes, colors, quantity and add interaction) */}
          {product.stock > 0 && (
            <AddToCartButton product={product} />
          )}

          {/* Description */}
          {product.description && (
            <div style={{ marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px 0' }}>Descripción</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {product.description}
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
