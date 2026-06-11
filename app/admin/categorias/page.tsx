'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Loader2, Upload } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { Category } from '@/lib/types'

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Edit / Form states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [active, setActive] = useState(true)

  // Media upload or URL
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setCategories(data as Category[])
    }
    setLoading(false)
  }

  // Auto-generate slug when name changes
  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(slugify(val))
  }

  const handleEditClick = (cat: Category) => {
    setEditingId(cat.id)
    setName(cat.name)
    setSlug(cat.slug)
    setSortOrder(cat.sort_order.toString())
    setActive(cat.active)
    setImageUrl(cat.image_url || '')
    setImageFile(null)
    setErrorMsg('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setName('')
    setSlug('')
    setSortOrder('0')
    setActive(true)
    setImageUrl('')
    setImageFile(null)
    setErrorMsg('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!name.trim() || !slug.trim()) return

    setSaving(true)

    try {
      let finalImageUrl = imageUrl

      // 1. Upload image to bucket if set
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

      if (editingId) {
        // Edit existing
        const { error } = await supabase
          .from('categories')
          .update(categoryPayload)
          .eq('id', editingId)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('categories')
          .insert(categoryPayload)

        if (error) throw error
      }

      handleCancel()
      await fetchCategories()

    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la categoría. Asegúrese de que el slug sea único.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
      setDeletingId(null)
      await fetchCategories()
    } catch {
      setErrorMsg('No se puede eliminar la categoría. Probablemente está asociada a productos existentes.')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>
        Categorías
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="md-grid-2">
        {/* Inline Form Card */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>
            {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                      <Image src={imageUrl} alt="preview" fill style={{ objectFit: 'cover' }} unoptimized />
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

        {/* Categories List Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={28} className="animate-spin" color="var(--brand)" />
            </div>
          ) : categories.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }} className="md-cats-grid">
              {categories.map((cat) => {
                const img = cat.image_url || '/placeholder-category.png'
                return (
                  <div key={cat.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {/* circular image */}
                      <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', flexShrink: 0 }}>
                        <Image src={img} alt={cat.name} fill style={{ objectFit: 'cover' }} unoptimized />
                      </div>
                      
                      {/* Name and Slug */}
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{cat.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cat.slug}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Orden: </span>
                        <strong>{cat.sort_order}</strong>
                      </div>
                      
                      <span style={{
                        backgroundColor: cat.active ? 'var(--brand-50)' : '#F3F4F6',
                        color: cat.active ? 'var(--brand)' : 'var(--text-muted)',
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        {cat.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    {/* Botones editar/eliminar abajo */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <button
                        onClick={() => handleEditClick(cat)}
                        style={{
                          border: '1px solid var(--border)',
                          background: 'white',
                          color: 'var(--text)',
                          padding: '4px 8px',
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
                      
                      {deletingId === cat.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            style={{ backgroundColor: 'var(--error)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                          >
                            Sí, eliminar
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            style={{ backgroundColor: 'white', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(cat.id)}
                          style={{
                            border: '1px solid var(--border)',
                            background: 'white',
                            color: 'var(--error)',
                            padding: '4px 8px',
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
              No hay categorías registradas.
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
          .md-cats-grid {
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
