import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// タグ一覧の取得
export async function GET() {
  try {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(tags || [])
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}