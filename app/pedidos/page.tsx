'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Loader2, Package, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function PedidosSearchPage() {
  const [searchVal, setSearchVal] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchVal.trim()
    if (!query) return

    setLoading(true)
    setSearched(true)
    setErrorMsg('')
    setOrders([])

    try {
      let queryBuilder = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      const isNumeric = /^\d+$/.test(query)

      if (isNumeric) {
        // Query matches order number or phone
        const num = parseInt(query, 10)
        queryBuilder = queryBuilder.or(`order_number.eq.${num},customer_phone.like.%${query}%`)
      } else {
        // Only matches phone
        queryBuilder = queryBuilder.ilike('customer_phone', `%${query}%`)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      setOrders(data as Order[] || [])
    } catch (err: any) {
      console.error(err)
      setErrorMsg('Ocurrió un error al buscar tus pedidos. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'entregado':
        return { bg: '#D1FAE5', color: '#065F46', text: 'Entregado' }
      case 'pending':
      case 'pendiente':
        return { bg: '#FEF3C7', color: '#92400E', text: 'Pendiente' }
      case 'processing':
      case 'en proceso':
        return { bg: '#DBEAFE', color: '#1E40AF', text: 'En Proceso' }
      case 'cancelled':
      case 'cancelado':
        return { bg: '#FEE2E2', color: '#991B1B', text: 'Cancelado' }
      default:
        return { bg: '#F3F4F6', color: '#374151', text: status }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 80 }}>
      <Header />

      <main style={{ padding: '20px 16px', flexGrow: 1 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
          Rastrear Pedido
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Ingresa el número de tu pedido o el celular con el que realizaste la compra.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              required
              placeholder="Ej. 1005 o 3001234567"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 40px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                fontSize: 14,
                outline: 'none',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)'
              }}
            />
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 15 }} />
          </div>
          <button
            type="submit"
            className="btn-brand"
            disabled={loading}
            style={{ width: 'auto', padding: '0 20px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Buscar'}
          </button>
        </form>

        {errorMsg && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--error)', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 size={28} className="animate-spin" color="var(--brand)" />
          </div>
        ) : orders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map((order) => {
              const statusStyles = getStatusBadgeStyles(order.status)
              const dateStr = new Date(order.created_at).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })

              return (
                <div key={order.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pedido</span>
                      <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>#{order.order_number}</h2>
                    </div>
                    <span style={{
                      backgroundColor: statusStyles.bg,
                      color: statusStyles.color,
                      borderRadius: 999,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      {statusStyles.text}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 13 }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Fecha</div>
                      <div style={{ fontWeight: 500 }}>{dateStr}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total</div>
                      <div style={{ fontWeight: 700, color: 'var(--brand)' }}>{formatPrice(order.total)}</div>
                    </div>
                  </div>

                  <Link
                    href={`/pedido-confirmado/${order.order_number}`}
                    style={{
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      textDecoration: 'none',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '10px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      transition: 'background 0.2s'
                    }}
                  >
                    Ver detalle
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )
            })}
          </div>
        ) : searched ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 16px',
            textAlign: 'center',
            gap: 12,
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px dashed var(--border)'
          }}>
            <Package size={36} color="var(--text-muted)" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>
                No se encontraron pedidos
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Verifica el número ingresado o asegúrate de escribir el celular correcto.
              </p>
            </div>
          </div>
        ) : null}
      </main>

      <BottomNav />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
