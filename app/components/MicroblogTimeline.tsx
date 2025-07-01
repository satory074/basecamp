'use client'

import { useState, useEffect } from 'react'
import MicroblogPost from './MicroblogPost'
import type { MicroblogPost as MicroblogPostType } from '@/app/lib/supabase'
import { supabase } from '@/app/lib/supabase'

interface MicroblogTimelineProps {
  initialPosts?: MicroblogPostType[]
  tag?: string
  search?: string
}

export default function MicroblogTimeline({ 
  initialPosts = [], 
  tag, 
  search 
}: MicroblogTimelineProps) {
  const [posts, setPosts] = useState<MicroblogPostType[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(initialPosts.length)

  const fetchPosts = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return

    setLoading(true)
    const currentOffset = reset ? 0 : offset

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: currentOffset.toString()
      })
      
      if (tag) params.append('tag', tag)
      if (search) params.append('search', search)

      const response = await fetch(`/api/microblog?${params}`)
      const newPosts = await response.json()

      if (reset) {
        setPosts(newPosts)
        setOffset(newPosts.length)
      } else {
        setPosts(prev => [...prev, ...newPosts])
        setOffset(prev => prev + newPosts.length)
      }

      setHasMore(newPosts.length === 20)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = () => {
    fetchPosts(true)
  }

  const handleDelete = () => {
    fetchPosts(true)
  }

  // 初回ロードとリアルタイム更新の設定
  useEffect(() => {
    // 初回ロード
    fetchPosts(true)
    
    // リアルタイム更新
    const channel = supabase
      .channel('microblogs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'microblogs' },
        () => {
          fetchPosts(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tag, search, fetchPosts])

  // 無限スクロール
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        fetchPosts()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loading, offset, fetchPosts])

  return (
    <div className="space-y-4">
      {posts.length === 0 && !loading && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          まだ投稿がありません
        </p>
      )}

      {posts.map((post) => (
        <MicroblogPost
          key={post.id}
          post={post}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          すべての投稿を表示しました
        </p>
      )}
    </div>
  )
}