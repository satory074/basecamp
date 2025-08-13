import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import type { Post } from '@/app/lib/types'

// UnifiedFeed用のマイクロブログ投稿取得（Post形式に変換）
export async function GET() {
  // 環境変数チェック
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
  
  try {
    const { data: microblogs, error } = await supabase
      .from('microblogs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Post形式に変換
    const posts: Post[] = (microblogs || []).map(blog => ({
      id: `microblog-${blog.id}`,
      title: blog.content.split('\n')[0].slice(0, 50) + (blog.content.length > 50 ? '...' : ''),
      url: `/microblog#${blog.id}`,
      date: blog.created_at,
      platform: 'microblog' as const,
      description: blog.content,
      data: {
        tags: blog.tags,
        hasCode: blog.has_code
      }
    }))

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching microblogs for feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch microblogs' },
      { status: 500 }
    )
  }
}