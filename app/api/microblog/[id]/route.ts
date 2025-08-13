import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// 個別投稿の取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // 環境変数チェック
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
  
  try {
    const { data: post, error } = await supabase
      .from('microblogs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching microblog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch microblog' },
      { status: 500 }
    )
  }
}

// 投稿の更新（認証必須）
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // 環境変数チェック
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
  
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, tags } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // コードブロックの検出
    const hasCode = /```[\s\S]*?```/.test(content)

    // タグの抽出
    const extractedTags = content.match(/#[^\s#]+/g) || []
    const allTags = [...new Set([...extractedTags.map((t: string) => t.slice(1)), ...(tags || [])])]

    // ユーザーIDの取得と権限確認
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 投稿の更新
    const { data: post, error } = await supabase
      .from('microblogs')
      .update({
        content,
        tags: allTags,
        has_code: hasCode
      })
      .eq('id', id)
      .eq('user_id', user.id) // 自分の投稿のみ更新可能
      .select()
      .single()

    if (error) throw error

    if (!post) {
      return NextResponse.json(
        { error: 'Unauthorized or post not found' },
        { status: 403 }
      )
    }

    // タグテーブルの更新
    for (const tagName of allTags) {
      await supabase
        .from('tags')
        .upsert({ name: tagName }, { onConflict: 'name' })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating microblog:', error)
    return NextResponse.json(
      { error: 'Failed to update microblog' },
      { status: 500 }
    )
  }
}

// 投稿の削除（認証必須）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // 環境変数チェック
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
  
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ユーザーIDの取得と権限確認
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 投稿の削除
    const { error } = await supabase
      .from('microblogs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // 自分の投稿のみ削除可能

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting microblog:', error)
    return NextResponse.json(
      { error: 'Failed to delete microblog' },
      { status: 500 }
    )
  }
}