'use client'
import { useState } from 'react'
import Image from 'next/image'
import { X, ZoomIn } from 'lucide-react'

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const productImages = images && images.length > 0 ? images : ['/placeholder-product.png']
  const activeImage = productImages[activeIndex]

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Main Image — tap to open lightbox */}
        <div
          onClick={() => setLightboxOpen(true)}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3/4',
            backgroundColor: '#F3F4F6',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            cursor: 'zoom-in'
          }}
        >
          <Image
            src={activeImage}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
            unoptimized
            priority
          />
          {/* Zoom hint icon */}
          <div style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            backgroundColor: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(6px)',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            pointerEvents: 'none'
          }}>
            <ZoomIn size={16} />
          </div>
        </div>

        {/* Thumbnails */}
        {productImages.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {productImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                style={{
                  position: 'relative',
                  width: 60,
                  height: 60,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: activeIndex === idx ? '2px solid var(--brand)' : '1px solid var(--border)',
                  backgroundColor: '#F3F4F6',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0
                }}
              >
                <Image
                  src={img}
                  alt={`${name} thumbnail ${idx}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              zIndex: 10000
            }}
          >
            <X size={22} />
          </button>

          {/* Image — native pinch-to-zoom on mobile */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 480,
              aspectRatio: '3/4',
              borderRadius: 12,
              overflow: 'hidden'
            }}
          >
            <Image
              src={activeImage}
              alt={name}
              fill
              style={{ objectFit: 'contain' }}
              unoptimized
              priority
            />
          </div>

          {/* Thumbnail nav inside lightbox */}
          {productImages.length > 1 && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: 24,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                padding: '0 16px'
              }}
            >
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative',
                    border: activeIndex === idx ? '2px solid white' : '2px solid rgba(255,255,255,0.3)',
                    padding: 0,
                    cursor: 'pointer',
                    backgroundColor: '#333',
                    flexShrink: 0
                  }}
                >
                  <Image src={img} alt={`${idx}`} fill style={{ objectFit: 'cover' }} unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
