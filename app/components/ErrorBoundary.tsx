"use client";

import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="glass-card-enhanced p-8 text-center">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-red-100 dark:bg-red-900/30">
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                コンテンツの読み込みに失敗しました
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                申し訳ございませんが、一時的な問題が発生しています。
                            </p>
                            <button
                                onClick={() => this.setState({ hasError: false, error: undefined })}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
                            >
                                <ArrowPathIcon className="h-4 w-4 mr-2" />
                                再試行
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}