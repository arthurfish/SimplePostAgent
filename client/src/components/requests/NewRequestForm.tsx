// src/components/requests/NewRequestForm.tsx
import { useState } from "react";
import { Effect } from "effect";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import {useApiService} from "../AppProvider.tsx";

export const NewRequestForm = () => {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const apiService = useApiService();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setIsLoading(true);
        setError(null);

        const program = apiService.createRequest(input).pipe(
            Effect.tap(() => Effect.sync(() => setInput(""))), // 清空输入框
            Effect.catchAll((e) => Effect.sync(() => setError(e.message))),
            Effect.ensuring(Effect.sync(() => setIsLoading(false)))
        );

        Effect.runFork(program);
    };

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-medium">Create a New AI Request</h3>
                <Textarea
                    rows={4}
                    placeholder="Enter your complex request here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                />
                <div className="flex justify-end items-center">
                    {error && <p className="text-red-500 text-sm mr-4">{error}</p>}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Spinner size="sm" /> : "Submit Request"}
                    </Button>
                </div>
            </form>
        </Card>
    );
};