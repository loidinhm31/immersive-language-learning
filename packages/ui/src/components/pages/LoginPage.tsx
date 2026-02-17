import { useState } from "react";
import { Button, Input, Label } from "@immersive-lang/ui/components/atoms";
import { Mail, Lock, User, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@immersive-lang/ui/hooks";

export interface LoginPageProps {
    onLoginSuccess: () => void;
    onSkip?: () => void;
}

export const LoginPage = ({ onLoginSuccess, onSkip }: LoginPageProps) => {
    const { login, register } = useAuth();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Login form state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register form state
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

    const handleModeSwitch = (newMode: "login" | "register") => {
        setMode(newMode);
        setError(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login(loginEmail, loginPassword);
            onLoginSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Client-side validation
        if (registerPassword !== registerConfirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (registerPassword.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (!registerUsername || !registerEmail || !registerPassword) {
            setError("All fields are required");
            return;
        }

        setIsLoading(true);

        try {
            await register(registerUsername, registerEmail, registerPassword);
            onLoginSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--color-bg)",
                padding: "1rem",
            }}
        >
            <div
                style={{
                    maxWidth: "28rem",
                    width: "100%",
                    backgroundColor: "var(--glass-bg)",
                    backdropFilter: "blur(16px)",
                    borderRadius: "1rem",
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--shadow-md)",
                    padding: "2rem",
                }}
            >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div
                        style={{
                            color: "var(--color-accent-primary)",
                            fontSize: "2rem",
                            fontWeight: "bold",
                            marginBottom: "0.5rem",
                        }}
                    >
                        Immergo
                    </div>
                    <p style={{ color: "var(--color-text-sub)", fontSize: "0.875rem" }}>Immersive Language Learning</p>
                </div>

                {/* Mode toggle */}
                <div
                    style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "1.5rem",
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        padding: "0.25rem",
                        borderRadius: "0.5rem",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => handleModeSwitch("login")}
                        style={{
                            flex: 1,
                            padding: "0.5rem",
                            borderRadius: "0.375rem",
                            border: "none",
                            background: mode === "login" ? "var(--color-accent-primary)" : "transparent",
                            color: mode === "login" ? "#fff" : "var(--color-text-sub)",
                            fontWeight: mode === "login" ? "600" : "normal",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeSwitch("register")}
                        style={{
                            flex: 1,
                            padding: "0.5rem",
                            borderRadius: "0.375rem",
                            border: "none",
                            background: mode === "register" ? "var(--color-accent-secondary)" : "transparent",
                            color: mode === "register" ? "#fff" : "var(--color-text-sub)",
                            fontWeight: mode === "register" ? "600" : "normal",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        Register
                    </button>
                </div>

                {/* Error alert */}
                {error && (
                    <div
                        style={{
                            backgroundColor: "rgba(220, 38, 38, 0.1)",
                            border: "1px solid var(--color-danger)",
                            borderRadius: "0.5rem",
                            padding: "0.75rem",
                            marginBottom: "1rem",
                        }}
                    >
                        <p style={{ color: "var(--color-danger)", fontSize: "0.875rem", margin: 0 }}>{error}</p>
                    </div>
                )}

                {/* Login form */}
                {mode === "login" && (
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                            <Label htmlFor="login-email" required style={{ color: "var(--color-text-main)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Mail
                                        style={{ width: "1rem", height: "1rem", color: "var(--color-accent-primary)" }}
                                    />
                                    Email
                                </div>
                            </Label>
                            <Input
                                id="login-email"
                                type="email"
                                placeholder="your@email.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Label htmlFor="login-password" required style={{ color: "var(--color-text-main)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Lock
                                        style={{ width: "1rem", height: "1rem", color: "var(--color-accent-primary)" }}
                                    />
                                    Password
                                </div>
                            </Label>
                            <Input
                                id="login-password"
                                type="password"
                                placeholder="••••••••"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            type="submit"
                            style={{
                                width: "100%",
                                background: "var(--color-accent-primary)",
                                marginTop: "0.5rem",
                            }}
                            disabled={isLoading || !loginEmail || !loginPassword}
                        >
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                )}

                {/* Register form */}
                {mode === "register" && (
                    <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                            <Label htmlFor="register-username" required style={{ color: "var(--color-text-main)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <User
                                        style={{
                                            width: "1rem",
                                            height: "1rem",
                                            color: "var(--color-accent-secondary)",
                                        }}
                                    />
                                    Username
                                </div>
                            </Label>
                            <Input
                                id="register-username"
                                type="text"
                                placeholder="Your name"
                                value={registerUsername}
                                onChange={(e) => setRegisterUsername(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Label htmlFor="register-email" required style={{ color: "var(--color-text-main)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Mail
                                        style={{
                                            width: "1rem",
                                            height: "1rem",
                                            color: "var(--color-accent-secondary)",
                                        }}
                                    />
                                    Email
                                </div>
                            </Label>
                            <Input
                                id="register-email"
                                type="email"
                                placeholder="your@email.com"
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Label htmlFor="register-password" required style={{ color: "var(--color-text-main)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <KeyRound
                                        style={{
                                            width: "1rem",
                                            height: "1rem",
                                            color: "var(--color-accent-secondary)",
                                        }}
                                    />
                                    Password
                                </div>
                            </Label>
                            <Input
                                id="register-password"
                                type="password"
                                placeholder="Min. 8 characters"
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Label
                                htmlFor="register-confirm-password"
                                required
                                style={{ color: "var(--color-text-main)" }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <ShieldCheck
                                        style={{
                                            width: "1rem",
                                            height: "1rem",
                                            color: "var(--color-accent-secondary)",
                                        }}
                                    />
                                    Confirm Password
                                </div>
                            </Label>
                            <Input
                                id="register-confirm-password"
                                type="password"
                                placeholder="Re-enter password"
                                value={registerConfirmPassword}
                                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            type="submit"
                            style={{
                                width: "100%",
                                background: "var(--color-accent-secondary)",
                                marginTop: "0.5rem",
                            }}
                            disabled={
                                isLoading ||
                                !registerUsername ||
                                !registerEmail ||
                                !registerPassword ||
                                !registerConfirmPassword
                            }
                        >
                            {isLoading ? "Creating account..." : "Create Account"}
                        </Button>
                    </form>
                )}

                {/* Skip button */}
                {onSkip && (
                    <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                        <button
                            type="button"
                            onClick={onSkip}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--color-text-sub)",
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                textDecoration: "underline",
                            }}
                            disabled={isLoading}
                        >
                            Skip for now (local only)
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: "2rem", textAlign: "center" }}>
                    <p style={{ color: "var(--color-text-sub)", fontSize: "0.75rem", margin: 0, opacity: 0.6 }}>
                        Your data is encrypted and secure
                    </p>
                </div>
            </div>
        </div>
    );
};
