import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'productId es requerido.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Faltan credenciales de Supabase (Service Key).' }, { status: 500 })
    }

    // Initialize Supabase Client with service key to bypass RLS policies
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const productUrl = `${siteUrl}/producto/${product.slug}`
    
    // Format price
    const formattedPrice = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(product.price)

    // Format post message
    const message = `✨ ¡Nuevo Ingreso en Variedades Melissa! ✨\n\n🛍️ ${product.name}\n💵 Precio: ${formattedPrice}\n\n📝 ${product.description || 'Sin descripción disponible'}\n\n👉 Cómpralo hoy mismo aquí: ${productUrl}`

    const pageId = process.env.META_PAGE_ID
    const instagramId = process.env.META_INSTAGRAM_ID
    const accessToken = process.env.META_ACCESS_TOKEN

    const results = {
      facebook: { success: false, id: null as string | null, error: null as string | null },
      instagram: { success: false, id: null as string | null, error: null as string | null }
    }

    let hasSucceeded = false

    // Meta Page / Instagram token verification helper
    const hasMetaConfig = accessToken && accessToken !== 'placeholder_meta' && accessToken !== 'tu_token'

    // 1. Publish to Facebook Page
    if (hasMetaConfig && pageId && pageId !== 'placeholder_page' && pageId !== 'tu_page_id') {
      try {
        const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            link: productUrl,
            access_token: accessToken
          })
        })

        const fbData = await fbResponse.json()

        if (fbResponse.ok && fbData.id) {
          results.facebook.success = true
          results.facebook.id = fbData.id
          hasSucceeded = true
        } else {
          results.facebook.error = fbData.error?.message || JSON.stringify(fbData)
        }
      } catch (err: any) {
        results.facebook.error = err.message || 'Error de red en Facebook'
      }
    } else {
      results.facebook.error = 'Configuración de Facebook omitida o incompleta (Meta Page ID o Token faltante).'
    }

    // 2. Publish to Instagram Business
    if (hasMetaConfig && instagramId && instagramId !== 'placeholder_instagram' && instagramId !== 'tu_instagram_id') {
      try {
        // Instagram requires an image URL
        const imageUrl = product.images?.[0] || 'https://via.placeholder.com/600x600.png?text=Variedades+Melissa'

        // Step A: Create media container
        const containerResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: message,
            access_token: accessToken
          })
        })

        const containerData = await containerResponse.json()

        if (containerResponse.ok && containerData.id) {
          const creationId = containerData.id

          // Step B: Publish media container
          const publishResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: creationId,
              access_token: accessToken
            })
          })

          const publishData = await publishResponse.json()

          if (publishResponse.ok && publishData.id) {
            results.instagram.success = true
            results.instagram.id = publishData.id
            hasSucceeded = true
          } else {
            results.instagram.error = publishData.error?.message || JSON.stringify(publishData)
          }
        } else {
          results.instagram.error = containerData.error?.message || JSON.stringify(containerData)
        }
      } catch (err: any) {
        results.instagram.error = err.message || 'Error de red en Instagram'
      }
    } else {
      results.instagram.error = 'Configuración de Instagram omitida o incompleta (Instagram ID o Token faltante).'
    }

    // Update social_posted in products if at least one publish succeeded
    if (hasSucceeded) {
      await supabase
        .from('products')
        .update({ social_posted: true })
        .eq('id', productId)
    }

    return NextResponse.json({
      success: hasSucceeded,
      results
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
