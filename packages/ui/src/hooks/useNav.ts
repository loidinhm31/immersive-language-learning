import { createContext, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Base path context for navigation
 */
export const BasePathContext = createContext<string>("");

/**
 * Hook for base-path aware navigation
 * Converts relative paths to absolute paths with base path
 */
export const useNav = () => {
    const navigate = useNavigate();
    const basePath = useContext(BasePathContext);

    /**
     * Convert relative path to absolute path with base
     */
    const to = useCallback(
        (path: string): string => {
            if (path.startsWith("/")) {
                return `${basePath}${path}`;
            }
            return path;
        },
        [basePath],
    );

    /**
     * Navigate to a path (automatically prepends base path)
     */
    const nav = useCallback(
        (path: string) => {
            navigate(to(path));
        },
        [navigate, to],
    );

    return { to, nav, basePath };
};
