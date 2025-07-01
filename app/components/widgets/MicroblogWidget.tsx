'use client'

import { useState, useEffect } from 'react'
import BaseWidget from './BaseWidget'
import MicroblogIcon from '../icons/MicroblogIcon'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { MicroblogPost } from '@/app/lib/supabase'

export default function MicroblogWidget() {
  const [posts, setPosts] = useState<MicroblogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentPosts()
  }, [])

  const fetchRecentPosts = async () => {
    try {
      const response = await fetch('/api/microblog?limit=3')
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('Error fetching microblogs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <BaseWidget
      title="マイクロブログ"
      icon={<MicroblogIcon className="w-5 h-5 text-blue-500" />}
      link="/microblog"
      username="@satory074"
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          まだ投稿がありません
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
              <time className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(post.created_at), 'M月d日 HH:mm', { locale: ja })}
              </time>
              <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="inline">{children}</p>,
                    code: ({ children }) => (
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => <span>{children}</span>
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
              {post.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <Link
            href="/microblog"
            className="block text-center text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 pt-2"
          >
            すべての投稿を見る →
          </Link>
        </div>
      )}
    </BaseWidget>
  )
}