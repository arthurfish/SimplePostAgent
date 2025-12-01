import React from 'react';

type ButtonProps = React.ComponentProps<'button'>;

export const Button = ({ className, ...props }: ButtonProps) => {
    return (
        <button
            className={`px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className}`}
            {...props}
        />
    );
};