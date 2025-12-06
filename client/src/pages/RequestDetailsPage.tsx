// src/pages/RequestDetailsPage.tsx
import { useParams } from "react-router-dom";
import { Spinner } from "../components/ui/Spinner";
import { useLiveRequests } from "../hooks/useLiveQueries";
import { SubTaskList } from "../components/requests/SubTaskList";
import { FinalReportCard } from "../components/requests/FinalReportCard";
import { Layout } from "../components/ui/Layout";
import {Sidebar} from "../components/ui/Sidebar.tsx";

// --- Icons & Sidebar (Reused for consistency) ---
const DashboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>;
const TasksIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ReportsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const PlusIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;

const SidebarItem = ({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <div className={`relative flex items-center gap-4 p-4 cursor-pointer text-white/90 hover:text-white hover:bg-white/10 transition-colors ${active ? 'bg-white/5' : ''}`}>
        {icon}
        <span className="font-medium tracking-wide">{label}</span>
        {active && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>}
    </div>
);

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
        <div className="flex min-h-screen bg-[#CED3DF] font-sans overflow-x-hidden">
            {/* Sidebar */}
            <Sidebar/>

            {/* Main Content */}
            <main className="flex-grow p-[1em] relative">
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

                {/* FAB (Floating Action Button) */}
                <button className="fixed bottom-8 right-8 w-16 h-16 bg-[#2B87F8] hover:bg-[#1c72db] text-white rounded-full shadow-[0_4px_20px_rgba(43,135,248,0.5)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50">
                    <PlusIcon />
                    {/* Decorative sparkle on button */}
                    <svg className="absolute bottom-2 right-2 w-4 h-4 text-white/50" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" /></svg>
                </button>
            </main>
        </div>
    );
};