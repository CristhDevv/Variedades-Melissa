'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { Order } from '@/lib/types'

export default function DetallePedidoPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single()

      if (!error && data) {
        setOrder(data as Order)
        setStatus(data.status)
      } else {
        setErrorMsg('No se pudo cargar la información del pedido.')
      }
      setLoading(false)
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const handleSaveStatus = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    setSaving(true)

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

      if (error) {
        throw error
      }

      setSuccessMsg('Estado del pedido actualizado correctamente.')
      if (order) {
        setOrder({ ...order, status })
      }
    } catch {
      setErrorMsg('Error al guardar el estado del pedido.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" color="var(--brand)" />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando pedido...</span>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    )
  }

  if (errorMsg && !order) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Link href="/admin/pedidos" style={{
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
          <span style={{ fontWeight: 600, fontSize: 16 }}>Detalle de Pedido</span>
        </div>
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: 16, borderRadius: 8, color: 'var(--error)' }}>
          {errorMsg}
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Link href="/admin/pedidos" style={{
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Pedido #{order.order_number}
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="md-detail-grid">
        {/* Left column: order details and items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Cliente Card */}
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10, margin: '0 0 12px 0' }}>
              Datos del Cliente
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, fontSize: 13 }} className="sm-grid-2">
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Nombre</span>
                <strong>{order.customer_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Celular</span>
                <strong>{order.customer_phone}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Email</span>
                <strong>{order.customer_email || 'No proporcionado'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Fecha Pedido</span>
                <strong>{new Date(order.created_at).toLocaleString('es-CO')}</strong>
              </div>
            </div>
          </div>

          {/* Entrega Card */}
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10, margin: '0 0 12px 0' }}>
              Información de Entrega
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Dirección</span>
                <strong>{order.address}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }} className="sm-grid-2">
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Ciudad</span>
                  <strong>{order.city}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Departamento</span>
                  <strong>{order.department}</strong>
                </div>
              </div>
              {order.notes && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Indicaciones / Notas</span>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Card */}
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10, margin: '0 0 16px 0' }}>
              Prendas Compradas
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {order.order_items?.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  border: '1px solid var(--border)',
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: 'var(--bg)'
                }}>
                  <div style={{
                    position: 'relative',
                    width: 56,
                    height: 72,
                    borderRadius: 6,
                    overflow: 'hidden',
                    backgroundColor: '#F3F4F6',
                    border: '1px solid var(--border)',
                    flexShrink: 0
                  }}>
                    <Image
                      src={item.product_image || '/placeholder-product.png'}
                      alt={item.product_name}
                      fill
                      sizes="56px"
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product_name}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: 'var(--text-muted)' }}>
                      {item.size && <span>Talla: <strong style={{ color: 'var(--text)' }}>{item.size}</strong></span>}
                      {item.color && <span>Color: <strong style={{ color: 'var(--text)' }}>{item.color}</strong></span>}
                      <span>Cantidad: <strong style={{ color: 'var(--text)' }}>{item.quantity}</strong></span>
                      <span>Precio unitario: <strong style={{ color: 'var(--text)' }}>{formatPrice(item.unit_price)}</strong></span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand)' }}>
                      {formatPrice(item.total_price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <strong>{formatPrice(order.subtotal)}</strong>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Descuento ({order.coupon_code || 'Cupón'})</span>
                  <strong>-{formatPrice(order.discount)}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Costo de Envío ({order.shipping_method === 'express' ? 'Express' : 'Estándar'})</span>
                <strong>{formatPrice(order.shipping_cost)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, borderTop: '1px dashed var(--border)', paddingTop: 8, marginTop: 4 }}>
                <span>Total</span>
                <span style={{ color: 'var(--brand)' }}>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: status selector and updater */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10, margin: '0 0 16px 0' }}>
              Estado del Pedido
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Modificar Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    border: '1.5px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: status === 'cancelled' ? '#FEF2F2' : status === 'delivered' ? '#D1FAE5' : 'white',
                    color: status === 'cancelled' ? 'var(--error)' : status === 'delivered' ? 'var(--success)' : 'var(--text)'
                  }}
                >
                  <option value="pending" style={{ color: '#D97706' }}>Pendiente (Pendiente de contactar)</option>
                  <option value="preparing" style={{ color: '#0284C7' }}>Preparing (Empacando prendas)</option>
                  <option value="shipped" style={{ color: '#4F46E5' }}>Enviado (En camino al destino)</option>
                  <option value="delivered" style={{ color: '#059669' }}>Entregado (Cliente recibió)</option>
                  <option value="cancelled" style={{ color: '#DC2626' }}>Cancelado (Devuelto/No concretado)</option>
                </select>
              </div>

              {successMsg && (
                <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: 'var(--success)', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--error)', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleSaveStatus}
                className="btn-brand"
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  height: 44,
                  width: '100%'
                }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Actualizar Estado
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 576px) {
          .sm-grid-2 {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 992px) {
          .md-detail-grid {
            display: grid !important;
            grid-template-columns: 1.3fr 0.7fr !important;
            align-items: start;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
