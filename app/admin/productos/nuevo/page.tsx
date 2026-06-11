'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, X, Loader2, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { Category } from '@/lib/types'

export default function NuevoProductoPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCats, setLoadingCats] = useState(true)

  // Form Fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [stock, setStock] = useState('10')
  const [active, setActive] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // Sizes & Colors chips lists
  const [sizeInput, setSizeInput] = useState('')
  const [sizes, setSizes] = useState<string[]>([])

  const [colorNameInput, setColorNameInput] = useState('')
  const [colorHexInput, setColorHexInput] = useState('#8B2252')
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([])

  // Image files & urls
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [manualUrls, setManualUrls] = useState<string[]>([])
  const [urlInput, setUrlInput] = useState('')

  // Submit states
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchCats = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
      if (!error && data) {
        setCategories(data as Category[])
      }
      setLoadingCats(false)
    }
    fetchCats()
  }, [])

  // Handle adding sizes
  const handleAddSize = () => {
    const s = sizeInput.trim().toUpperCase()
    if (s && !sizes.includes(s)) {
      setSizes([...sizes, s])
      setSizeInput('')
    }
  }

  // Handle adding colors
  const handleAddColor = () => {
    const nameVal = colorNameInput.trim()
    const hexVal = colorHexInput.trim()
    if (nameVal && hexVal && !colors.some(c => c.name.toLowerCase() === nameVal.toLowerCase())) {
      setColors([...colors, { name: nameVal, hex: hexVal }])
      setColorNameInput('')
    }
  }

  // Handle adding manual URL
  const handleAddUrl = () => {
    const url = urlInput.trim()
    if (url && !manualUrls.includes(url)) {
      setManualUrls([...manualUrls, url])
      setUrlInput('')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!name.trim()) return
    if (!price.trim()) {
      setErrorMsg('El precio es requerido.')
      return
    }

    setSubmitting(true)

    try {
      const generatedSlug = slugify(name)
      
      // 1. Upload Images to Storage bucket
      const uploadedUrls: string[] = []
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)
          uploadedUrls.push(publicUrl)
        }
      }

      const allImages = [...uploadedUrls, ...manualUrls]

      // 2. Insert into products
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: name.trim(),
          slug: generatedSlug,
          description: description.trim() || null,
          price: parseFloat(price),
          compare_price: comparePrice ? parseFloat(comparePrice) : null,
          category_id: categoryId || null,
          sizes,
          colors,
          stock: parseInt(stock, 10),
          active,
          featured,
          meta_title: metaTitle.trim() || null,
          meta_description: metaDescription.trim() || null,
          images: allImages,
          social_posted: false
        })
        .select('*')
        .single()

      if (productError || !productData) {
        throw new Error(productError?.message || 'Error al guardar el producto.')
      }

      // 3. Call API route for social post publish
      try {
        await fetch('/api/social-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: productData })
        })
      } catch {
        // Silently fail if social API is not set up
      }

      router.push('/admin/productos')

    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado al registrar el producto.')
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Top bar with back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Link href="/admin/productos" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          textDecoration: 'none'
        }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          Nuevo Producto
        </h1>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="md-grid-2">
          {/* Left Column: Core info */}
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: 0 }}>
              Información Básica
            </h2>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Vestido Floreado Primavera"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Descripción
              </label>
              <textarea
                placeholder="Detalla las características de la prenda..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Precio (COP) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="89900"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Precio Comparación (Tachado)
                </label>
                <input
                  type="number"
                  placeholder="120000"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Categoría
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Sin Categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Stock Disponible
                </label>
                <input
                  type="number"
                  placeholder="10"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                Activo (Visible en tienda)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                Destacado (Inicio)
              </label>
            </div>
          </div>

          {/* Right Column: Variants & Media */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Sizes & Colors */}
            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: 0 }}>
                Variantes (Tallas & Colores)
              </h2>

              {/* Sizes input */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Agregar Talla
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Ej. S, M, L, XL"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSize(); } }}
                  />
                  <button type="button" onClick={handleAddSize} className="btn-brand" style={{ width: 'auto', padding: '0 16px' }}>
                    <Plus size={18} />
                  </button>
                </div>
                {/* Sizes chips display */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {sizes.map((s) => (
                    <span key={s} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontWeight: 600
                    }}>
                      {s}
                      <button type="button" onClick={() => setSizes(sizes.filter(x => x !== s))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)', padding: 0 }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Colors input */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Agregar Color
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Nombre (Ej. Rosado)"
                    value={colorNameInput}
                    onChange={(e) => setColorNameInput(e.target.value)}
                    style={{ flexGrow: 1 }}
                  />
                  <input
                    type="color"
                    value={colorHexInput}
                    onChange={(e) => setColorHexInput(e.target.value)}
                    style={{ width: 48, padding: 0, height: 48, cursor: 'pointer', border: '1.5px solid var(--border)' }}
                  />
                  <button type="button" onClick={handleAddColor} className="btn-brand" style={{ width: 'auto', padding: '0 16px' }}>
                    <Plus size={18} />
                  </button>
                </div>
                {/* Colors chips display */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {colors.map((c) => (
                    <span key={c.name} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontWeight: 500
                    }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: c.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                      {c.name}
                      <button type="button" onClick={() => setColors(colors.filter(x => x.name !== c.name))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)', padding: 0 }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Media Upload & URLs */}
            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: 0 }}>
                Imágenes del Producto
              </h2>

              {/* File upload input */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Subir Archivos
                </label>
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px 16px',
                  border: '2px dashed var(--border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg)',
                  transition: 'border-color 0.2s'
                }}>
                  <Upload size={24} color="var(--brand)" />
                  <span style={{ fontSize: 13, marginTop: 8, color: 'var(--text-muted)' }}>Haz click para seleccionar imágenes</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setImageFiles([...imageFiles, ...Array.from(e.target.files)])
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
                {/* Files display list */}
                {imageFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {imageFiles.map((file, idx) => (
                      <span key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        backgroundColor: '#E0F2FE',
                        color: '#0369A1',
                        padding: '4px 8px',
                        borderRadius: 6
                      }}>
                        {file.name.substring(0, 15)}...
                        <button type="button" onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#0369A1', padding: 0 }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct URLs backup */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  O ingresar URLs de imagen
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <button type="button" onClick={handleAddUrl} className="btn-brand" style={{ width: 'auto', padding: '0 16px' }}>
                    <Plus size={18} />
                  </button>
                </div>
                {/* URLs list */}
                {manualUrls.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
                    {manualUrls.map((url) => (
                      <span key={url} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        padding: '4px 8px',
                        borderRadius: 6
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>{url}</span>
                        <button type="button" onClick={() => setManualUrls(manualUrls.filter(x => x !== url))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SEO Section */}
            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: 0 }}>
                SEO / Metatags
              </h2>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Meta Título (Título SEO)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Vestido Floreado de Moda Femenina | Variedades Melissa"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Meta Descripción
                </label>
                <textarea
                  placeholder="Descripción resumida para buscadores (Google)..."
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Error Message */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            padding: 12,
            borderRadius: 8,
            color: 'var(--error)',
            fontSize: 13,
            fontWeight: 500
          }}>
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn-brand"
          disabled={submitting}
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Guardando producto y publicando...
            </>
          ) : 'Guardar y Publicar'}
        </button>
      </form>

      <style>{`
        @media (min-width: 992px) {
          .md-grid-2 {
            display: grid !important;
            grid-template-columns: 1.2fr 0.8fr !important;
            align-items: start;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
