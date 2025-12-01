
type SpinnerProps = {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
};

export const Spinner = ({ size = 'md', className }: SpinnerProps) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <div
            className={`animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
            role="status"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
};