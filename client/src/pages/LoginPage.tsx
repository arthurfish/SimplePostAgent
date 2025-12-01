// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { Effect } from 'effect';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {Spinner} from "../components/ui/Spinner.tsx";

export const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const program = login({ u: username, p: password }).pipe(
            Effect.tap(() => navigate('/')),
            Effect.catchAll((e) => Effect.sync(() => setError(e.message))),
            Effect.ensuring(Effect.sync(() => setIsLoading(false)))
        );

        Effect.runFork(program);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Spinner size="sm" /> : 'Login'}
                    </Button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </form>
            </Card>
        </div>
    );
};