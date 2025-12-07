// src/components/requests/NewRequestForm.tsx
import { useState } from "react";
import { Effect } from "effect";
import { Spinner } from "../ui/Spinner";
import { useApiService } from "../AppProvider.tsx";

const PaperPlaneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
);

export const NewRequestForm = () => {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const apiService = useApiService();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);

        const program = apiService.createRequest(input).pipe(
            Effect.tap(() => Effect.sync(() => setInput(""))),
            Effect.catchAll((e) => Effect.sync(() => setError(e.message))),
            Effect.ensuring(Effect.sync(() => setIsLoading(false)))
        );

        Effect.runFork(program);
    };

    return (
        <div className="w-full max-w-[750px]">
            <form onSubmit={handleSubmit} className="flex items-stretch gap-4">
                <input
                    type="text"
                    placeholder="请输入您的任务..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    className="flex-grow p-4 text-[#888] bg-[#E8E8E8] rounded-sm placeholder:text-[#AFAFAF] focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm text-lg "
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-8 bg-gradient-to-br from-[#E58C84] to-[#D65D56] text-white font-medium rounded-sm shadow-md hover:shadow-lg hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px]"
                >
                    {isLoading ? <Spinner size="sm" /> : (
                        <>
                            <PaperPlaneIcon />
                            <span className="tracking-wide">启动</span>
                        </>
                    )}
                </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>}
        </div>
    );
};