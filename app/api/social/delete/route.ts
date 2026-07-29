import { NextResponse } from 'next/server'
import Zernio from '@zernio/node'

export async function POST(request: Request) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: 'postId es requerido.' }, { status: 400 })
    }

    const zernio = new Zernio()
    const { data } = await zernio.posts.deletePost({
      path: { postId }
    })

    return NextResponse.json({ success: true, details: data }, { status: 200 })

  } catch (error: any) {
    console.error('[/api/social/delete] ERROR:', error?.message, error?.stack)
    return NextResponse.json({ error: error.message || 'Error interno al eliminar el post.' }, { status: 500 })
  }
}
