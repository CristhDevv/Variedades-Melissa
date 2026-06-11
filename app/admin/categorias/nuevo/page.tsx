'use client'
import { useState } from 'react'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'

export default function NuevoCategoriaPage() {
  const router = useRouter()

  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [active, setActive] = useState(true)

  // Media
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Auto-generate slug when name changes
  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(slugify(val))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!name.trim() || !slug.trim()) {
      setErrorMsg('El nombre y el slug son requeridos.')
      return
    }

    setSaving(true)

    try {
      let finalImageUrl = imageUrl

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `categories/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('category-images')
          .upload(filePath, imageFile)

        if (uploadError) {
          throw new Error('Error al subir imagen de la categoría.')
        }

        const { data: { publicUrl } } = supabase.storage
          .from('category-images')
          .getPublicUrl(filePath)

        finalImageUrl = publicUrl
      }

      const categoryPayload = {
        name: name.trim(),
        slug: slug.trim(),
        image_url: finalImageUrl || null,
        sort_order: parseInt(sortOrder, 10) || 0,
        active
      }

      const { error } = await supabase
        .from('categories')
        .insert(categoryPayload)

      if (error) throw error

      router.push('/admin/categorias')
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la categoría. Asegúrese de que el slug sea único.')
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button
          onClick={() => router.push('/admin/categorias')}
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
          Nueva Categoría
        </h1>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Nombre *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Vestidos, Accesorios"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Slug (URL identificador) *
            </label>
            <input
              type="text"
              required
              placeholder="ej-vestidos"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Orden de Visualización
              </label>
              <input
                type="number"
                placeholder="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                Activa
              </label>
            </div>
          </div>

          {/* Image Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Imagen de la Categoría
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {imageUrl && !imageFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <div style={{ position: 'relative', width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <Image src={imageUrl} alt="preview category" fill style={{ objectFit: 'cover' }} unoptimized />
                  </div>
                  <button type="button" onClick={() => setImageUrl('')} style={{ border: 'none', background: 'none', color: 'var(--error)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    Eliminar Imagen
                  </button>
                </div>
              )}

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                border: '1.5px dashed var(--border)',
                borderRadius: 10,
                cursor: 'pointer',
                backgroundColor: 'var(--bg)',
                fontSize: 13
              }}>
                <Upload size={16} color="var(--brand)" />
                <span style={{ color: 'var(--text-muted)' }}>
                  {imageFile ? imageFile.name : 'Subir archivo...'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setImageFile(e.target.files[0])
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>

              {!imageFile && (
                <input
                  type="text"
                  placeholder="O ingresa URL de la imagen..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
                />
              )}
            </div>
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
              {saving ? <Loader2 size={18} className="animate-spin" /> : 'Crear Categoría'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/categorias')}
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
