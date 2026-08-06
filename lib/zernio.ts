import type { Product } from './types'
import { ensureInstagramSafeImage } from './imageUtils'

const ZERNIO_BASE_URL = 'https://api.zernio.com/v1'

// IDs de las cuentas conectadas en el dashboard de Zernio.
const ZERNIO_FACEBOOK_ACCOUNT_ID = process.env.ZERNIO_FACEBOOK_ACCOUNT_ID ?? ''
const ZERNIO_INSTAGRAM_ACCOUNT_ID = process.env.ZERNIO_INSTAGRAM_ACCOUNT_ID ?? ''

function getZernioHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${process.env.ZERNIO_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Formatea un número como precio en pesos colombianos (COP).
 */
function formatPriceCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calcula el porcentaje de descuento entre el precio comparado y el precio actual.
 */
function calcDiscountPercent(comparePrice: number, salePrice: number): number {
  return Math.round(((comparePrice - salePrice) / comparePrice) * 100)
}

/**
 * Arma el texto del post a partir de los datos del producto.
 */
function buildPostContent(product: Product): string {
  const { name, price, compare_price, slug } = product

  const priceFormatted = formatPriceCOP(price)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://variedades-melissa.vercel.app')
    .replace(/\/$/, '')
  const productUrl = `${siteUrl}/producto/${slug}`

  let priceBlock: string
  if (compare_price && compare_price > price) {
    const comparePriceFormatted = formatPriceCOP(compare_price)
    const discountPercent = calcDiscountPercent(compare_price, price)
    priceBlock = `Antes ${comparePriceFormatted}, ahora ${priceFormatted} (${discountPercent}% OFF) \u{1F3F7}`
  } else {
    priceBlock = priceFormatted
  }

  return [
    `\u{2728} ${name}`,
    '',
    `\u{1F4B0} ${priceBlock}`,
    '',
    `\u{1F6D2} Disponible en Variedades Melissa:`,
    productUrl,
    '',
    `\u{1F4AC} Escríbenos por WhatsApp: https://wa.me/573233292168`,
  ].join('\n')
}

/**
 * Obtiene el estado de un post de Zernio por su ID.
 */
export async function getZernioPost(postId: string): Promise<any> {
  const res = await fetch(`${ZERNIO_BASE_URL}/posts/${postId}`, {
    method: 'GET',
    headers: getZernioHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Zernio getPost error: ${err?.message ?? res.statusText}`)
  }
  return res.json()
}

/**
 * Elimina un post de Zernio por su ID.
 */
export async function deleteZernioPost(postId: string): Promise<void> {
  const res = await fetch(`${ZERNIO_BASE_URL}/posts/${postId}`, {
    method: 'DELETE',
    headers: getZernioHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Zernio deletePost error: ${err?.message ?? res.statusText}`)
  }
}

/**
 * Publica un producto en Facebook e Instagram a través de la API REST de Zernio.
 *
 * Requiere que el producto tenga al menos una imagen en el arreglo `images`.
 * Si no hay imágenes, lanza un Error explícito sin publicar.
 *
 * @param product - Producto con su forma completa definida en lib/types.ts
 */
export async function publishProductToZernio(product: Product): Promise<string> {
  if (!product.images || product.images.length === 0) {
    throw new Error(
      `El producto "${product.name}" no tiene imágenes. No se puede publicar en redes sociales.`
    )
  }

  const content = buildPostContent(product)

  // Asegurar que todas las imágenes cumplen el ratio de Instagram (0.8–1.91)
  const imageUrls = await Promise.all(
    product.images.map((img) => ensureInstagramSafeImage(img))
  )

  const body = {
    content,
    mediaItems: imageUrls.map((url) => ({ type: 'image', url })),
    platforms: [
      { platform: 'facebook', accountId: ZERNIO_FACEBOOK_ACCOUNT_ID },
      { platform: 'instagram', accountId: ZERNIO_INSTAGRAM_ACCOUNT_ID },
    ],
    publishNow: true,
  }

  const res = await fetch(`${ZERNIO_BASE_URL}/posts`, {
    method: 'POST',
    headers: getZernioHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Zernio createPost error: ${err?.message ?? res.statusText}`)
  }

  const data = await res.json()
  const postId: string = data?.post?._id || ''

  console.log('[Zernio] Post publicado exitosamente:', data?.post)
  return postId
}
