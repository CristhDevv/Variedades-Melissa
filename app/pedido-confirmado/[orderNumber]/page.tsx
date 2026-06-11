import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase-server'
import { formatPrice } from '@/lib/utils'
import { Order } from '@/lib/types'

export const revalidate = 0

interface Props {
  params: { orderNumber: string }
}

export default async function PedidoConfirmadoPage({ params }: Props) {
  const supabase = createSupabaseServer()
  const orderNo = parseInt(params.orderNumber, 10)

  if (isNaN(orderNo)) {
    notFound()
  }

  const { data: orderData } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('order_number', orderNo)
    .single()

  if (!orderData) {
    notFound()
  }

  const order = orderData as Order

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '24px 16px' }}>
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Animated Check Icon */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'var(--success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          marginBottom: 20,
          animation: 'scaleIn 0.5s ease-out'
        }}>
          <Check size={40} strokeWidth={3} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', margin: '0 0 8px 0', color: 'var(--text)' }}>
          ¡Pedido Confirmado!
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 24px 0' }}>
          Tu orden ha sido registrada con éxito.
        </p>

        {/* Info card */}
        <div className="card" style={{ width: '100%', padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Número de Pedido</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>#{order.order_number}</span>
          </div>

          {/* Delivery Details */}
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>
              Datos de Envío
            </h3>
            <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>{order.customer_name}</p>
            <p style={{ fontSize: 13, margin: 0, color: 'var(--text-muted)' }}>{order.address}</p>
            <p style={{ fontSize: 13, margin: 0, color: 'var(--text-muted)' }}>{order.city}, {order.department}</p>
            <p style={{ fontSize: 13, margin: 0, color: 'var(--text-muted)' }}>Celular: {order.customer_phone}</p>
          </div>

          {/* Items Summary */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
              Resumen de Compra
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {order.order_items?.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)', maxWidth: '75%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.quantity}x {item.product_name} {item.size ? `(${item.size})` : ''}
                  </span>
                  <span style={{ fontWeight: 500 }}>{formatPrice(item.total_price)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, fontWeight: 700, fontSize: 15 }}>
            <span>Total Pagado</span>
            <span style={{ color: 'var(--brand)' }}>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* WhatsApp Notice Banner */}
        <div style={{
          backgroundColor: '#E8F5E9',
          border: '1px solid #C8E6C9',
          borderRadius: 'var(--radius)',
          padding: 14,
          width: '100%',
          textAlign: 'center',
          color: '#2E7D32',
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.5,
          marginBottom: 32
        }}>
          Te contactaremos por WhatsApp al <strong>{order.customer_phone}</strong> para coordinar tu entrega y el pago contra entrega si corresponde.
        </div>

        {/* Continue Shopping Button */}
        <Link href="/" style={{ textDecoration: 'none', width: '100%' }}>
          <button className="btn-brand">
            Seguir comprando
          </button>
        </Link>

      </main>

      {/* CSS Animation definitions */}
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
