import { createContext, type ReactNode, useContext } from "react";
import type {
    IAuthService,
    ISyncService,
    IStorageService,
    ISessionHistoryService,
} from "../adapters/factory/interfaces";

/**
 * Platform services interface for dependency injection
 * Different platforms (Tauri, Web) provide different implementations
 */
export interface IPlatformServices {
    auth: IAuthService;
    sync: ISyncService;
    sessionHistory: ISessionHistoryService;
    storage: IStorageService;
}

/**
 * Platform context for injecting platform-specific services
 */
export const PlatformContext = createContext<IPlatformServices | null>(null);

/**
 * Hook to access platform services
 * @throws Error if used outside of PlatformProvider
 */
export const usePlatformServices = (): IPlatformServices => {
    const services = useContext(PlatformContext);
    if (!services) {
        throw new Error("usePlatformServices must be used within a PlatformProvider");
    }
    return services;
};

/**
 * Hook to access auth service
 */
export const useAuthService = (): IAuthService => {
    return usePlatformServices().auth;
};

/**
 * Hook to access sync service
 */
export const useSyncService = (): ISyncService => {
    return usePlatformServices().sync;
};

/**
 * Hook to access session history service
 */
export const useSessionHistoryService = (): ISessionHistoryService => {
    return usePlatformServices().sessionHistory;
};

/**
 * Hook to access storage service
 */
export const useStorageService = (): IStorageService => {
    return usePlatformServices().storage;
};

/**
 * Platform provider props
 */
export interface PlatformProviderProps {
    services: IPlatformServices;
    children: ReactNode;
}

/**
 * Platform provider component
 * Wrap your app with this and provide platform-specific service implementations
 */
export const PlatformProvider = ({ services, children }: PlatformProviderProps) => {
    return <PlatformContext.Provider value={services}>{children}</PlatformContext.Provider>;
};
