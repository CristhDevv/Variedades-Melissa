'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { Product } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { useFavorites } from '@/hooks/useFavorites'

export default function ProductCard({ product }: { product: Product }) {
  const [mounted, setMounted] = useState(false)
  const { toggle, isFavorite } = useFavorites()

  useEffect(() => {
    setMounted(true)
  }, [])

  const favorited = mounted ? isFavorite(product.id) : false
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  const mainImage = product.images?.[0] || '/placeholder-product.png'

  return (
    <div className="card overflow-hidden relative flex flex-col group transition-all duration-300 hover:-translate-y-1">
      <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden">
        <Link href={`/producto/${product.slug}`}>
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
        </Link>
        
        {/* Discount Badge */}
        {discount > 0 && (
          <span className="badge-sale absolute top-2 left-2 z-10 shadow-sm">
            -{discount}%
          </span>
        )}

        {/* Low Stock Badge */}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="badge absolute left-2 z-10 shadow-sm bg-warning text-white" style={{ top: discount > 0 ? 34 : 8 }}>
            Últimas {product.stock}
          </span>
        )}
        {product.stock === 0 && (
          <span className="badge absolute top-2 left-2 z-10 shadow-sm bg-gray-400 text-white">
            Agotado
          </span>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            toggle(product)
          }}
          className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm border-none rounded-full w-8 h-8 flex items-center justify-center shadow-sm cursor-pointer transition-transform active:scale-90 hover:bg-white"
        >
          <Heart 
            size={18} 
            fill={favorited ? 'var(--brand)' : 'none'} 
            color={favorited ? 'var(--brand)' : 'var(--text-muted)'} 
            className="transition-colors"
          />
        </button>
      </div>

      <div className="p-3 flex flex-col grow gap-1.5 bg-white">
        <Link href={`/producto/${product.slug}`} className="no-underline text-gray-800 hover:text-brand transition-colors">
          <h3 className="text-[13px] leading-[1.3] font-medium m-0 overflow-hidden text-ellipsis line-clamp-2 min-h-[34px]">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
          <span className="font-bold text-brand text-[15px]">
            {formatPrice(product.price)}
          </span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="line-through text-gray-400 text-[12px] font-medium">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
