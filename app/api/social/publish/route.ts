import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publishProductToZernio } from '@/lib/zernio'
import type { Product } from '@/lib/types'

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

    // Inicializa Supabase Client con service key para actualizar social_posted pasando RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Consultar el estado de social_posted en la base de datos
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 })
    }

    const typedProduct = product as Product

    if (typedProduct.social_posted) {
      return NextResponse.json({ skipped: true, reason: 'already_published' }, { status: 200 })
    }

    // Publicar usando el SDK de Zernio
    await publishProductToZernio(typedProduct)

    // Actualizar el estado en base de datos si la publicación fue exitosa
    const { error: updateError } = await supabase
      .from('products')
      .update({ social_posted: true })
      .eq('id', productId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
