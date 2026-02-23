import { createContext, useContext } from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";

/**
 * Base path context for navigation
 */
export const BasePathContext = createContext<string>("");

/**
 * Hook for base-path aware navigation
 * Converts relative paths to absolute paths with base path
 */
export const useNav = () => {
    const basePath = useContext(BasePathContext);
    const rawNavigate = useNavigate();

    const to = (path: string): string => (basePath ? `${basePath}${path}` : path);

    const navigate = (pathOrDelta: string | number, options?: NavigateOptions) => {
        if (typeof pathOrDelta === "number") rawNavigate(pathOrDelta);
        else rawNavigate(to(pathOrDelta), options);
    };

    return { to, navigate, basePath };
};
