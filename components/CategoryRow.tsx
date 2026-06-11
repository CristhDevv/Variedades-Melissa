import Link from 'next/link'
import Image from 'next/image'
import { Category } from '@/lib/types'

export default function CategoryRow({ categories }: { categories: Category[] }) {
  if (!categories || categories.length === 0) return null

  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-3 no-scrollbar scroll-smooth snap-x">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/catalogo?categoria=${category.slug}`}
          className="flex flex-col items-center no-underline shrink-0 gap-1.5 w-[72px] group snap-start"
        >
          {/* Circular Image Container */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-brand/30 transition-all duration-300 shadow-sm group-hover:shadow-md group-active:scale-95">
            <Image
              src={category.image_url || '/placeholder-category.png'}
              alt={category.name}
              fill
              sizes="64px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />
          </div>
          {/* Category Name */}
          <span className="text-[11px] font-medium text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full group-hover:text-brand transition-colors">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  )
}
