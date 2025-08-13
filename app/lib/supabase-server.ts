import { createClient } from '@supabase/supabase-js'

export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing')
  }

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
  } catch {
    return { user: null, error: 'Invalid token' }
  }
}