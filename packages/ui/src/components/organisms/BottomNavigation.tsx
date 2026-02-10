import { NavLink, useLocation } from "react-router-dom";
import { Target, History, Settings, type LucideIcon } from "lucide-react";
import { useNav } from "@immersive-lang/ui/hooks";

export interface BottomNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
}

export interface BottomNavigationProps {
    items?: BottomNavItem[];
    className?: string;
}

const defaultItems: BottomNavItem[] = [
    { label: "Missions", href: "/missions", icon: Target },
    { label: "History", href: "/history", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
];

export function BottomNavigation({ items = defaultItems, className = "" }: BottomNavigationProps) {
    const location = useLocation();
    const { to } = useNav();

    return (
        <nav
            className={`
        flex h-16 items-center justify-around border-t border-glass-border
        bg-surface/80 backdrop-blur-md px-2
        ${className}
      `}
        >
            {items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === to(item.href);

                return (
                    <NavLink
                        key={item.href}
                        to={to(item.href)}
                        className={`
              relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors
              ${isActive ? "text-accent-primary" : "text-text-sub hover:text-text-main"}
            `}
                    >
                        <div className="relative">
                            <Icon className="h-5 w-5" />
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-secondary px-1 text-[10px] font-medium text-white">
                                    {item.badge > 99 ? "99+" : item.badge}
                                </span>
                            )}
                        </div>
                        <span className="font-medium">{item.label}</span>
                        {isActive && <span className="absolute bottom-1 h-0.5 w-8 rounded-full bg-accent-primary" />}
                    </NavLink>
                );
            })}
        </nav>
    );
}
