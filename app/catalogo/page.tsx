import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import Header from '@/components/Header'
import ProductCard from '@/components/ProductCard'
import BottomNav from '@/components/BottomNav'
import { Category, Product } from '@/lib/types'

export const revalidate = 0

interface PageProps {
  searchParams: {
    categoria?: string
    buscar?: string
  }
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const supabase = createSupabaseServer()
  const { categoria, buscar } = searchParams

  // Fetch all active categories
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  
  const categories = (categoriesData || []) as Category[]

  // Fetch products
  let categoryId: string | null = null
  if (categoria) {
    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categoria)
      .eq('active', true)
      .single()
    if (catData) {
      categoryId = catData.id
    }
  }

  let productsQuery = supabase.from('products').select('*').eq('active', true)
  
  if (categoria && categoryId) {
    productsQuery = productsQuery.eq('category_id', categoryId)
  }
  if (buscar) {
    productsQuery = productsQuery.ilike('name', `%${buscar}%`)
  }

  const { data: productsData } = await productsQuery
  const products = (productsData || []) as Product[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 80 }}>
      <Header />
      
      {/* Catálogo Section */}
      <main style={{ marginTop: 20, padding: '0 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text)' }}>
          {buscar ? `Resultados para "${buscar}"` : 'Catálogo'}
        </h1>

        {/* Horizontal Category Chips */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 16,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* "Todas" Chip */}
          <Link
            href="/catalogo"
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              backgroundColor: !categoria ? 'var(--brand)' : 'var(--surface)',
              color: !categoria ? 'white' : 'var(--text)',
              border: !categoria ? '1px solid var(--brand)' : '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              transition: 'all 0.2s'
            }}
          >
            Todas
          </Link>

          {/* Individual Category Chips */}
          {categories.map((cat) => {
            const isActive = categoria === cat.slug
            return (
              <Link
                key={cat.id}
                href={`/catalogo?categoria=${cat.slug}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  backgroundColor: isActive ? 'var(--brand)' : 'var(--surface)',
                  color: isActive ? 'white' : 'var(--text)',
                  border: isActive ? '1px solid var(--brand)' : '1px solid var(--border)',
                  boxShadow: 'var(--shadow)',
                  transition: 'all 0.2s'
                }}
              >
                {cat.name}
              </Link>
            )
          })}
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            marginTop: 8
          }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '48px 16px',
            color: 'var(--text-muted)',
            fontSize: 14,
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px dashed var(--border)',
            marginTop: 16
          }}>
            No se encontraron productos en esta categoría.
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
