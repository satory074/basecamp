"use client";

import { Suspense, ReactNode } from 'react';
import CardSkeleton from './CardSkeleton';
import ErrorBoundary from './ErrorBoundary';
import EmptyState from './EmptyState';

interface AsyncWidgetWrapperProps {
    children: ReactNode;
    skeletonVariant?: 'post' | 'widget' | 'stats';
    className?: string;
    fallback?: ReactNode;
    errorTitle?: string;
    errorDescription?: string;
}

export default function AsyncWidgetWrapper({ 
    children, 
    skeletonVariant = 'widget',
    className = '',
    fallback,
    errorTitle = "データの読み込みに失敗しました",
    errorDescription = "ネットワーク接続を確認して、再度お試しください。"
}: AsyncWidgetWrapperProps) {
    const defaultFallback = (
        <CardSkeleton variant={skeletonVariant} className={className} />
    );

    const errorFallback = (
        <div className={`glass-card-enhanced ${className}`}>
            <EmptyState
                variant="error"
                title={errorTitle}
                description={errorDescription}
                action={
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary text-sm px-4 py-2"
                    >
                        再読み込み
                    </button>
                }
            />
        </div>
    );

    return (
        <ErrorBoundary fallback={errorFallback}>
            <Suspense fallback={fallback || defaultFallback}>
                {children}
            </Suspense>
        </ErrorBoundary>
    );
}