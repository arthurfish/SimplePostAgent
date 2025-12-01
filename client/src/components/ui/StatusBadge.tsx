
type Status = "pending" | "processing" | "aggregating" | "completed" | "failed";

type StatusBadgeProps = {
    status: Status;
    className?: string;
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
    const statusStyles: Record<Status, string> = {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 animate-pulse",
        aggregating: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 animate-pulse",
        completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]} ${className}`}
        >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
    );
};