'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Props {
  params: { id: string }
}

export default function EditarBannerPage({ params }: Props) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)

  // Form states
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [linkType, setLinkType] = useState<'none' | 'home' | 'category' | 'product' | 'other'>('none')
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('')
  const [selectedProductSlug, setSelectedProductSlug] = useState('')
  const [originalLink, setOriginalLink] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [active, setActive] = useState(true)

  // Options states
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Media
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchDataAndBanner = async () => {
      setLoading(true)
      setLoadingOptions(true)
      try {
        // Fetch categories & products
        const { data: cats } = await supabase
          .from('categories')
          .select('name, slug')
          .eq('active', true)
          .order('name', { ascending: true })

        const { data: prods } = await supabase
          .from('products')
          .select('name, slug')
          .eq('active', true)
          .order('name', { ascending: true })

        if (cats) setCategories(cats)
        if (prods) setProducts(prods)

        // Fetch banner details
        const { data: bannerData, error } = await supabase
          .from('banners')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error || !bannerData) {
          setErrorMsg('No se pudo encontrar el banner solicitado.')
        } else {
          setTitle(bannerData.title || '')
          setSubtitle(bannerData.subtitle || '')
          setSortOrder(bannerData.sort_order.toString())
          setActive(bannerData.active)
          setImageUrl(bannerData.image_url)
          
          const rawLink = bannerData.link || ''
          setOriginalLink(rawLink)

          // Parse rawLink to determine linkType
          if (!rawLink) {
            setLinkType('none')
          } else if (rawLink === '/') {
            setLinkType('home')
          } else if (rawLink.startsWith('/catalogo?categoria=')) {
            setLinkType('category')
            const catSlug = rawLink.split('categoria=')[1] || ''
            setSelectedCategorySlug(catSlug)
          } else if (rawLink.startsWith('/producto/')) {
            setLinkType('product')
            const prodSlug = rawLink.substring('/producto/'.length) || ''
            setSelectedProductSlug(prodSlug)
          } else {
            setLinkType('other')
          }
        }
      } catch (err: any) {
        setErrorMsg('Error al cargar la información.')
      } finally {
        setLoading(false)
        setLoadingOptions(false)
      }
    }

    fetchDataAndBanner()
  }, [params.id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!imageUrl.trim() && !imageFile) {
      setErrorMsg('La imagen es requerida para el banner.')
      return
    }

    // Build the redirect link based on friendly selector
    let finalLink: string | null = null
    if (linkType === 'none') {
      finalLink = null
    } else if (linkType === 'home') {
      finalLink = '/'
    } else if (linkType === 'category') {
      if (!selectedCategorySlug) {
        setErrorMsg('Por favor selecciona una categoría de destino.')
        return
      }
      finalLink = `/catalogo?categoria=${selectedCategorySlug}`
    } else if (linkType === 'product') {
      if (!selectedProductSlug) {
        setErrorMsg('Por favor selecciona un producto de destino.')
        return
      }
      finalLink = `/producto/${selectedProductSlug}`
    } else if (linkType === 'other') {
      finalLink = originalLink
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
        link: finalLink,
        sort_order: parseInt(sortOrder, 10) || 0,
        active
      }

      const { error } = await supabase
        .from('banners')
        .update(bannerPayload)
        .eq('id', params.id)

      if (error) throw error

      router.push('/admin/banners')
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el banner.')
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button
          onClick={() => router.push('/admin/banners')}
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
          Editar Banner Promocional
        </h1>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={28} className="animate-spin" color="var(--brand)" />
        </div>
      ) : errorMsg && !title ? (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--error)', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
          {errorMsg}
        </div>
      ) : (
        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Título
              </label>
              <input
                type="text"
                placeholder="Ej. Colección de Verano 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
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
                className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Destino del Banner
              </label>
              <select
                value={linkType}
                onChange={(e) => {
                  setLinkType(e.target.value as any)
                  setSelectedCategorySlug('')
                  setSelectedProductSlug('')
                }}
                className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
              >
                <option value="none">Sin enlace</option>
                <option value="home">Página de inicio</option>
                <option value="category">Categoría</option>
                <option value="product">Producto</option>
                {linkType === 'other' && <option value="other">Otro (Enlace personalizado)</option>}
              </select>
            </div>

            {linkType === 'category' && (
              <div className="animate-fade-in">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Selecciona la Categoría
                </label>
                {loadingOptions ? (
                  <span className="text-xs text-gray-500">Cargando categorías...</span>
                ) : (
                  <select
                    value={selectedCategorySlug}
                    onChange={(e) => setSelectedCategorySlug(e.target.value)}
                    className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
                    required
                  >
                    <option value="">-- Elige una categoría --</option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {linkType === 'product' && (
              <div className="animate-fade-in">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Selecciona el Producto
                </label>
                {loadingOptions ? (
                  <span className="text-xs text-gray-500">Cargando productos...</span>
                ) : (
                  <select
                    value={selectedProductSlug}
                    onChange={(e) => setSelectedProductSlug(e.target.value)}
                    className="w-full px-4 py-3 rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] transition-colors text-sm bg-white text-[var(--text)] outline-none focus:outline-none"
                    required
                  >
                    <option value="">-- Elige un producto --</option>
                    {products.map((prod) => (
                      <option key={prod.slug} value={prod.slug}>
                        {prod.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {linkType === 'other' && (
              <div style={{
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                color: '#92400E',
                padding: '12px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 500
              }} className="animate-fade-in">
                Enlace personalizado configurado: <strong style={{ textDecoration: 'underline' }}>{originalLink}</strong>. 
                El enlace no estándar se preservará. Selecciona otra opción en el destino si deseas cambiarlo.
              </div>
            )}

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
                {saving ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/banners')}
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
