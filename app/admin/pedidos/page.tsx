'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { Order } from '@/lib/types'

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data as Order[])
    }
    setLoading(false)
  }

  // Status badges mapping
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: '#FEF3C7', text: '#D97706', label: 'Pendiente' },
    preparing: { bg: '#E0F2FE', text: '#0284C7', label: 'Preparando' },
    shipped: { bg: '#E0E7FF', text: '#4F46E5', label: 'Enviado' },
    delivered: { bg: '#D1FAE5', text: '#059669', label: 'Entregado' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'Cancelado' }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>
        Pedidos Registrados
      </h1>

      {loading ? (
        <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 size={32} className="animate-spin" color="var(--brand)" />
        </div>
      ) : orders.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md-orders-grid">
          {orders.map((order) => {
            const badge = statusColors[order.status] || { bg: '#E5E7EB', text: '#374151', label: order.status }
            return (
              <div key={order.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Number and date on top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--brand)' }}>
                    #{order.order_number}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(order.created_at).toLocaleDateString('es-CO')}
                  </span>
                </div>

                {/* Client and Phone in line */}
                <div style={{ fontSize: 13, color: 'var(--text)' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Cliente:</strong> {order.customer_name} 
                  {order.customer_phone && <span style={{ color: 'var(--text-muted)' }}> ({order.customer_phone})</span>}
                </div>

                {/* City in line */}
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <strong>Ciudad:</strong> <span style={{ color: 'var(--text)' }}>{order.city} - {order.department}</span>
                </div>

                {/* Total and Status in line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                    {formatPrice(order.total)}
                  </span>
                  <span style={{
                    backgroundColor: badge.bg,
                    color: badge.text,
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {badge.label}
                  </span>
                </div>

                {/* Button 'Ver detalle' below */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href={`/admin/pedidos/${order.id}`} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1.5px solid var(--brand)',
                    color: 'var(--brand)',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    backgroundColor: 'white',
                    transition: 'all 0.2s'
                  }} className="btn-detail-link">
                    <Eye size={14} />
                    Ver detalle
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No hay pedidos registrados en el sistema.
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .md-orders-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1200px) {
          .md-orders-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        .btn-detail-link:hover {
          background-color: var(--brand-50) !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
