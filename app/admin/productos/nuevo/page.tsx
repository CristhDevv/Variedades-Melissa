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
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-100">
        <Link href="/admin/productos" className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <span className="text-[11px] font-bold text-amber-600 tracking-widest uppercase">Admin Panel</span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
            Crear Producto
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        
        {/* Sección: Información Básica */}
        <section className="space-y-6">
          <h2 className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
            Información Básica
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Nombre del Producto <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Vestido Floreado Primavera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Descripción
              </label>
              <textarea
                placeholder="Detalla las características de la prenda, materiales, etc..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400 transition-colors resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Categoría
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors appearance-none"
                >
                  <option value="">Sin Categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-t border-gray-100" />

        {/* Sección: Precios */}
        <section className="space-y-6">
          <h2 className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
            Precios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Precio (COP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="Ej. 89900"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Precio Comparación (Tachado)
              </label>
              <input
                type="number"
                placeholder="Ej. 120000"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400 transition-colors"
              />
            </div>
          </div>
        </section>

        <hr className="border-t border-gray-100" />

        {/* Sección: Inventario y Visibilidad */}
        <section className="space-y-6">
          <h2 className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
            Inventario & Configuración
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Stock Disponible
              </label>
              <input
                type="number"
                placeholder="Ej. 10"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400 transition-colors"
              />
            </div>
            
            <div className="flex flex-wrap gap-6 py-2">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                Activo (Visible en tienda)
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                Destacado (Inicio)
              </label>
            </div>
          </div>
        </section>

        <hr className="border-t border-gray-100" />

        {/* Sección: Variantes (Tallas y Colores) */}
        <section className="space-y-6">
          <h2 className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
            Variantes (Tallas & Colores)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tallas */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Agregar Talla
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. S, M, L, XL"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSize(); } }}
                    className="flex-grow px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="flex items-center justify-center px-4 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Chips de Tallas */}
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-800"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setSizes(sizes.filter(x => x !== s))}
                      className="text-gray-400 hover:text-rose-600 transition-colors focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {sizes.length === 0 && (
                  <span className="text-xs text-gray-400 italic">No hay tallas agregadas.</span>
                )}
              </div>
            </div>

            {/* Colores */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Agregar Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre (Ej. Rosado)"
                    value={colorNameInput}
                    onChange={(e) => setColorNameInput(e.target.value)}
                    className="flex-grow px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400 transition-colors"
                  />
                  <input
                    type="color"
                    value={colorHexInput}
                    onChange={(e) => setColorHexInput(e.target.value)}
                    className="w-12 h-11 p-0 rounded-lg cursor-pointer border border-gray-200 overflow-hidden bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="flex items-center justify-center px-4 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Chips de Colores */}
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-800"
                  >
                    <span
                      style={{ backgroundColor: c.hex }}
                      className="w-3.5 h-3.5 rounded-full border border-black/10"
                    />
                    {c.name}
                    <button
                      type="button"
                      onClick={() => setColors(colors.filter(x => x.name !== c.name))}
                      className="text-gray-400 hover:text-rose-600 transition-colors focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {colors.length === 0 && (
                  <span className="text-xs text-gray-400 italic">No hay colores agregados.</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <hr className="border-t border-gray-100" />

        {/* Sección: Imágenes */}
        <section className="space-y-6">
          <h2 className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
            Imágenes del Producto
          </h2>
          
          <div className="space-y-6">
            {/* Carga de archivos */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Subir Imágenes
              </label>
              <label className="group flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-xl p-8 cursor-pointer transition-colors bg-gray-50/50">
                <Upload size={24} className="text-gray-400 group-hover:text-black transition-colors" />
                <span className="text-sm font-semibold text-gray-700 mt-3">Sube tus archivos</span>
                <span className="text-xs text-gray-400 mt-1">Haz clic para seleccionar imágenes</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setImageFiles([...imageFiles, ...Array.from(e.target.files)])
                    }
                  }}
                  className="hidden"
                />
              </label>

              {/* Lista de archivos a subir */}
              {imageFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {imageFiles.map((file, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      {file.name.substring(0, 18)}
                      {file.name.length > 18 && '...'}
                      <button
                        type="button"
                        onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== idx))}
                        className="text-amber-500 hover:text-amber-700 transition-colors focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* URLs externas */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                O ingresar URLs de imagen externas
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-grow px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="flex items-center justify-center px-4 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Lista de URLs ingresadas */}
              {manualUrls.length > 0 && (
                <div className="space-y-2 mt-4">
                  {manualUrls.map((url) => (
                    <div
                      key={url}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs bg-gray-50 border border-gray-200 text-gray-600"
                    >
                      <span className="truncate max-w-[85%]">{url}</span>
                      <button
                        type="button"
                        onClick={() => setManualUrls(manualUrls.filter(x => x !== url))}
                        className="text-gray-400 hover:text-rose-600 transition-colors focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <hr className="border-t border-gray-100" />

        {/* Sección: SEO */}
        <section className="space-y-6">
          <h2 className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
            Optimización SEO
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Meta Título
              </label>
              <input
                type="text"
                placeholder="Ej. Vestido Floreado de Moda Femenina | Variedades Melissa"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Meta Descripción
              </label>
              <textarea
                placeholder="Descripción resumida de 150-160 caracteres para Google..."
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400 transition-colors resize-y"
              />
            </div>
          </div>
        </section>

        {/* Error message */}
        {errorMsg && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Botones de acción (Guardar / Cancelar) */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur py-4 z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Link
            href="/admin/productos"
            className="w-full sm:w-auto px-6 py-3 text-center rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto min-w-[180px] px-6 py-3 flex items-center justify-center gap-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 text-sm font-semibold transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar y Publicar</span>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
