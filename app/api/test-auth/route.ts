import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder'

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey
  )
  
  const { data, error } = await supabase.auth.admin.getUserById('7de3c7d9-efd7-42e0-859a-9ae4065e17a3')
  
  return NextResponse.json({ data, error })
}
