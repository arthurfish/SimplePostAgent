// src/components/requests/RequestList.tsx
import { useLiveRequests } from "../../hooks/useLiveQueries";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { StatusBadge } from "../ui/StatusBadge";
import { Link } from "react-router-dom";

export const RequestList = () => {
    const { data: requests, isLoading, error } = useLiveRequests();

    if (isLoading) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    if (error) {
        return <p className="text-red-500">Failed to load requests. Please try again later.</p>
    }

    if (requests.length === 0) {
        return <p>No requests found. Create one to get started!</p>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((req) => (
                <Link to={`/request/${req.id}`} key={req.id}>
                    <Card className="hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-gray-500">{new Date(req.created_at).toLocaleString()}</p>
                            <StatusBadge status={req.status} />
                        </div>
                        <p className="font-medium truncate">{req.user_input}</p>
                    </Card>
                </Link>
            ))}
        </div>
    );
};