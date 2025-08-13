export default function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="my-8">
            <div className="grid gap-4">
                {Array.from({ length: rows }).map((_, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-gray-800 border overflow-hidden shadow-sm h-[120px] md:h-[100px] animate-pulse"
                    >
                        <div className="flex h-full">
                            {/* サムネイル部分のスケルトン */}
                            <div className="w-[100px] h-full flex-shrink-0 relative overflow-hidden bg-gray-200 dark:bg-gray-700" />
                            
                            {/* コンテンツ部分のスケルトン */}
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
                ))}
            </div>
        </div>
    );
}