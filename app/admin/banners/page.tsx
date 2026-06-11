'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Loader2, Upload } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Banner } from '@/lib/types'

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [link, setLink] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [active, setActive] = useState(true)

  // Media
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setBanners(data as Banner[])
    }
    setLoading(false)
  }

  const handleEditClick = (b: Banner) => {
    setEditingId(b.id)
    setTitle(b.title || '')
    setSubtitle(b.subtitle || '')
    setLink(b.link || '')
    setSortOrder(b.sort_order.toString())
    setActive(b.active)
    setImageUrl(b.image_url)
    setImageFile(null)
    setErrorMsg('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setTitle('')
    setSubtitle('')
    setLink('')
    setSortOrder('0')
    setActive(true)
    setImageUrl('')
    setImageFile(null)
    setErrorMsg('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!imageUrl.trim() && !imageFile) {
      setErrorMsg('La imagen es requerida para el banner.')
      return
    }

    setSaving(true)

    try {
      let finalImageUrl = imageUrl

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `banners/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('banner-images')
          .upload(filePath, imageFile)

        if (uploadError) {
          throw new Error('Error al subir imagen del banner.')
        }

        const { data: { publicUrl } } = supabase.storage
          .from('banner-images')
          .getPublicUrl(filePath)

        finalImageUrl = publicUrl
      }

      const bannerPayload = {
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
        image_url: finalImageUrl,
        link: link.trim() || null,
        sort_order: parseInt(sortOrder, 10) || 0,
        active
      }

      if (editingId) {
        const { error } = await supabase
          .from('banners')
          .update(bannerPayload)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('banners')
          .insert(bannerPayload)

        if (error) throw error
      }

      handleCancel()
      await fetchBanners()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el banner.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDeletingId(null)
      await fetchBanners()
    } catch {
      setErrorMsg('Error al eliminar el banner.')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>
        Banners Promocionales
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="md-grid-2">
        {/* Banner Form */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>
            {editingId ? 'Editar Banner' : 'Nuevo Banner'}
          </h2>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Título
              </label>
              <input
                type="text"
                placeholder="Ej. Colección de Verano 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Subtítulo / Mensaje secundario
              </label>
              <input
                type="text"
                placeholder="Ej. Hasta 30% de descuento en prendas seleccionadas"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Link de redirección (URL / Ruta interna)
              </label>
              <input
                type="text"
                placeholder="Ej. /catalogo?categoria=vestidos o URL completa"
                value={link}
                onChange={(e) => setLink(e.target.value)}
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
                  Activo
                </label>
              </div>
            </div>

            {/* Image Selector */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Imagen del Banner (Aspect-ratio 16:9 recomendado)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {imageUrl && !imageFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <div style={{ position: 'relative', width: 80, height: 45, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <Image src={imageUrl} alt="preview banner" fill style={{ objectFit: 'cover' }} unoptimized />
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
                  padding: '10px 14px',
                  border: '1.5px dashed var(--border)',
                  borderRadius: 8,
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
                  />
                )}
              </div>
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

        {/* Banners List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={28} className="animate-spin" color="var(--brand)" />
            </div>
          ) : banners.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md-banners-grid">
              {banners.map((b) => (
                <div key={b.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Visual Preview 16:9 */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: '#E5E7EB',
                    border: '1px solid var(--border)',
                    flexShrink: 0
                  }}>
                    <Image src={b.image_url} alt={b.title || 'Banner'} fill style={{ objectFit: 'cover' }} unoptimized />
                  </div>

                  {/* Banner Info en Renglones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    {(b.title || b.subtitle) && (
                      <div>
                        {b.title && <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{b.title}</h3>}
                        {b.subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{b.subtitle}</p>}
                      </div>
                    )}

                    {b.link && (
                      <div style={{ fontSize: 12, color: 'var(--brand)', wordBreak: 'break-all' }}>
                        <strong style={{ color: 'var(--text-muted)' }}>Link:</strong> {b.link}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: 4 }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Orden: </span>
                        <strong>{b.sort_order}</strong>
                      </div>
                      
                      <span style={{
                        backgroundColor: b.active ? 'var(--brand-50)' : '#F3F4F6',
                        color: b.active ? 'var(--brand)' : 'var(--text-muted)',
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        {b.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <button
                      onClick={() => handleEditClick(b)}
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

                    {deletingId === b.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleDelete(b.id)}
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
                        onClick={() => setDeletingId(b.id)}
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
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No se han registrado banners promocionales.
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
          .md-banners-grid {
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
