import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  
  const { data, error } = await supabase.auth.admin.getUserById('7de3c7d9-efd7-42e0-859a-9ae4065e17a3')
  
  return NextResponse.json({ data, error })
}
