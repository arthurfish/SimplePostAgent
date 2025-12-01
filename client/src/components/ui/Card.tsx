import React from 'react';

type CardProps = React.ComponentProps<'div'>;

export const Card = ({ className, children, ...props }: CardProps) => {
    return (
        <div
            className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};