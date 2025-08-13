'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          エラーが発生しました
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
          >
            もう一度試す
          </button>
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            ホームに戻る
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            エラーID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}