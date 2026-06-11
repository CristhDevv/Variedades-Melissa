'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Props {
  params: { id: string }
}

export default function EditarCuponPage({ params }: Props) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)

  // Form states
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrder, setMinOrder] = useState('0')
  const [maxUses, setMaxUses] = useState('100')
  const [expiresAt, setExpiresAt] = useState('')
  const [active, setActive] = useState(true)

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchCoupon = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        setErrorMsg('No se pudo encontrar el cupón solicitado.')
      } else {
        setCode(data.code || '')
        setDiscountType(data.discount_type || 'fixed')
        setDiscountValue(data.discount_value?.toString() || '')
        setMinOrder(data.min_order?.toString() || '0')
        setMaxUses(data.max_uses?.toString() || '100')
        setExpiresAt(data.expires_at ? data.expires_at.split('T')[0] : '')
        setActive(data.active)
      }
      setLoading(false)
    }

    fetchCoupon()
  }, [params.id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!code.trim()) {
      setErrorMsg('El código del cupón es requerido.')
      return
    }
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

      const { error } = await supabase
        .from('coupons')
        .update(couponPayload)
        .eq('id', params.id)

      if (error) throw error

      router.push('/admin/cupones')
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el cupón. Asegúrese de que el código sea único.')
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button
          onClick={() => router.push('/admin/cupones')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            backgroundColor: 'white',
            color: 'var(--text)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Editar Cupón de Descuento
        </h1>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={28} className="animate-spin" color="var(--brand)" />
        </div>
      ) : errorMsg && !code ? (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--error)', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
          {errorMsg}
        </div>
      ) : (
        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
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
                  className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
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
                  className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
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
                  className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
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
                  className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
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
                className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
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

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                type="submit"
                className="btn-brand"
                disabled={saving}
                style={{ flexGrow: 1 }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/cupones')}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  padding: '0 20px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
