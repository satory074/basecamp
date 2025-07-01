'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext'
import MicroblogEditor from '@/app/components/MicroblogEditor'
import MicroblogTimeline from '@/app/components/MicroblogTimeline'
import AuthModal from '@/app/components/AuthModal'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import toast, { Toaster } from 'react-hot-toast'
import DebugAuth from '@/app/components/DebugAuth'

function MicroblogContent() {
  const searchParams = useSearchParams()
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')
  const { user, loading: authLoading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleNewPost = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            ホームに戻る
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            マイクロブログ
          </h1>
          
          {(tag || search) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {tag ? `#${tag} の投稿` : `"${search}" の検索結果`}
              </span>
              <Link
                href="/microblog"
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                すべて表示
              </Link>
            </div>
          )}
        </header>

        {!authLoading && (
          <>
            {/* 開発環境では認証不要で投稿可能 */}
            {user || process.env.NODE_ENV === 'development' ? (
              <div className="mb-6">
                <MicroblogEditor onSubmit={handleNewPost} />
                {!user && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    開発モード：認証なしで投稿できます
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  投稿するにはログインが必要です
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ログイン
                </button>
              </div>
            )}
          </>
        )}

        <MicroblogTimeline key={refreshKey} tag={tag || undefined} search={search || undefined} />

        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
        
        <DebugAuth />
      </div>
    </div>
  )
}

export default function MicroblogPage() {
  return (
    <AuthProvider>
      <MicroblogContent />
    </AuthProvider>
  )
}