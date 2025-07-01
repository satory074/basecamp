import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getAuthUser } from '@/app/lib/supabase-server'
import { createAdminSupabaseClient } from '@/app/lib/supabase-admin'

// 投稿の取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')

    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('microblogs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // タグでフィルタリング
    if (tag) {
      query = query.contains('tags', [tag])
    }

    // 検索
    if (search) {
      query = query.ilike('content', `%${search}%`)
    }

    const { data: posts, error } = await query

    if (error) throw error

    return NextResponse.json(posts || [])
  } catch (error) {
    console.error('Error fetching microblogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch microblogs' },
      { status: 500 }
    )
  }
}

// 投稿の作成（認証必須）
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content, tags } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // ユーザー認証（開発環境では固定ユーザーIDを使用）
    let userId: string
    
    if (process.env.NODE_ENV === 'development' && !request.headers.get('authorization')) {
      // 開発環境で認証ヘッダーがない場合は固定ID
      userId = '00000000-0000-0000-0000-000000000000'
      console.log('Development mode: Using fixed user ID')
    } else {
      // 本番環境または認証ヘッダーがある場合
      const { user, error: authError } = await getAuthUser(request)
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized: ' + (authError || 'No user') },
          { status: 401 }
        )
      }
      userId = user.id
    }

    // コードブロックの検出
    const hasCode = /```[\s\S]*?```/.test(content)

    // タグの抽出（#から始まる単語）
    const extractedTags = content.match(/#[^\s#]+/g) || []
    const allTags = [...new Set([...extractedTags.map(t => t.slice(1)), ...(tags || [])])]

    // 投稿の作成
    try {
      // Service Role Keyがある場合は使用、なければ通常のクライアント
      const supabaseClient = process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? createAdminSupabaseClient() 
        : await createServerSupabaseClient()
      
      const { data: post, error } = await supabaseClient
        .from('microblogs')
        .insert({
          content,
          tags: allTags,
          has_code: hasCode,
          user_id: userId
        })
        .select()
        .single()

      if (error) throw error

      // タグテーブルの更新
      for (const tagName of allTags) {
        await supabaseClient
          .from('tags')
          .upsert({ name: tagName }, { onConflict: 'name' })
      }
      
      return NextResponse.json(post)
    } catch (dbError: any) {
      // RLSエラーの場合の詳細なメッセージ
      if (dbError.message?.includes('row-level security')) {
        console.error('RLS Policy Error. Please run fix-rls-policy.sql in Supabase')
        throw new Error('データベースのセキュリティ設定を更新してください。')
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error creating microblog:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create microblog',
        details: error.message || error.toString(),
        code: error.code
      },
      { status: 500 }
    )
  }
}