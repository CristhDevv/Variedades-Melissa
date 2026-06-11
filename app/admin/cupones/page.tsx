'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Edit } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Coupon } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

export default function AdminCuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrder, setMinOrder] = useState('0')
  const [maxUses, setMaxUses] = useState('100')
  const [expiresAt, setExpiresAt] = useState('')
  const [active, setActive] = useState(true)

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('code', { ascending: true })

    if (!error && data) {
      setCoupons(data as Coupon[])
    }
    setLoading(false)
  }

  const handleEditClick = (c: Coupon) => {
    setEditingId(c.id)
    setCode(c.code)
    setDiscountType(c.discount_type)
    setDiscountValue(c.discount_value.toString())
    setMinOrder(c.min_order.toString())
    setMaxUses(c.max_uses.toString())
    setExpiresAt(c.expires_at ? c.expires_at.split('T')[0] : '')
    setActive(c.active)
    setErrorMsg('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setCode('')
    setDiscountType('fixed')
    setDiscountValue('')
    setMinOrder('0')
    setMaxUses('100')
    setExpiresAt('')
    setActive(true)
    setErrorMsg('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!code.trim()) return
    const val = parseFloat(discountValue)
    if (isNaN(val) || val <= 0) {
      setErrorMsg('El valor de descuento debe ser mayor que cero.')
      return
    }

    setSaving(true)

    try {
      const couponPayload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: val,
        min_order: parseFloat(minOrder) || 0,
        max_uses: parseInt(maxUses, 10) || 1,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        active
      }

      if (editingId) {
        const { error } = await supabase
          .from('coupons')
          .update(couponPayload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert({
            ...couponPayload,
            used_count: 0
          })
        if (error) throw error
      }

      handleCancel()
      await fetchCoupons()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el cupón. Asegúrese de que el código sea único.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDeletingId(null)
      await fetchCoupons()
    } catch {
      setErrorMsg('No se pudo eliminar el cupón.')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>
        Cupones de Descuento
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="md-grid-2">
        {/* Coupon Form */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>
            {editingId ? 'Editar Cupón' : 'Nuevo Cupón'}
          </h2>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Código del Cupón *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. MELISSA10, DIADELAMADRE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Tipo de Descuento
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                >
                  <option value="fixed">Valor Fijo ($)</option>
                  <option value="percentage">Porcentaje (%)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Valor *
                </label>
                <input
                  type="number"
                  required
                  placeholder={discountType === 'percentage' ? '15' : '10000'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Compra Mínima ($)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Límite de Usos
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                Cupón Activo
              </label>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--error)', padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="submit"
                className="btn-brand"
                disabled={saving}
                style={{ flexGrow: 1 }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text)',
                    padding: '0 16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Coupons List Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={28} className="animate-spin" color="var(--brand)" />
            </div>
          ) : coupons.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }} className="md-coupons-grid">
              {coupons.map((c) => {
                const discountLabel = c.discount_type === 'percentage' ? `${c.discount_value}%` : formatPrice(c.discount_value)
                const usagePercentage = c.max_uses > 0 ? Math.round((c.used_count / c.max_uses) * 100) : 0
                const expiryDate = c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-CO') : 'Nunca'
                const isExpired = c.expires_at && new Date(c.expires_at) < new Date()

                return (
                  <div key={c.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Código destacado */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.5px' }}>
                        {c.code}
                      </span>
                      <span style={{
                        backgroundColor: (c.active && !isExpired) ? 'var(--brand-50)' : '#F3F4F6',
                        color: (c.active && !isExpired) ? 'var(--brand)' : 'var(--text-muted)',
                        borderRadius: 999,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        {isExpired ? 'Vencido' : c.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Descuento */}
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Descuento:</strong> {discountLabel}
                    </div>

                    {/* Usos */}
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Usos:</strong> {c.used_count} / {c.max_uses} 
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({usagePercentage}%)</span>
                    </div>

                    {/* Fecha de vencimiento */}
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Vence:</strong> {expiryDate}
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                      <button
                        onClick={() => handleEditClick(c)}
                        style={{
                          border: '1px solid var(--border)',
                          background: 'white',
                          color: 'var(--text)',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        <Edit size={12} />
                        Editar
                      </button>

                      {deletingId === c.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{ backgroundColor: 'var(--error)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                          >
                            Sí, eliminar
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            style={{ backgroundColor: 'white', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(c.id)}
                          style={{
                            border: '1px solid var(--border)',
                            background: 'white',
                            color: 'var(--error)',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No hay cupones registrados.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .md-grid-2 {
            display: grid !important;
            grid-template-columns: 1fr 1.5fr !important;
            align-items: start;
          }
        }
        @media (min-width: 1200px) {
          .md-coupons-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
