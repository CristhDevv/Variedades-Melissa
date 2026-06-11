'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Banner } from '@/lib/types'

export default function BannerSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!banners || banners.length === 0) return

    const nextSlide = () => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
    }

    timerRef.current = setInterval(nextSlide, 5000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [banners])

  if (!banners || banners.length === 0) return null

  return (
    <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-200">
      {/* Slides Container */}
      <div 
        className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{
          width: `${banners.length * 100}%`,
          transform: `translateX(-${(current * 100) / banners.length}%)`,
        }}
      >
        {banners.map((banner) => {
          const content = (
            <div className="relative w-full h-full group">
              <Image
                src={banner.image_url}
                alt={banner.title || 'Banner'}
                fill
                sizes="(max-width: 480px) 100vw, 480px"
                className="object-cover transition-transform duration-[10000ms] group-hover:scale-105"
                unoptimized
                priority
              />
              {/* Overlay with Dark Gradient at the bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                {banner.title && (
                  <h2 className="text-[22px] font-bold mb-1 leading-tight text-shadow-sm">
                    {banner.title}
                  </h2>
                )}
                {banner.subtitle && (
                  <p className="text-[14px] opacity-90 text-shadow-sm leading-snug">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </div>
          )

          return (
            <div key={banner.id} className="h-full" style={{ width: `${100 / banners.length}%` }}>
              {banner.link ? (
                <Link href={banner.link} className="block w-full h-full">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          )
        })}
      </div>

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-2 rounded-full border-none transition-all duration-300 cursor-pointer ${
                current === index ? 'w-5 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
