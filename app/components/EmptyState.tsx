import { ReactNode } from 'react';
import { DocumentIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    variant?: 'default' | 'error' | 'warning';
}

export default function EmptyState({ 
    icon, 
    title, 
    description, 
    action, 
    variant = 'default' 
}: EmptyStateProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'error':
                return {
                    iconBg: 'bg-red-100 dark:bg-red-900/30',
                    iconColor: 'text-red-600 dark:text-red-400',
                    defaultIcon: <ExclamationCircleIcon className="h-8 w-8" />
                };
            case 'warning':
                return {
                    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    iconColor: 'text-yellow-600 dark:text-yellow-400',
                    defaultIcon: <ExclamationCircleIcon className="h-8 w-8" />
                };
            default:
                return {
                    iconBg: 'bg-gray-100 dark:bg-gray-800',
                    iconColor: 'text-gray-600 dark:text-gray-400',
                    defaultIcon: <DocumentIcon className="h-8 w-8" />
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className={`p-4 rounded-full mb-4 ${styles.iconBg}`}>
                <div className={styles.iconColor}>
                    {icon || styles.defaultIcon}
                </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            
            {description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 max-w-md">
                    {description}
                </p>
            )}
            
            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
}