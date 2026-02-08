import { useCallback, useEffect, useState } from "react";
import type { AuthStatus, AuthResponse } from "@immersive-lang/shared";
import { useAuthService } from "@immersive-lang/ui/platform";

export interface UseAuthReturn {
    status: AuthStatus | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<AuthResponse>;
    register: (username: string, email: string, password: string) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshStatus: () => Promise<void>;
}

/**
 * Hook for authentication operations
 * Provides login, register, logout, and status checking
 */
export const useAuth = (): UseAuthReturn => {
    const authService = useAuthService();
    const [status, setStatus] = useState<AuthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const newStatus = await authService.getStatus();
            setStatus(newStatus);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to get auth status";
            setError(errorMsg);
            setStatus({ isAuthenticated: false });
        } finally {
            setLoading(false);
        }
    }, [authService]);

    const login = useCallback(
        async (email: string, password: string): Promise<AuthResponse> => {
            try {
                setError(null);
                const response = await authService.login(email, password);
                await refreshStatus();
                return response;
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "Login failed";
                setError(errorMsg);
                throw err;
            }
        },
        [authService, refreshStatus],
    );

    const register = useCallback(
        async (username: string, email: string, password: string): Promise<AuthResponse> => {
            try {
                setError(null);
                const response = await authService.register(username, email, password);
                await refreshStatus();
                return response;
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "Registration failed";
                setError(errorMsg);
                throw err;
            }
        },
        [authService, refreshStatus],
    );

    const logout = useCallback(async () => {
        try {
            setError(null);
            await authService.logout();
            await refreshStatus();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Logout failed";
            setError(errorMsg);
            throw err;
        }
    }, [authService, refreshStatus]);

    // Check status on mount
    useEffect(() => {
        refreshStatus();
    }, [refreshStatus]);

    return {
        status,
        isAuthenticated: status?.isAuthenticated ?? false,
        loading,
        error,
        login,
        register,
        logout,
        refreshStatus,
    };
};
