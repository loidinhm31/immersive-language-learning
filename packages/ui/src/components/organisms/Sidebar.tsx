import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { History, type LucideIcon, Settings, Target } from "lucide-react";
import { useNav } from "@immersive-lang/ui/hooks";

export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: string | number;
}

export interface SidebarProps {
    items?: NavItem[];
    header?: ReactNode;
    footer?: ReactNode;
    className?: string;
}

const defaultNavItems: NavItem[] = [
    { label: "Missions", href: "/missions", icon: Target },
    { label: "History", href: "/history", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ items = defaultNavItems, header, footer, className = "" }: SidebarProps) {
    const location = useLocation();
    const { to } = useNav();

    return (
        <div className={`flex h-full flex-col bg-surface/50 backdrop-blur-sm ${className}`}>
            {header && <div className="flex h-14 items-center border-b border-glass-border px-4">{header}</div>}

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === to(item.href);

                    return (
                        <NavLink
                            key={item.href}
                            to={to(item.href)}
                            className={`
                flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                ${
                    isActive
                        ? "bg-accent-primary text-white shadow-sm"
                        : "text-text-sub hover:bg-surface hover:text-text-main"
                }
              `}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge && (
                                <span className="rounded-full bg-accent-primary/10 px-2 py-0.5 text-xs font-medium text-accent-primary">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {footer && <div className="border-t border-glass-border p-4">{footer}</div>}
        </div>
    );
}
