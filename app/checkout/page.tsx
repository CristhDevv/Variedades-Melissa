'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Ticket, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import { Coupon } from '@/lib/types'

const DEPARTMENTS = [
  'Bogotá D.C.', 'Antioquia', 'Valle del Cauca', 'Atlántico', 'Cundinamarca',
  'Santander', 'Bolívar', 'Cesar', 'Córdoba', 'Huila', 'Magdalena', 'Meta',
  'Nariño', 'Norte de Santander', 'Quindío', 'Risaralda', 'Sucre', 'Tolima',
  'Boyacá', 'Caldas', 'Cauca', 'Chocó', 'La Guajira', 'Casanare', 'Arauca',
  'Putumayo', 'San Andrés y Providencia', 'Amazonas', 'Guainía', 'Guaviare',
  'Vaupés', 'Vichada'
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCartStore()

  // Form Fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')

  // Coupon State
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  // Layout States
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const subtotal = total()
  const shippingCost = shippingMethod === 'standard' ? 9900 : 18900

  // Discount Calculation
  let discountAmount = 0
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = Math.round(subtotal * (appliedCoupon.discount_value / 100))
    } else {
      discountAmount = appliedCoupon.discount_value
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount + shippingCost)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponError('')
    setApplyingCoupon(true)

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('active', true)
        .single()

      if (error || !data) {
        setCouponError('Cupón no válido o inactivo.')
        setAppliedCoupon(null)
      } else {
        const coupon = data as Coupon

        // Validations
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          setCouponError('El cupón ya ha expirado.')
          setAppliedCoupon(null)
        } else if (subtotal < coupon.min_order) {
          setCouponError(`Compra mínima requerida: ${formatPrice(coupon.min_order)}`)
          setAppliedCoupon(null)
        } else if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
          setCouponError('El cupón ha agotado sus usos.')
          setAppliedCoupon(null)
        } else {
          setAppliedCoupon(coupon)
          setCouponError('')
        }
      }
    } catch {
      setCouponError('Error al validar el cupón.')
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    // Basic Validation
    if (!name.trim() || !phone.trim() || !department || !city.trim() || !address.trim()) {
      setFormError('Por favor completa todos los campos requeridos (*).')
      return
    }

    if (items.length === 0) {
      setFormError('Tu carrito está vacío.')
      return
    }

    setSubmitting(true)

    try {
      // 1. Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim() || null,
          department,
          city: city.trim(),
          address: address.trim(),
          notes: notes.trim() || null,
          shipping_method: shippingMethod,
          shipping_cost: shippingCost,
          subtotal,
          total: finalTotal,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          discount: discountAmount,
          status: 'pending'
        })
        .select('id, order_number')
        .single()

      if (orderError || !orderData) {
        throw new Error('Error al crear el pedido.')
      }

      // 2. Insert Order Items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images?.[0] || null,
        size: item.size || null,
        color: item.color || null,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        throw new Error('Error al registrar los productos del pedido.')
      }

      // 3. Increment coupon count if applied
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: appliedCoupon.used_count + 1 })
          .eq('id', appliedCoupon.id)
      }

      // Clear Cart & Redirect
      clear()
      router.push(`/pedido-confirmado/${orderData.order_number}`)

    } catch (err: any) {
      setFormError(err.message || 'Ocurrió un error inesperado al procesar el pedido.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'white',
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}>
        <Link href="/carrito" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          textDecoration: 'none'
        }}>
          <ArrowLeft size={20} />
        </Link>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Finalizar Compra</span>
      </div>

      <main style={{ padding: '16px' }}>
        {/* Collapsible summary drawer */}
        <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
          <button
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: 'none',
              background: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--text)'
            }}
          >
            <span>Resumen del Pedido ({items.length} {items.length === 1 ? 'prenda' : 'prendas'})</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand)' }}>
              <span>{formatPrice(finalTotal)}</span>
              {isSummaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {isSummaryExpanded && (
            <div style={{
              padding: '0 16px 16px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}-${item.color}`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  gap: 12,
                  marginTop: 12
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                      Cant: {item.quantity} {item.size ? `| Talla: ${item.size}` : ''} {item.color ? `| Color: ${item.color}` : ''}
                    </p>
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}

              <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Descuento ({appliedCoupon?.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Costo de Envío</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, borderTop: '1px dashed var(--border)', paddingTop: 8, marginTop: 4 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--brand)' }}>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '4px 0 0 0' }}>
            Información de Entrega
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Melissa Rodríguez"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Celular *
            </label>
            <input
              type="tel"
              required
              placeholder="Ej. 312 345 6789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Email (Opcional)
            </label>
            <input
              type="email"
              placeholder="Ej. correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Departamento *
            </label>
            <select
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Selecciona tu departamento</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Ciudad *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Medellín"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Dirección de Entrega *
            </label>
            <input
              type="text"
              required
              placeholder="Calle 10 # 5-20 Apto 301"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Indicaciones / Notas (Opcional)
            </label>
            <textarea
              placeholder="Ej. Portería principal, color de portón, etc."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginTop: 8, marginBottom: 4 }}>
            Método de Envío
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Standard Shipping */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 14,
              borderRadius: 8,
              border: shippingMethod === 'standard' ? '2px solid var(--brand)' : '1px solid var(--border)',
              backgroundColor: shippingMethod === 'standard' ? 'var(--brand-50)' : 'white',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === 'standard'}
                  onChange={() => setShippingMethod('standard')}
                  style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Envío Estándar</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Llega de 3 a 5 días hábiles</div>
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{formatPrice(9900)}</span>
            </label>

            {/* Express Shipping */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 14,
              borderRadius: 8,
              border: shippingMethod === 'express' ? '2px solid var(--brand)' : '1px solid var(--border)',
              backgroundColor: shippingMethod === 'express' ? 'var(--brand-50)' : 'white',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === 'express'}
                  onChange={() => setShippingMethod('express')}
                  style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Envío Express</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Llega de 1 a 2 días hábiles</div>
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{formatPrice(18900)}</span>
            </label>
          </div>

          {/* Coupon Code Input */}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginTop: 8, marginBottom: 4 }}>
            Cupón de Descuento
          </h2>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input
                type="text"
                placeholder="Ingresa tu cupón"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{ paddingLeft: 40 }}
                disabled={!!appliedCoupon}
              />
              <Ticket size={18} style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
            </div>
            {appliedCoupon ? (
              <button
                type="button"
                onClick={() => {
                  setAppliedCoupon(null)
                  setCouponCode('')
                }}
                className="btn-brand"
                style={{ width: 'auto', backgroundColor: 'var(--error)', padding: '0 16px', fontSize: 13 }}
              >
                Quitar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="btn-brand"
                style={{ width: 'auto', padding: '0 20px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                disabled={applyingCoupon || !couponCode.trim()}
              >
                {applyingCoupon ? <Loader2 size={16} className="animate-spin" /> : 'Aplicar'}
              </button>
            )}
          </div>
          {couponError && (
            <p style={{ color: 'var(--error)', fontSize: 12, margin: '-8px 0 0 0' }}>{couponError}</p>
          )}
          {appliedCoupon && (
            <p style={{ color: 'var(--success)', fontSize: 12, margin: '-8px 0 0 0', fontWeight: 600 }}>
              ¡Cupón aplicado con éxito! Descuento: {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : formatPrice(appliedCoupon.discount_value)}
            </p>
          )}

          {/* Form Error Message */}
          {formError && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              padding: 12,
              borderRadius: 8,
              color: 'var(--error)',
              fontSize: 13,
              fontWeight: 500,
              marginTop: 10
            }}>
              {formError}
            </div>
          )}

          {/* Final Submit Button */}
          <button
            type="submit"
            className="btn-brand"
            disabled={submitting}
            style={{
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 52
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Procesando pedido...
              </>
            ) : (
              `Confirmar pedido - ${formatPrice(finalTotal)}`
            )}
          </button>
        </form>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
