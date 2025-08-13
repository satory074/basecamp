interface CardSkeletonProps {
    variant?: 'post' | 'widget' | 'stats';
    className?: string;
}

export default function CardSkeleton({ variant = 'post', className = '' }: CardSkeletonProps) {
    if (variant === 'widget') {
        return (
            <div className={`glass-card-enhanced service-card card-padding-mobile p-8 animate-pulse ${className}`}>
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center">
                        <div className="relative p-4 bg-gray-200 dark:bg-gray-700 mr-4 w-16 h-16" />
                        <div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 w-32 mb-2" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 w-24" />
                        </div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 w-20" />
                </div>
                <div className="space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 w-full" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/2" />
                </div>
            </div>
        );
    }

    if (variant === 'stats') {
        return (
            <div className={`text-center p-8 bg-gray-100 dark:bg-gray-800 animate-pulse ${className}`}>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 w-16 mx-auto mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 w-20 mx-auto" />
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 border overflow-hidden shadow-sm h-[120px] md:h-[100px] animate-pulse ${className}`}>
            <div className="flex h-full">
                <div className="w-[100px] h-full flex-shrink-0 relative overflow-hidden bg-gray-200 dark:bg-gray-700" />
                <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700" />
                                <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700" />
                        </div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 mb-2 w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 w-full" />
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                        <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700" />
                        <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700" />
                    </div>
                </div>
            </div>
        </div>
    );
}