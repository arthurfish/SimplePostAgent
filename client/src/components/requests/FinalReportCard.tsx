// src/components/requests/FinalReportCard.tsx
import ReactMarkdown from 'react-markdown';

export const FinalReportCard = ({ report }: { report: string }) => {
    return (
        <div className="group relative w-full transition-all duration-300">

            {/* Decorative Tabs */}
            <div className="absolute top-10 -right-2 w-4 h-16 bg-[#A3423B] rounded-r-sm"></div>
            <div className="absolute -bottom-2 left-10 w-24 h-4 bg-[#A3423B] rounded-b-sm"></div>

            {/* Header / Top Fold */}
            <div className="bg-gradient-to-br from-[#c2aea7] to-[#ca5e55] p-6 rounded-t-sm shadow-lg relative z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Final Report</h2>
                        <p className="text-white/80 text-sm">Status: Ready for Review</p>
                    </div>
                    <svg className="w-6 h-6 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
            </div>

            {/* Document Body (Expands on Hover) */}
            <div className="bg-[#F9FAFB] border-x border-b border-gray-200 rounded-b-sm shadow-xl p-8 relative z-20 transform transition-transform group-hover:scale-[1.01]">
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Project Proposal Output</h3>
                    <button className="bg-[#E58C84] hover:bg-[#D65D56] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors">
                        Download
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </button>
                </div>

                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-xl prose-a:text-blue-600">
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>

                {/* Scrollbar indicator visual only */}
                <div className="absolute top-24 right-2 w-1.5 h-16 bg-gray-300 rounded-full opacity-50"></div>
            </div>
        </div>
    );
};