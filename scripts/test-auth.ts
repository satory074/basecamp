import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// .env.localから環境変数を読み込む
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL!
const adminPassword = process.env.ADMIN_PASSWORD!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('認証テストを開始...\n')

  // 1. ログインテスト
  console.log('1. ログインテスト:')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  })

  if (authError) {
    console.error('❌ ログインエラー:', authError.message)
    return
  }

  const user = authData.user
  console.log('✅ ログイン成功!')
  console.log('   User ID:', user?.id)
  console.log('   Email:', user?.email)

  // 2. トークン確認
  console.log('\n2. セッショントークン:')
  const { data: { session } } = await supabase.auth.getSession()
  console.log('   Access Token:', session?.access_token?.substring(0, 20) + '...')

  // 3. 投稿テスト
  console.log('\n3. 投稿テスト:')
  const testContent = `テスト投稿 ${new Date().toISOString()}`
  
  const { data: post, error: postError } = await supabase
    .from('microblogs')
    .insert({
      content: testContent,
      tags: ['test'],
      has_code: false,
      user_id: user?.id
    })
    .select()
    .single()

  if (postError) {
    console.error('❌ 投稿エラー:', postError.message)
    console.error('   詳細:', postError)
  } else {
    console.log('✅ 投稿成功!')
    console.log('   Post ID:', post.id)
    console.log('   Content:', post.content)

    // 投稿を削除
    const { error: deleteError } = await supabase
      .from('microblogs')
      .delete()
      .eq('id', post.id)

    if (deleteError) {
      console.error('❌ 削除エラー:', deleteError.message)
    } else {
      console.log('✅ テスト投稿を削除しました')
    }
  }

  // 4. RLSポリシーの確認
  console.log('\n4. 現在のRLSポリシー:')
  const { data: policies, error: policyError } = await supabase
    .rpc('get_policies', { table_name: 'microblogs' })
    .single()

  if (policyError) {
    console.log('   (ポリシー情報の取得にはService Role Keyが必要です)')
  } else {
    console.log(policies)
  }

  // ログアウト
  await supabase.auth.signOut()
  console.log('\n✅ テスト完了')
}

testAuth().catch(console.error)