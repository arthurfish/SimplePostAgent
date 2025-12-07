// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { Effect } from 'effect';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';

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
        // 1. 主容器: 居中内容，并设置了与设计稿匹配的浅灰色背景
        <main className="relative flex items-center justify-center min-h-screen bg-slate-100 overflow-hidden">

            {/* 2. 背景装饰性色块 (使用绝对定位和z-index置于底层) */}
            <div className="absolute -z-0">
                <div className="absolute top-[-350px] left-[-300px] w-120 h-90 bg-[#2A6F6D] mix-blend-overlay transform"></div>
                <div className="absolute top-[-70px] left-[-270px] w-80 h-60 bg-[#F07F3C] mix-blend-overlay transform"></div>
                <div className="absolute top-[-270px] left-[70px] w-96 h-96 bg-[#1E496D] transform mix-blend-overlay "></div>
            </div>

            {/* 3. 登录卡片: 增加 z-index 使其浮于背景之上，并调整了内边距、宽度和阴影 */}
            <Card className="w-full max-w-sm sm:max-w-md p-20 sm:p-10 z-10 h-120 border-2">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                    Sign In to SimplePostAgent
                </h1>
                <form onSubmit={handleLogin} className="space-y-6">
                    {/* 4. 输入框: 使用设计稿中的 placeholder */}
                    <Input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <div className="flex flex-col items-center w-full">
                    {/* 5. 登录按钮: 样式调整为橙色，并增加了内边距和字体粗细 */}
                    <Button type="submit" className="py-3 font-semibold hover:bg-[#C65210]  bg-[#F07F3C]  h-[3em] w-[12em]" disabled={isLoading}>
                        {isLoading ? <Spinner size="sm" /> : 'Login'}
                    </Button>
                    </div>
                    {error && <p className="!mt-3 text-center  text-red-500 text-sm">{error}</p>}
                </form>
                {/* 6. "忘记密码" 链接: 根据设计稿新增 */}
                <div className="text-center mt-6">
                    <a href="#" className="text-sm text-gray-500 hover:underline">
                        Forgot Password?
                    </a>
                </div>
            </Card>

        </main>
    );
};