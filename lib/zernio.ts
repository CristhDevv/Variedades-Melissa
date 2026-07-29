import Zernio from '@zernio/node'
import type { Product } from './types'

// El cliente se inicializa perezosamente dentro de la función de publicación para evitar
// errores de inicialización en tiempo de compilación cuando la API Key está vacía.

// IDs de las cuentas conectadas en el dashboard de Zernio.
// Se deben completar con los valores reales una vez que las cuentas estén vinculadas.
const ZERNIO_FACEBOOK_ACCOUNT_ID = process.env.ZERNIO_FACEBOOK_ACCOUNT_ID ?? ''
const ZERNIO_INSTAGRAM_ACCOUNT_ID = process.env.ZERNIO_INSTAGRAM_ACCOUNT_ID ?? ''

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
  const { name, price, compare_price } = product

  const priceFormatted = formatPriceCOP(price)

  let priceBlock: string
  if (compare_price && compare_price > price) {
    const comparePriceFormatted = formatPriceCOP(compare_price)
    const discountPercent = calcDiscountPercent(compare_price, price)
    priceBlock = `Antes ${comparePriceFormatted}, ahora ${priceFormatted} (${discountPercent}% OFF) 🏷️`
  } else {
    priceBlock = priceFormatted
  }

  return [
    `✨ ${name}`,
    '',
    `💰 ${priceBlock}`,
    '',
    'Disponible ahora en Variedades Melissa 🛍️',
  ].join('\n')
}

/**
 * Publica un producto en Facebook e Instagram a través de Zernio.
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

  const zernio = new Zernio()
  const content = buildPostContent(product)
  const imageUrl = product.images[0]

  const { data: post } = await zernio.posts.createPost({
    body: {
      content,
      mediaItems: [
        {
          type: 'image',
          url: imageUrl,
        },
      ],
      platforms: [
        {
          platform: 'facebook',
          accountId: ZERNIO_FACEBOOK_ACCOUNT_ID,
        },
        {
          platform: 'instagram',
          accountId: ZERNIO_INSTAGRAM_ACCOUNT_ID,
        },
      ],
      publishNow: true,
    },
  })

  console.log('[Zernio] Post publicado exitosamente:', post)
  return post?.post?._id || ''
}
