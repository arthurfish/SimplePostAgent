// src/pages/RequestDetailsPage.tsx
import { useParams } from "react-router-dom";
import { Spinner } from "../components/ui/Spinner";
import { useLiveRequests } from "../hooks/useLiveQueries";
import { SubTaskList } from "../components/requests/SubTaskList";
import { FinalReportCard } from "../components/requests/FinalReportCard";
import {Sidebar} from "../components/ui/Sidebar.tsx";

// --- Icons & Sidebar (Reused for consistency) ---
const PlusIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;

// --- Page Component ---

export const RequestDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const { data: requests, isLoading } = useLiveRequests();

    // Find the current request
    const request = requests.find((r) => String(r.id) === id);

    if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-[#CED3DF]"><Spinner size="lg" /></div>;

    // If not found (or while loading initially)
    if (!request && !isLoading) return <div className="h-screen flex items-center justify-center text-slate-500">Request not found</div>;

    const displayId = String(request?.id || "000").padStart(3, '0');

    return (
        <div className="flex min-h-screen min-w-screen justify-center font-sans overflow-x-hidden bg-gradient-to-br from-[#bfcfe5] to-[#b2d3c1]">
            {/* Sidebar */}
            <Sidebar/>

            {/* Main Content */}
            <main className="flex p-[1em] relative">
                <div className="p-12 max-w-5xl  space-y-12">

                    {/* 1. Header Card (Green) */}
                    <div className="relative">
                        <div className="absolute top-4 -left-4 w-6 h-32 bg-[#0F3629] rounded-l-md -z-10 shadow-md"></div>
                        <div className="absolute top-12 -right-4 w-6 h-24 bg-[#3E4259] rounded-r-md -z-10 shadow-md"></div>

                        <div className="w-full max-w-lg h-64 bg-gradient-to-br from-[#1b6550] to-[#45938C] rounded-sm shadow-2xl flex items-center justify-center px-10 relative z-10">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-[#0a1f1b]/90 tracking-tight">
                                任务代码 #{displayId.slice(0, 4)}
                            </h1>
                        </div>
                    </div>

                    {/* 2. User Input Summary Card (Dark Blue) */}
                    <div className="relative group w-full max-w-2xl ml-4">
                        {/* Decorative tabs */}
                        <div className="absolute -top-3 left-12 w-20 h-6 bg-[#2B354F] rounded-t-sm"></div>
                        <div className="absolute top-8 -right-3 w-4 h-16 bg-[#2B354F] rounded-r-sm"></div>

                        <div className="relative bg-[#1E293B] text-white p-8 rounded-sm shadow-xl min-h-[140px] flex flex-col justify-center">
                            <p className="text-lg font-light mb-4 opacity-90">
                                <span className="font-semibold text-white/60 block text-sm mb-1 uppercase tracking-wider">用户输入</span>
                                "{request?.user_input}"
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white/60 uppercase tracking-wider">状态:</span>
                                <span className="text-sm font-medium text-[#7DD3FC]">
                                    {request?.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Sub-Tasks Grid */}
                    <div className="ml-4">
                        <SubTaskList requestId={request!.id} />
                    </div>

                    {/* 4. Final Report (Only if present) */}
                    {request?.status === 'completed' && request.final_report && (
                        <div className="ml-4 mt-8">
                            <FinalReportCard report={request.final_report} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};