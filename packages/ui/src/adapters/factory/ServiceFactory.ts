/**
 * Service Factory
 * Uses setter/getter pattern for service initialization
 *
 * ARCHITECTURE:
 * - Services are set externally via setters (e.g., in ImmersiveLangApp.tsx)
 * - Getters throw if service not initialized (enforces explicit setup)
 * - Both web and Tauri use the same IndexedDB-based implementations
 */

import type { IAuthService } from "@immersive-lang/ui/adapters/factory/interfaces";
import type { ISyncService } from "@immersive-lang/ui/adapters/factory/interfaces";
import type { ISessionHistoryService, IStorageService } from "@immersive-lang/ui/adapters";
import { serviceLogger } from "@immersive-lang/ui/utils";

// Singleton instances (set via setters)
let authService: IAuthService | null = null;
let syncService: ISyncService | null = null;
let storageService: IStorageService | null = null;
let sessionHistoryService: ISessionHistoryService | null = null;

// ============= Setters =============

/**
 * Set custom Auth Service
 */
export const setAuthService = (service: IAuthService): void => {
    authService = service;
    serviceLogger.factory("Set AuthService");
};

/**
 * Set custom Sync Service
 */
export const setSyncService = (service: ISyncService): void => {
    syncService = service;
    serviceLogger.factory("Set SyncService");
};

/**
 * Set custom Storage Service
 */
export const setStorageService = (service: IStorageService): void => {
    storageService = service;
    serviceLogger.factory("Set StorageService");
};

/**
 * Set custom Session History Service
 */
export const setSessionHistoryService = (service: ISessionHistoryService): void => {
    sessionHistoryService = service;
    serviceLogger.factory("Set SessionHistoryService");
};

// ============= Getters =============

/**
 * Get the Auth Service
 * @throws Error if service not initialized
 */
export const getAuthService = (): IAuthService => {
    if (!authService) {
        throw new Error("AuthService not initialized. Call setAuthService first.");
    }
    return authService;
};

/**
 * Get the Sync Service
 * @throws Error if service not initialized
 */
export const getSyncService = (): ISyncService => {
    if (!syncService) {
        throw new Error("SyncService not initialized. Call setSyncService first.");
    }
    return syncService;
};

/**
 * Get the Storage Service
 * @throws Error if service not initialized
 */
export const getStorageService = (): IStorageService => {
    if (!storageService) {
        throw new Error("StorageService not initialized. Call setStorageService first.");
    }
    return storageService;
};

/**
 * Get the Session History Service
 * @throws Error if service not initialized
 */
export const getSessionHistoryService = (): ISessionHistoryService => {
    if (!sessionHistoryService) {
        throw new Error("SessionHistoryService not initialized. Call setSessionHistoryService first.");
    }
    return sessionHistoryService;
};

// ============= Utilities =============

/**
 * Get all services as an object (useful for context providers)
 * @throws Error if any required service is not initialized
 */
export const getAllServices = () => ({
    auth: getAuthService(),
    sync: getSyncService(),
    storage: getStorageService(),
    sessionHistory: getSessionHistoryService(),
});

/**
 * Reset all service instances (useful for testing or logout)
 */
export const resetServices = (): void => {
    authService = null;
    syncService = null;
    storageService = null;
    sessionHistoryService = null;
    serviceLogger.factory("Reset all services");
};

/**
 * Service Factory for platform-agnostic service access
 * @deprecated Use setter/getter functions instead
 */
export const ServiceFactory = {
    getAuthService,
    getSyncService,
    getStorageService,
    getSessionHistoryService,
    reset: resetServices,
    injectForTesting(services: {
        auth?: IAuthService;
        sync?: ISyncService;
        storage?: IStorageService;
        sessionHistory?: ISessionHistoryService;
    }): void {
        if (services.auth) authService = services.auth;
        if (services.sync) syncService = services.sync;
        if (services.storage) storageService = services.storage;
        if (services.sessionHistory) sessionHistoryService = services.sessionHistory;
    },
};
