// src/components/requests/RequestList.tsx
import { useLiveRequests } from "../../hooks/useLiveQueries";
import { Spinner } from "../ui/Spinner";
import { Link } from "react-router-dom";

// Rotating Refresh Icon for In Progress Card
const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-white" style={{ animationDuration: '3s' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);

const getCardStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') {
        return {
            gradient: 'bg-gradient-to-br from-[#6AC6BD] to-[#439E98]',
            textColor: 'text-white',
            subTextColor: 'text-white/90',
            tabs: (
                <div className="absolute -top-1.5 left-10 w-24 h-4 bg-[#0F3F35] z-0"></div>
            )
        };
    }
    if (s === 'in progress') {
        return {
            gradient: 'bg-gradient-to-br from-[#D98C85] to-[#C64D48]',
            textColor: 'text-white',
            subTextColor: 'text-white/90',
            tabs: (
                <>
                    <div className="absolute top-10 -left-1.5 w-3 h-16 bg-[#993333] rounded-l-sm z-0"></div>
                    <div className="absolute bottom-10 -right-1.5 w-3 h-16 bg-[#993333] rounded-r-sm z-0"></div>
                    {/* Floating Orange Icon Box */}
                    <div className="absolute -top-8 -right-6 bg-[#F5A549] w-16 h-16 flex items-center justify-center shadow-lg rounded-sm z-20">
                        <RefreshIcon />
                    </div>
                </>
            )
        };
    }
    // Pending
    return {
        gradient: 'bg-gradient-to-br from-[#7976C2] to-[#625EA8]',
        textColor: 'text-white',
        subTextColor: 'text-white/80',
        tabs: (
            <>
                <div className="absolute top-12 -left-1.5 w-3 h-16 bg-[#44416D] rounded-l-sm z-0"></div>
                <div className="absolute -bottom-1.5 right-12 w-20 h-3 bg-[#44416D] rounded-b-sm z-0"></div>
            </>
        )
    };
};

const TaskCard = ({ req, index }: { req: any; index: number }) => {
    const { gradient, textColor, subTextColor, tabs } = getCardStyles(req.status);
    // Mimic the task IDs from the image (001, 002, etc)
    const displayId = String(index + 1).padStart(3, '0');

    // Formatting Status text
    const displayStatus = req.status === 'in_progress' ? 'In Progress' :
        req.status.charAt(0).toUpperCase() + req.status.slice(1);

    return (
        <Link to={`/request/${req.id}`} className="relative block group min-h-[180px] w-full max-w-[360px]">
            {tabs}
            <div className={`relative h-full p-8 shadow-xl flex flex-col justify-center transition-transform transform group-hover:-translate-y-1 duration-200 z-10 ${gradient}`}>
                <h3 className={`text-2xl font-bold mb-2 ${textColor}`}>任务 #{displayId}</h3>
                <p className={`text-lg font-medium ${subTextColor}`}>状态: {displayStatus}</p>
            </div>
        </Link>
    );
};

// The static placeholder card from the bottom right of the design
const PlaceholderCard = () => (
    <div className="relative block min-h-[180px] w-full max-w-[360px] opacity-90">
        {/* Placeholder decorative tabs */}
        <div className="absolute -top-1.5 right-20 w-20 h-3 bg-[#787899] z-0"></div>
        <div className="absolute top-12 -right-1.5 w-3 h-16 bg-[#787899] z-0"></div>

        <div className="relative h-full p-8 rounded-sm shadow-lg flex flex-col justify-end bg-gradient-to-br from-[#B5B3D6] to-[#A3A1C9] z-10">
            {/* Progress bar simulation */}
            <div className="w-full bg-white/30 h-3 rounded-full overflow-hidden">
                <div className="bg-[#8A88B5] h-full w-[40%]"></div>
            </div>
        </div>
    </div>
);

export const RequestList = () => {
    const { data: requests, isLoading, error } = useLiveRequests();

    if (isLoading) return <div className="p-10"><Spinner /></div>;
    if (error) return <p className="text-red-500">Error loading tasks.</p>;

    // For design fidelity, if no requests, we simulate dummy data to match the screenshot
    // In a real app, you would just map the `requests`
    const itemsToRender = requests.length > 0 ? requests : [
        { id: 1, status: 'completed' },
        { id: 2, status: 'in_progress' },
        { id: 3, status: 'pending' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 w-full max-w-[800px]">
            {requests.map((req: any, i: number) => (
                <TaskCard key={req.id || i} req={req} index={i} />
            ))}

            {/* Always show the placeholder/skeleton card to fill the grid as per design */}
            <PlaceholderCard />
        </div>
    );
};