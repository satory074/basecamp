import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function getAuthUser(request: Request) {
  const supabase = await createServerSupabaseClient()
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'No authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    return { user, error }
  } catch (error) {
    return { user: null, error: 'Invalid token' }
  }
}