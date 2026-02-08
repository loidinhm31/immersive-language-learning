import { Card, Button } from "@immersive-lang/ui/components/atoms";
import { SyncSettings } from "@immersive-lang/ui/components/organisms";
import { LogOut, LogIn } from "lucide-react";
import { useAuth } from "@immersive-lang/ui/hooks";
import { useNav } from "@immersive-lang/ui/hooks";

export interface SettingsPageProps {
    onLogout?: () => void;
}

export const SettingsPage = ({ onLogout }: SettingsPageProps) => {
    const { isAuthenticated, status, logout } = useAuth();
    const { nav } = useNav();

    const handleLogout = async () => {
        await logout();
        if (onLogout) {
            onLogout();
        }
    };

    const handleLoginClick = () => {
        nav("/login");
    };

    return (
        <div style={{ maxWidth: "32rem", margin: "0 auto", padding: "2rem 1rem" }}>
            <h1
                style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    marginBottom: "2rem",
                    background: "linear-gradient(135deg, #61bf7b 0%, #d4a600 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                }}
            >
                Settings
            </h1>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Auth Card */}
                <Card style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem" }}>Account</h3>

                    {isAuthenticated ? (
                        <div>
                            <div style={{ marginBottom: "1rem" }}>
                                <p
                                    style={{
                                        fontSize: "0.875rem",
                                        color: "rgba(255, 255, 255, 0.6)",
                                        marginBottom: "0.25rem",
                                    }}
                                >
                                    Email
                                </p>
                                <p style={{ fontSize: "1rem", fontWeight: "500", margin: 0 }}>
                                    {status?.email || "Not available"}
                                </p>
                            </div>

                            {status?.username && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <p
                                        style={{
                                            fontSize: "0.875rem",
                                            color: "rgba(255, 255, 255, 0.6)",
                                            marginBottom: "0.25rem",
                                        }}
                                    >
                                        Username
                                    </p>
                                    <p style={{ fontSize: "1rem", fontWeight: "500", margin: 0 }}>{status.username}</p>
                                </div>
                            )}

                            <Button
                                onClick={handleLogout}
                                style={{
                                    width: "100%",
                                    marginTop: "0.5rem",
                                    background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                                }}
                            >
                                <LogOut style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <p
                                style={{
                                    fontSize: "0.875rem",
                                    color: "rgba(255, 255, 255, 0.6)",
                                    marginBottom: "1rem",
                                }}
                            >
                                You are not logged in. Login to enable cloud sync across devices.
                            </p>
                            <Button
                                onClick={handleLoginClick}
                                style={{
                                    width: "100%",
                                    background: "linear-gradient(135deg, #61bf7b 0%, #509f63 100%)",
                                }}
                            >
                                <LogIn style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
                                Login / Register
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Sync Settings */}
                <SyncSettings />
            </div>
        </div>
    );
};
