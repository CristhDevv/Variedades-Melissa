'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Minus, Trash2, ArrowRight, ShoppingCart } from 'lucide-react'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { useCartStore } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'

export default function CarritoPage() {
  const { items, update, remove, total } = useCartStore()

  const subtotal = total()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 160 }}>
      <Header />

      <main style={{ flexGrow: 1, padding: '16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, color: 'var(--text)' }}>
          Mi Carrito
        </h1>

        {items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 16px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            marginTop: 40
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'var(--brand-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand)'
            }}>
              <ShoppingCart size={40} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                Tu carrito está vacío
              </h2>
              <p style={{ fontSize: 14, margin: 0 }}>
                Agrega prendas hermosas de nuestro catálogo para comenzar.
              </p>
            </div>
            <Link href="/catalogo" style={{ textDecoration: 'none' }}>
              <button className="btn-brand" style={{ width: 'auto', marginTop: 8 }}>
                Ver catálogo
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            {items.map((item) => {
              const itemKey = `${item.product.id}-${item.size}-${item.color}`
              const mainImage = item.product.images?.[0] || '/placeholder-product.png'
              
              return (
                <div key={itemKey} className="card" style={{
                  display: 'flex',
                  padding: 12,
                  gap: 12,
                  position: 'relative'
                }}>
                  {/* Product Thumbnail */}
                  <div style={{
                    position: 'relative',
                    width: 72,
                    height: 96,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: '#F3F4F6',
                    flexShrink: 0
                  }}>
                    <Image
                      src={mainImage}
                      alt={item.product.name}
                      fill
                      sizes="72px"
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </div>

                  {/* Product Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 4, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text)',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      paddingRight: 24
                    }}>
                      {item.product.name}
                    </h3>
                    
                    {/* Size and Color badges */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                      {item.size && (
                        <span style={{
                          fontSize: 10,
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: 500
                        }}>
                          Talla: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span style={{
                          fontSize: 10,
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: 500
                        }}>
                          Color: {item.color}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)' }}>
                        {formatPrice(item.product.price)}
                      </span>

                      {/* Quantity Controls */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        overflow: 'hidden',
                        backgroundColor: 'white'
                      }}>
                        <button
                          onClick={() => update(item.product.id, item.size, item.color, Math.max(1, item.quantity - 1))}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ width: 24, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => update(item.product.id, item.size, item.color, Math.min(item.product.stock, item.quantity + 1))}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: '6px 8px',
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
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => remove(item.product.id, item.size, item.color)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Eliminar item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Sticky Bottom Summary & Button */}
      {items.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          background: 'white',
          borderTop: '1px solid var(--border)',
          padding: '16px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
          zIndex: 45,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Subtotal</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{formatPrice(subtotal)}</span>
          </div>

          <Link href="/checkout" style={{ textDecoration: 'none' }}>
            <button className="btn-brand" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              Ir al checkout
              <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
