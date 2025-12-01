import React from 'react';

type InputProps = React.ComponentProps<'input'>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";