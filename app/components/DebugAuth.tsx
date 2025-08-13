'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabaseクライアントを動的に作成
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export default function DebugAuth() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const testGoogleLogin = async () => {
    const supabase = createSupabaseClient()
    
    if (!supabase) {
      setMessage('Supabase設定が利用できません')
      return
    }
    
    setLoading(true)
    setMessage('Google認証を開始...')
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setMessage(`エラー: ${error.message}`)
        console.error('OAuth Error:', error)
      } else {
        setMessage('リダイレクト中...')
        console.log('OAuth Success:', data)
      }
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : String(err)}`)
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkSupabaseConnection = async () => {
    const supabase = createSupabaseClient()
    
    if (!supabase) {
      setMessage('Supabase設定が利用できません')
      return
    }
    
    setMessage('Supabase接続を確認中...')
    
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setMessage(`接続エラー: ${error.message}`)
      } else {
        setMessage(`接続OK! セッション: ${data.session ? 'あり' : 'なし'}`)
      }
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm">
      <h3 className="font-bold mb-2">デバッグツール</h3>
      
      <div className="space-y-2">
        <button
          onClick={checkSupabaseConnection}
          className="w-full px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          Supabase接続確認
        </button>
        
        <button
          onClick={testGoogleLogin}
          disabled={loading}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '処理中...' : 'Google認証テスト'}
        </button>
      </div>
      
      {message && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          {message}
        </div>
      )}
    </div>
  )
}