import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

// Instagram feed aspect ratio limits (width / height)
const INSTAGRAM_MIN_RATIO = 0.8   // 4:5 portrait
const INSTAGRAM_MAX_RATIO = 1.91  // ~16:9 landscape

/**
 * Descarga una imagen, verifica su ratio de aspecto y, si está fuera del
 * rango permitido por Instagram (0.8–1.91), la recorta automáticamente
 * a proporciones 4:5 portrait (más seguro para feed de Instagram).
 *
 * Las imágenes procesadas se suben a Supabase Storage en
 * product-images/social-temp/ y se devuelve su URL pública.
 *
 * Si el ratio original ya es válido, devuelve la URL original sin tocar.
 *
 * @param imageUrl - URL pública de la imagen a verificar/procesar.
 * @returns URL pública segura para Instagram.
 */
export async function ensureInstagramSafeImage(imageUrl: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? ''

  // Descargar la imagen
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`No se pudo descargar la imagen para procesamiento: ${imageUrl}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())

  // Leer metadatos con sharp
  const metadata = await sharp(buffer).metadata()
  const width = metadata.width ?? 1
  const height = metadata.height ?? 1
  const ratio = width / height

  // Si está dentro del rango de Instagram, no hacer nada
  if (ratio >= INSTAGRAM_MIN_RATIO && ratio <= INSTAGRAM_MAX_RATIO) {
    console.log(`[imageUtils] Ratio ${ratio.toFixed(3)} OK — imagen sin cambios`)
    return imageUrl
  }

  console.log(`[imageUtils] Ratio ${ratio.toFixed(3)} fuera de rango. Recortando a 4:5...`)

  // Calcular dimensiones objetivo 4:5 (portrait, el más seguro para Instagram)
  let targetWidth: number
  let targetHeight: number

  if (ratio < INSTAGRAM_MIN_RATIO) {
    // Imagen muy vertical → recortar en altura para llegar a 4:5
    targetWidth = width
    targetHeight = Math.round(width / INSTAGRAM_MIN_RATIO)
  } else {
    // Imagen muy horizontal → recortar en anchura para llegar a 1.91:1
    targetHeight = height
    targetWidth = Math.round(height * INSTAGRAM_MAX_RATIO)
  }

  const processedBuffer = await sharp(buffer)
    .resize(targetWidth, targetHeight, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 90 })
    .toBuffer()

  // Subir imagen procesada a Supabase Storage
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const fileName = `social-temp/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, processedBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Error al subir imagen procesada a Supabase: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName)

  console.log(`[imageUtils] Imagen recortada subida: ${publicUrlData.publicUrl}`)
  return publicUrlData.publicUrl
}
