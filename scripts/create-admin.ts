import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// .env.localから環境変数を読み込む
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD

if (!supabaseUrl || !supabaseAnonKey || !adminEmail || !adminPassword) {
  console.error('必要な環境変数が設定されていません')
  console.error('以下の環境変数を.env.localに設定してください:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('- NEXT_PUBLIC_ADMIN_EMAIL')
  console.error('- ADMIN_PASSWORD (一時的に設定)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

async function createAdmin() {
  console.log(`管理者ユーザーを作成中: ${adminEmail}`)

  // サインアップ（新規ユーザー作成）
  const { data, error } = await supabase.auth.signUp({
    email: adminEmail!,
    password: adminPassword!,
    options: {
      data: {
        role: 'admin'
      }
    }
  })

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('✓ ユーザーは既に存在します')
      
      // ログインテスト
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail!,
        password: adminPassword!
      })

      if (signInError) {
        console.error('✗ ログインテストに失敗しました:', signInError.message)
        console.log('\nパスワードをリセットする必要があるかもしれません。')
        console.log('Supabaseダッシュボードで「Send password recovery」を実行してください。')
      } else {
        console.log('✓ ログインテスト成功！')
      }
    } else {
      console.error('✗ ユーザー作成エラー:', error.message)
    }
    return
  }

  if (data.user) {
    console.log('✓ 管理者ユーザーを作成しました！')
    console.log(`  Email: ${data.user.email}`)
    console.log(`  ID: ${data.user.id}`)
    console.log('\n次のステップ:')
    console.log('1. Supabaseダッシュボードでメール確認をスキップ（必要な場合）')
    console.log('2. npm run dev でアプリを起動')
    console.log('3. /microblog にアクセスしてログイン')
  }

  // サインアウト
  await supabase.auth.signOut()
}

// 実行
createAdmin().catch(console.error)