// src/components/ui/Sidebar.tsx
import { useState } from "react";
import clsx from "clsx";
import {useNavigate} from "react-router-dom";

// --- Icons (调整 strokeWidth 为 1.5 以匹配设计图的精致感) ---
const DashboardIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>;
const TasksIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ReportsIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>;
const SettingsIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;

// --- Sidebar Item Component ---
interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ icon, label, active = false, onClick }: SidebarItemProps) => (
    <div
        onClick={onClick}
        className={clsx(
            "group relative flex items-center gap-4 px-8 py-5 cursor-pointer transition-all duration-200",
            // Active State: 白色文字 + 10%白色背景
            // Inactive State: 青灰色文字 + Hover时略微变亮
            active
                ? "text-white bg-white/10"
                : "text-[#8DA6B1] hover:text-white hover:bg-white/5"
        )}
    >
        {/* Icon 容器，保证图标位置稳定 */}
        <div className={clsx("transition-transform duration-200", active ? "scale-105" : "group-hover:scale-105")}>
            {icon}
        </div>

        <span className="font-medium text-[15px] tracking-wide">{label}</span>

        {/* Active Indicator (右侧发光条) */}
        {active && (
            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-white rounded-l-full shadow-[0_0_12px_rgba(255,255,255,0.7)]"></div>
        )}
    </div>
);

// --- Main Sidebar Component ---
export const Sidebar = () => {
    // 默认激活 Tasks，模拟设计图状态
    const [activeItem, setActiveItem] = useState("Tasks");
    const navigate = useNavigate()

    const menuItems = [
        { id: "Dashboard", icon: <DashboardIcon />, label: "控制台", to:"/" },
        { id: "Tasks", icon: <TasksIcon />, label: "任务", to:"/" },
        { id: "Reports", icon: <ReportsIcon />, label: "报告", to:"/" },
        { id: "Settings", icon: <SettingsIcon />, label: "设置", to:"/" },
    ];

    return (
        <aside className="ml-[4em] mt-[20em] pt-[3em] max-h-[40em] w-[15em] flex-shrink-0 bg-gradient-to-b from-[#0B3541] to-[#327B91] flex flex-col pt-24 shadow-2xl z-20">
            <nav className="flex flex-col w-full">
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        active={activeItem === item.id}
                        onClick={() => {setActiveItem(item.id); navigate(item.to)}}
                    />
                ))}
            </nav>
        </aside>
    );
};