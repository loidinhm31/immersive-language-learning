import { NavLink } from "react-router-dom";
import { Target, History, Settings, type LucideIcon } from "lucide-react";
import { useNav } from "@immersive-lang/ui/hooks";

interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { id: "missions", label: "Missions", href: "/missions", icon: Target },
    { id: "history", label: "History", href: "/history", icon: History },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
];

export function BottomNavigation() {
    const { to } = useNav();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 md:hidden z-50 flex h-16 items-center justify-around border-t px-2"
            style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderTopColor: "var(--color-border-light)",
            }}
        >
            {navItems.map((item) => {
                const Icon = item.icon;

                return (
                    <NavLink
                        key={item.id}
                        to={to(item.href)}
                        className={({ isActive }) =>
                            `relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors
                            ${isActive ? "text-accent-primary" : "text-text-sub hover:text-text-main"}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className="relative">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="font-medium">{item.label}</span>
                                {isActive && (
                                    <span className="absolute bottom-1 h-0.5 w-8 rounded-full bg-accent-primary" />
                                )}
                            </>
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
}
