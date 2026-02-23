import { ChevronLeft, ChevronRight, History, type LucideIcon, Settings, Target, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useNav } from "@immersive-lang/ui/hooks";

interface NavItem {
    id: string;
    icon: LucideIcon;
    label: string;
    path: string;
}

export interface SidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    className?: string;
}

const navItems: NavItem[] = [
    { id: "missions", icon: Target, label: "Missions", path: "/missions" },
    { id: "history", icon: History, label: "History", path: "/history" },
    { id: "settings", icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
    const { to } = useNav();

    return (
        <aside
            className={`fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col border-r transition-all duration-300 ${
                isCollapsed ? "w-16" : "w-64"
            }`}
            style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderRightColor: "var(--color-border-light)",
                boxShadow: "4px 0 20px rgba(0, 0, 0, 0.1)",
            }}
        >
            {/* Brand */}
            <div
                className={`flex items-center gap-3 py-5 border-b transition-all duration-300 ${
                    isCollapsed ? "px-3 justify-center" : "px-6"
                }`}
                style={{ borderBottomColor: "var(--color-border-light)" }}
            >
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        backgroundColor: "var(--color-primary-500)",
                        boxShadow: "0 4px 12px rgba(163, 177, 138, 0.3)",
                    }}
                >
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-lg font-bold text-text-main whitespace-nowrap font-heading">Immergo</h1>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <li key={item.id}>
                                <NavLink
                                    to={to(item.path)}
                                    title={isCollapsed ? item.label : undefined}
                                    className={({ isActive }) =>
                                        `w-full flex items-center gap-3 py-3 rounded-xl transition-all duration-200 group ${
                                            isCollapsed ? "px-0 justify-center" : "px-4"
                                        } ${
                                            isActive
                                                ? "bg-primary-500 text-white shadow-[0_4px_12px_rgba(163,177,138,0.3)]"
                                                : "text-text-sub hover:bg-white/10"
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon
                                                className={`w-5 h-5 flex-shrink-0 transition-all ${
                                                    isActive ? "stroke-[2.5]" : "stroke-2 group-hover:stroke-[2.5]"
                                                }`}
                                            />
                                            {!isCollapsed && (
                                                <>
                                                    <span
                                                        className={`text-sm whitespace-nowrap ${isActive ? "font-bold" : "font-medium"}`}
                                                    >
                                                        {item.label}
                                                    </span>
                                                    {isActive && (
                                                        <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white" />
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={onToggleCollapse}
                className="mx-3 mb-3 p-2 rounded-lg transition-all hover:bg-white/10 flex items-center justify-center text-text-sub"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
        </aside>
    );
}
