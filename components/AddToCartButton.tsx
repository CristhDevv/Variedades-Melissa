'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, X } from 'lucide-react'
import { Product } from '@/lib/types'
import { useCartStore } from '@/hooks/useCart'

export default function AddToCartButton({ product }: { product: Product }) {
  const addToCart = useCartStore((s) => s.add)
  const router = useRouter()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<'buy' | 'add' | null>(null)

  const [size, setSize] = useState<string | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  )
  const [color, setColor] = useState<{ name: string; hex: string } | null>(
    product.colors && product.colors.length > 0 ? product.colors[0] : null
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const hasVariants = (product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0)

  const triggerFlyAnimation = (button: HTMLElement) => {
    const buttonRect = button.getBoundingClientRect()
    const cart = document.getElementById('header-cart-icon')

    if (!cart) {
      addToCart(product, quantity, size, color ? color.name : null)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
      return
    }

    const cartRect = cart.getBoundingClientRect()
    const productImage = product.images?.[0] || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200'

    const flyer = document.createElement('div')
    flyer.style.position = 'fixed'
    flyer.style.left = `${buttonRect.left + buttonRect.width / 2 - 20}px`
    flyer.style.top = `${buttonRect.top + buttonRect.height / 2 - 20}px`
    flyer.style.width = '40px'
    flyer.style.height = '40px'
    flyer.style.borderRadius = '50%'
    flyer.style.backgroundImage = `url(${productImage})`
    flyer.style.backgroundSize = 'cover'
    flyer.style.backgroundPosition = 'center'
    flyer.style.zIndex = '9999'
    flyer.style.pointerEvents = 'none'
    flyer.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)'
    flyer.style.transition = 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)'

    document.body.appendChild(flyer)

    // Force reflow
    void flyer.offsetWidth

    // Animate
    flyer.style.left = `${cartRect.left + cartRect.width / 2 - 20}px`
    flyer.style.top = `${cartRect.top + cartRect.height / 2 - 20}px`
    flyer.style.transform = 'scale(0.2)'
    flyer.style.opacity = '0.5'

    setTimeout(() => {
      addToCart(product, quantity, size, color ? color.name : null)
      flyer.remove()
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }, 800)
  }

  const handleBuyClick = () => {
    if (hasVariants) {
      setActiveAction('buy')
      setIsDrawerOpen(true)
    } else {
      addToCart(product, quantity, null, null)
      router.push('/checkout')
    }
  }

  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hasVariants) {
      setActiveAction('add')
      setIsDrawerOpen(true)
    } else {
      triggerFlyAnimation(e.currentTarget)
    }
  }

  const handleConfirmAction = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsDrawerOpen(false)
    if (activeAction === 'buy') {
      addToCart(product, quantity, size, color ? color.name : null)
      router.push('/checkout')
    } else {
      triggerFlyAnimation(e.currentTarget)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Main flow always visible view */}
      <button
        onClick={handleBuyClick}
        className="btn-brand"
        style={{
          width: '100%',
          backgroundColor: 'var(--brand)',
          color: 'white',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Comprar ahora
      </button>

      <button
        onClick={handleAddClick}
        style={{
          width: '80%',
          alignSelf: 'center',
          backgroundColor: 'transparent',
          color: 'var(--brand)',
          border: '2px solid var(--brand)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 20px',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        {added ? '¡Agregado! ✓' : 'Agregar al carrito'}
      </button>

      {/* Drawer backdrop */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      {/* Bottom Drawer */}
      {isDrawerOpen && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'white',
          borderRadius: '16px 16px 0 0',
          padding: '20px',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200'}
                alt={product.name}
                style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{product.name}</h4>
                <span style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 700 }}>
                  ${product.price.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                Selecciona Talla
              </h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: size === s ? '2px solid var(--brand)' : '1px solid var(--border)',
                      backgroundColor: size === s ? 'var(--brand-50)' : 'white',
                      color: size === s ? 'var(--brand)' : 'var(--text)',
                      fontWeight: size === s ? 600 : 400,
                      cursor: 'pointer',
                      fontSize: 12,
                      transition: 'all 0.15s'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                Selecciona Color: <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{color?.name}</span>
              </h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: c.hex,
                      border: color?.name === c.name ? '3px solid var(--brand)' : '1px solid rgba(0,0,0,0.15)',
                      boxShadow: color?.name === c.name ? '0 0 0 2px white' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
              Cantidad
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border)',
                borderRadius: 6,
                overflow: 'hidden',
                backgroundColor: 'white'
              }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                ({product.stock} disponibles)
              </span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmAction}
            className="btn-brand"
            style={{
              width: '100%',
              backgroundColor: 'var(--brand)',
              color: 'white',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              marginTop: 8
            }}
          >
            {activeAction === 'buy' ? 'Confirmar Compra' : 'Confirmar Agregar'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); }
          to { transform: translate(-50%, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
