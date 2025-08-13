import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// .env.localから環境変数を読み込む
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSupabase() {
  console.log('Supabaseの接続状態を確認中...\n')

  // 1. テーブルの存在確認
  console.log('1. テーブルの確認:')
  try {
    const { data: microblogs, error: microblogsError } = await supabase
      .from('microblogs')
      .select('*')
      .limit(1)

    if (microblogsError) {
      console.error('❌ microblogsテーブルエラー:', microblogsError.message)
    } else {
      console.log('✅ microblogsテーブル: OK')
    }

    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .limit(1)

    if (tagsError) {
      console.error('❌ tagsテーブルエラー:', tagsError.message)
    } else {
      console.log('✅ tagsテーブル: OK')
    }
  } catch (error) {
    console.error('テーブル確認エラー:', error)
  }

  // 2. 認証状態の確認
  console.log('\n2. 認証の確認:')
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('❌ 認証エラー:', error.message)
    } else if (session) {
      console.log('✅ セッションあり:', session.user?.email)
    } else {
      console.log('⚠️  現在ログインしていません')
    }
  } catch (error) {
    console.error('認証確認エラー:', error)
  }

  // 3. RLSポリシーのテスト
  console.log('\n3. RLSポリシーのテスト:')
  try {
    // 読み取りテスト
    const { data: readTest, error: readError } = await supabase
      .from('microblogs')
      .select('*')
      .limit(5)

    if (readError) {
      console.error('❌ 読み取りエラー:', readError.message)
    } else {
      console.log(`✅ 読み取り: OK (${readTest?.length || 0}件の投稿)`);
    }
  } catch (error) {
    console.error('RLSテストエラー:', error)
  }

  // 4. 環境変数の確認
  console.log('\n4. 環境変数:')
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl?.substring(0, 30)}...`)
  console.log(`NEXT_PUBLIC_ADMIN_EMAIL: ${process.env.NEXT_PUBLIC_ADMIN_EMAIL || '未設定'}`)
}

checkSupabase().catch(console.error)