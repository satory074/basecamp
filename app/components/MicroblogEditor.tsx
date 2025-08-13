'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

// Supabaseクライアントを動的に作成
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

interface MicroblogEditorProps {
  onSubmit: () => void
  initialContent?: string
  postId?: string
}

export default function MicroblogEditor({ 
  onSubmit, 
  initialContent = '', 
  postId 
}: MicroblogEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return
    if (!user) {
      toast.error('ログインが必要です')
      return
    }

    const supabase = createSupabaseClient()
    
    if (!supabase) {
      toast.error('サービスが利用できません')
      return
    }

    setIsSubmitting(true)

    try {
      const url = postId 
        ? `/api/microblog/${postId}`
        : '/api/microblog'
      
      const method = postId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', response.status, errorData)
        if (errorData.details) {
          console.error('Error details:', errorData.details)
        }
        throw new Error(errorData.error || `投稿に失敗しました (${response.status})`)
      }

      toast.success(postId ? '更新しました' : '投稿しました')
      setContent('')
      onSubmit()
    } catch (error) {
      console.error('Error posting:', error)
      toast.error('投稿に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const insertCodeBlock = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selectedText = text.substring(start, end)
    
    const codeBlock = selectedText 
      ? `\n\`\`\`\n${selectedText}\n\`\`\`\n`
      : '\n```javascript\n// ここにコードを書く\n```\n'
    
    const newText = text.substring(0, start) + codeBlock + text.substring(end)
    setContent(newText)
    
    // カーソル位置を調整
    setTimeout(() => {
      if (selectedText) {
        textarea.selectionStart = textarea.selectionEnd = start + codeBlock.length
      } else {
        textarea.selectionStart = start + 15 // ```javascript\n の後
        textarea.selectionEnd = start + 30 // // ここにコードを書く の後
      }
      textarea.focus()
    }, 0)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="mb-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="何か書いてみましょう... (Cmd/Ctrl + Enter で投稿)"
          className="w-full px-3 py-2 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={insertCodeBlock}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            title="コードブロックを挿入"
          >
            {'</>'}
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
            Markdownが使えます
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-sm ${content.length > 500 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {content.length} / 500
          </span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting || content.length > 500}
            className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '送信中...' : (postId ? '更新' : '投稿')}
          </button>
        </div>
      </div>
    </div>
  )
}