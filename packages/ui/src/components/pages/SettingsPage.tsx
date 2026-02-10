import React from "react";
import { SyncSettings, GeminiSettings } from "@immersive-lang/ui/components/organisms";
import { useAuth, useNav } from "@immersive-lang/ui/hooks";
import { Button, Card } from "@immersive-lang/ui/components/atoms";
import { LogIn, LogOut } from "lucide-react";

export interface SettingsPageProps {
    onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
    const { nav } = useNav();
    const { isAuthenticated, status, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        onLogout?.();
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
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
                            {status?.email && (
                                <div className="mb-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
                                    <p className="text-base font-medium">{status.email}</p>
                                </div>
                            )}
                            {status?.username && (
                                <div className="mb-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">Username</p>
                                    <p className="text-base font-medium">{status.username}</p>
                                </div>
                            )}
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
