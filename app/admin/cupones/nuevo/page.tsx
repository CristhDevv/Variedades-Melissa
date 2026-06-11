'use client'
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NuevoCuponPage() {
  const router = useRouter()

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
        active,
        used_count: 0
      }

      const { error } = await supabase
        .from('coupons')
        .insert(couponPayload)

      if (error) throw error

      router.push('/admin/cupones')
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear el cupón. Asegúrese de que el código sea único.')
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
          Nuevo Cupón de Descuento
        </h1>
      </div>

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
              {saving ? <Loader2 size={18} className="animate-spin" /> : 'Crear Cupón'}
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
