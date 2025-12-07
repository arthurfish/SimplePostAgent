// src/pages/DashboardPage.tsx
import { NewRequestForm } from "../components/requests/NewRequestForm";
import { RequestList } from "../components/requests/RequestList";
import {Sidebar} from "../components/ui/Sidebar.tsx";

const SparkleIcon = () => (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-12 right-12 text-white opacity-40 pointer-events-none z-0">
        <path d="M22 0L24.6491 19.3509L44 22L24.6491 24.6491L22 44L19.3509 24.6491L0 22L19.3509 19.3509L22 0Z" fill="currentColor"/>
    </svg>
);

export const DashboardPage = () => {
    return (
        <div className="flex justify-center min-w-screen min-h-screen font-sans bg-gradient-to-br from-[#bfcfe5] to-[#b2d3c1] ">
        <Sidebar/>

            {/* Main Content */}
            <main className="flex p-12 relative overflow-hidden">
                <div className="max-w-4xl  relative z-10 space-y-16">

                    {/* Header Section */}
                    <div className="relative pt-4 pl-4">
                        {/* Decorative Left Dark Tab */}
                        <div className="absolute top-10 left-0 w-8 h-32 bg-[#0D3A2B]  -z-10 shadow-lg"></div>

                        {/* Decorative Right Dark Tab */}
                        <div className="absolute top-[130px] left-[380px] w-8 h-32 bg-[#3F435E] -z-10 shadow-lg"></div>

                        {/* Main Green Card */}
                        <div className="w-[380px] h-[260px] bg-gradient-to-br from-[#1b6550] to-[#45938C] shadow-2xl flex flex-col justify-center px-10 z-10">
                            <h1 className="text-5xl font-extrabold text-[#0a1f1b] opacity-90 leading-tight">
                                LLM任务并发<br/>控制台
                            </h1>
                        </div>
                    </div>

                    <div className="space-y-10 min-w-[50em] pl-4">
                        <NewRequestForm />
                        <RequestList />
                    </div>
                </div>

                {/* Background Decor */}
                <SparkleIcon />
            </main>
        </div>
    );
};