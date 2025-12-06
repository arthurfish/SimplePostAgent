import React from 'react';

type ButtonProps = React.ComponentProps<'button'>;

export const Button = ({ className, ...props }: ButtonProps) => {
    return (
        <button
            className={`px-4 py-2 text-white rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
            {...props}
        />
    );
};