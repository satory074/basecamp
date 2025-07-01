'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/app/contexts/AuthContext'
import { supabase } from '@/app/lib/supabase'
import toast from 'react-hot-toast'
import { XIcon, DiscordIcon } from '@/app/components/icons'
import type { MicroblogPost as MicroblogPostType } from '@/app/lib/supabase'

interface MicroblogPostProps {
  post: MicroblogPostType
  onUpdate: () => void
  onDelete: () => void
}

export default function MicroblogPost({ post, onUpdate, onDelete }: MicroblogPostProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const { user } = useAuth()
  const isOwner = user?.id === post.user_id

  const handleDelete = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/microblog/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }

      toast.success('削除しました')
      onDelete()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('削除に失敗しました')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('コピーしました')
  }

  const shareToX = () => {
    const url = `${window.location.origin}/microblog#${post.id}`
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`
    window.open(shareUrl, '_blank', 'width=550,height=420')
  }

  const shareToDiscord = () => {
    const text = post.content
    navigator.clipboard.writeText(text)
    toast.success('投稿内容をコピーしました。Discordに貼り付けてください')
  }

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <time className="text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(post.created_at), 'yyyy年M月d日 HH:mm', { locale: ja })}
        </time>
        
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              編集
            </button>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              削除
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mb-3">
          <MicroblogEditor
            initialContent={post.content}
            postId={post.id}
            onSubmit={() => {
              setIsEditing(false)
              onUpdate()
            }}
          />
        </div>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const lang = match ? match[1] : ''
                const codeString = String(children).replace(/\n$/, '')

                return !inline && match ? (
                  <div className="relative group">
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={lang}
                      PreTag="div"
                      className="!bg-gray-900 rounded-md !text-sm"
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                    <button
                      onClick={() => copyCode(codeString)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <a
              key={tag}
              href={`/microblog?tag=${encodeURIComponent(tag)}`}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              #{tag}
            </a>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 border-t dark:border-gray-700 pt-3">
        <button
          onClick={shareToX}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Xでシェア"
        >
          <XIcon size={16} />
          <span>Xでシェア</span>
        </button>
        <button
          onClick={shareToDiscord}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Discordにコピー"
        >
          <DiscordIcon size={16} />
          <span>Discordにコピー</span>
        </button>
      </div>

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-semibold mb-4">本当に削除しますか？</h3>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  handleDelete()
                  setShowConfirmDelete(false)
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

// MicroblogEditorのインポート（循環参照を避けるため動的インポート）
import dynamic from 'next/dynamic'
const MicroblogEditor = dynamic(() => import('./MicroblogEditor'), { ssr: false })