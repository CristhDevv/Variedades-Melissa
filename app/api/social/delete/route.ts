import { NextResponse } from 'next/server'
import Zernio from '@zernio/node'

export async function POST(request: Request) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: 'postId es requerido.' }, { status: 400 })
    }

    const zernio = new Zernio({ apiKey: process.env.ZERNIO_API_KEY })

    // 1. Fetch post details to retrieve Instagram URL
    let instagramUrl: string | null = null
    try {
      const { data: postData } = await zernio.posts.getPost({
        path: { postId }
      })
      const instagramPlatform = postData?.post?.platforms?.find((p: any) => p.platform === 'instagram')
      instagramUrl = instagramPlatform?.platformPostUrl || instagramPlatform?.url || null
    } catch (getErr: any) {
      console.error('[/api/social/delete] Error al obtener detalles de post:', getErr?.message)
    }

    // 2. Unpublish Facebook and delete the post record
    let deleteSuccess = false
    try {
      await zernio.posts.unpublishPost({
        path: { postId },
        body: { platform: 'facebook' }
      })
      await zernio.posts.deletePost({
        path: { postId }
      })
      deleteSuccess = true
    } catch (deleteErr: any) {
      console.error('[/api/social/delete] Error en unpublish/delete:', deleteErr?.message)
    }

    return NextResponse.json({
      success: deleteSuccess,
      instagram_manual_delete_required: true,
      instagram_url: instagramUrl,
      message: 'El post de Facebook se ha despublicado y eliminado. Sin embargo, Instagram no admite la eliminación automatizada mediante API; debe eliminar el post de Instagram manualmente.'
    }, { status: 200 })

  } catch (error: any) {
    console.error('[/api/social/delete] ERROR general:', error?.message, error?.stack)
    return NextResponse.json({ error: error.message || 'Error interno al eliminar el post.' }, { status: 500 })
  }
}

