// 假设有一个登出按钮，但逻辑将在阶段1实现
// import { useAuth } from '../../contexts/AuthContext';

import {Button} from "./Button.tsx";

export const Navbar = () => {
    // const { logout } = useAuth(); // 逻辑将在后续阶段添加

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0">
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">SimplePostAgent</span>
                    </div>
                    <div className="flex items-center">
                        {/* 登出按钮的占位符。实际功能将在认证阶段实现 */}
                        <Button
                            className="bg-red-500 hover:bg-red-600"
                            // onClick={logout}
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};