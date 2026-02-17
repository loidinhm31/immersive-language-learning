import React from "react";
import { SyncSettings, GeminiSettings } from "@immersive-lang/ui/components/organisms";
import { useAuth, useNav } from "@immersive-lang/ui/hooks";
import { useTheme, type Theme } from "@immersive-lang/ui/contexts";
import { Button, Card } from "@immersive-lang/ui/components/atoms";
import { LogIn, LogOut, Moon, Sun, Monitor, Terminal } from "lucide-react";

export interface SettingsPageProps {
    onLogout?: () => void;
}

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
    { value: "system", label: "System", icon: <Monitor className="w-5 h-5" /> },
    { value: "cyber", label: "Cyber", icon: <Terminal className="w-5 h-5" /> },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
    const { nav } = useNav();
    const { isAuthenticated, status, logout } = useAuth();
    const { theme, setTheme } = useTheme();

    const handleLogout = async () => {
        await logout();
        onLogout?.();
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Appearance Settings */}
            <Card className="mb-6">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-accent-primary/20 rounded-full">
                            <Sun className="w-6 h-6 text-accent-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Appearance</h3>
                            <p className="text-sm text-text-sub">Choose your preferred theme</p>
                        </div>
                    </div>

                    {/* Single 2x2 grid for all themes */}
                    <div className="grid grid-cols-2 gap-3">
                        {THEME_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setTheme(option.value)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                                    theme === option.value
                                        ? "bg-accent-primary text-white shadow-md ring-2 ring-accent-primary"
                                        : "bg-surface hover:bg-surface-solid text-text-sub hover:text-text-main"
                                }`}
                            >
                                {option.icon}
                                <span className="text-sm font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Login Settings */}
            <Card className="mb-6">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">
                                {isAuthenticated ? "Account" : "Login to connect to server"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isAuthenticated
                                    ? "Manage your account connection"
                                    : "Connect your account to sync data across devices"}
                            </p>
                        </div>
                    </div>
                    {isAuthenticated ? (
                        <div>
                            <Button
                                variant="ghost"
                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <Button variant="primary" className="w-full" onClick={() => nav("/login")}>
                            <LogIn className="w-4 h-4 mr-2" />
                            Login / Register
                        </Button>
                    )}
                </div>
            </Card>
            <GeminiSettings />
            <SyncSettings />
        </div>
    );
};
