import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publishProductToZernio } from '@/lib/zernio'
import type { Product } from '@/lib/types'
import Zernio from '@zernio/node'

export async function POST(request: Request) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'productId es requerido.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'service_role_key_de_supabase') {
      return NextResponse.json({ error: 'Faltan credenciales de Supabase (Service Key válida).' }, { status: 500 })
    }

    // Inicializa Supabase Client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Consultar el estado de social_posted en la base de datos
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado.', details: productError }, { status: 404 })
    }

    const typedProduct = product as Product

    if (typedProduct.social_posted) {
      return NextResponse.json({ skipped: true, reason: 'already_published' }, { status: 200 })
    }

    // Publicar usando el SDK de Zernio
    const postId = await publishProductToZernio(typedProduct)

    if (!postId) {
      throw new Error('No se pudo obtener el ID del post de Zernio.')
    }

    // Polling del estado de las plataformas
    const zernio = new Zernio()
    let attempts = 0
    const maxAttempts = 5 // 5 intentos * 2 segundos = 10 segundos máx
    let finalPost: any = null

    while (attempts < maxAttempts) {
      const { data } = await zernio.posts.getPost({
        path: { postId }
      })

      const platforms = data?.post?.platforms || []
      const allDone = platforms.length > 0 && platforms.every((p: any) =>
        p.status === 'published' || p.status === 'failed'
      )

      if (allDone) {
        finalPost = data?.post
        break
      }

      attempts++
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    if (!finalPost) {
      const { data } = await zernio.posts.getPost({
        path: { postId }
      })
      finalPost = data?.post
    }

    const platforms = finalPost?.platforms || []
    
    // Si TODAS las plataformas fueron publicadas exitosamente, actualizamos social_posted
    const socialPostedValue = platforms.length > 0 && platforms.every((p: any) => p.status === 'published')
    
    if (socialPostedValue) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ social_posted: true })
        .eq('id', productId)

      if (updateError) {
        throw updateError
      }
    }

    const platformsSummary = platforms.map((p: any) => ({
      platform: p.platform,
      status: p.status,
      url: p.platformPostUrl || null,
      id: p.platformPostId || null
    }))

    return NextResponse.json({
      social_posted: socialPostedValue,
      platforms: platformsSummary
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
