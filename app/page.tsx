import { createSupabaseServer } from '@/lib/supabase-server'
import Header from '@/components/Header'
import BannerSlider from '@/components/BannerSlider'
import CategoryRow from '@/components/CategoryRow'
import ProductCard from '@/components/ProductCard'
import BottomNav from '@/components/BottomNav'
import { Banner, Category, Product } from '@/lib/types'

// Force dynamic rendering to ensure cookies can be accessed correctly on request
export const revalidate = 0

export default async function HomePage() {
  const supabase = createSupabaseServer()

  // Fetch Banners (active=true, order by sort_order ascending)
  const { data: bannersData } = await supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  // Fetch Categories (active=true, order by sort_order ascending)
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  // Fetch Featured Products (active=true, featured=true, limit 8)
  // Fallback: if no featured products exist, show all active products
  const { data: featuredData } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('featured', true)
    .limit(8)

  const productsData = (featuredData && featuredData.length > 0)
    ? featuredData
    : (await supabase.from('products').select('*').eq('active', true).limit(8)).data

  const banners = (bannersData || []) as Banner[]
  const categories = (categoriesData || []) as Category[]
  const products = (productsData || []) as Product[]

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background animate-fade-in">
      <Header />
      
      {/* Banner Slider */}
      {banners.length > 0 && <BannerSlider banners={banners} />}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold mx-4 mb-3 text-gray-900 tracking-tight">
            Categorías
          </h2>
          <CategoryRow categories={categories} />
        </section>
      )}

      {/* Featured Products Section */}
      <section className="mt-8 px-4">
        <h2 className="text-lg font-bold mb-4 text-gray-900 tracking-tight">
          Más Vendidos
        </h2>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 text-gray-500 text-sm bg-white rounded-xl border border-dashed border-gray-200">
            No hay productos destacados disponibles por el momento.
          </div>
        )}
      </section>

      <BottomNav />
    </div>
  )
}
