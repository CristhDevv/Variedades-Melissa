import { createSupabaseServer } from '@/lib/supabase-server'
import { formatPrice } from '@/lib/utils'
import { Order } from '@/lib/types'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = createSupabaseServer()

  // Monthly filters
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Fetch monthly orders
  const { data: monthlyOrders } = await supabase
    .from('orders')
    .select('total, status')
    .gte('created_at', startOfMonth.toISOString())

  // Fetch active products count
  const { count: activeProductsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

  // Fetch pending orders count
  const { count: pendingOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Fetch latest 5 orders
  const { data: latestOrders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const salesSum = (monthlyOrders || [])
    .filter(o => o.status !== 'cancelled')
    .reduce((a, o) => a + Number(o.total), 0)

  const ordersCount = (monthlyOrders || []).length
  const recentOrders = (latestOrders || []) as Order[]

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
        Dashboard
      </h1>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 28
      }} className="admin-metrics-grid">
        {/* Metric 1 */}
        <div className="card" style={{ padding: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Ventas del Mes</span>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)', marginTop: 4 }}>{formatPrice(salesSum)}</h2>
        </div>
        {/* Metric 2 */}
        <div className="card" style={{ padding: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Pedidos del Mes</span>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>{ordersCount}</h2>
        </div>
        {/* Metric 3 */}
        <div className="card" style={{ padding: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Productos Activos</span>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>{activeProductsCount || 0}</h2>
        </div>
        {/* Metric 4 */}
        <div className="card" style={{ padding: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Pedidos Pendientes</span>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--warning)', marginTop: 4 }}>{pendingOrdersCount || 0}</h2>
        </div>
      </div>

      {/* Latest Orders Cards */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          Últimos Pedidos
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => {
              const badge = statusColors[order.status] || { bg: '#E5E7EB', text: '#374151', label: order.status }
              return (
                <div key={order.id} style={{
                  padding: 16,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  backgroundColor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>
                      #{order.order_number}
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
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cliente: </span>
                    {order.customer_name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                      {formatPrice(order.total)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No hay pedidos registrados este mes.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .admin-metrics-grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 16px !important;
          }
          .admin-metrics-grid h2 {
            font-size: 24px !important;
            margin-top: 6px !important;
          }
          .admin-metrics-grid span {
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  )
}
