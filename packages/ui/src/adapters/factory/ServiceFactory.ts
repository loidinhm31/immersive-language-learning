/**
 * Service Factory
 *
 * Provides lazy singleton instances of platform-specific services.
 * Automatically selects Tauri or Web implementations based on platform.
 */

import { isTauri } from '../shared/platform';
import type { IAuthService } from './interfaces/IAuthService';
import type { ISyncService } from './interfaces/ISyncService';
import type { IStorageService } from './interfaces/IStorageService';
import type { ISessionHistoryService } from './interfaces/ISessionHistoryService';
import { LocalStorageAdapter } from '../web/LocalStorageAdapter';
import { TauriSessionHistoryAdapter } from '../tauri/TauriSessionHistoryAdapter';
import { WebSessionHistoryAdapter } from '../web/WebSessionHistoryAdapter';

// Lazy singleton instances
let authService: IAuthService | null = null;
let syncService: ISyncService | null = null;
let storageService: IStorageService | null = null;
let sessionHistoryService: ISessionHistoryService | null = null;

/**
 * Service Factory for platform-agnostic service access
 */
export const ServiceFactory = {
  /**
   * Get the authentication service
   */
  getAuthService(): IAuthService {
    if (!authService) {
      if (isTauri()) {
        // TODO: Import and instantiate TauriAuthAdapter
        throw new Error('TauriAuthAdapter not implemented. Add apps/native first.');
      } else {
        // TODO: Import and instantiate WebAuthAdapter
        throw new Error('WebAuthAdapter not implemented. Create adapters/web/WebAuthAdapter.ts');
      }
    }
    return authService;
  },

  /**
   * Get the sync service
   */
  getSyncService(): ISyncService {
    if (!syncService) {
      if (isTauri()) {
        // TODO: Import and instantiate TauriSyncAdapter
        throw new Error('TauriSyncAdapter not implemented. Add apps/native first.');
      } else {
        // TODO: Import and instantiate IndexedDBSyncAdapter
        throw new Error(
          'IndexedDBSyncAdapter not implemented. Create adapters/web/IndexedDBSyncAdapter.ts'
        );
      }
    }
    return syncService;
  },

  /**
   * Get the storage service
   */
  getStorageService(): IStorageService {
    if (!storageService) {
      if (isTauri()) {
        // TODO: Import and instantiate TauriStorageAdapter
        throw new Error('TauriStorageAdapter not implemented. Add apps/native first.');
      } else {
        storageService = new LocalStorageAdapter();
      }
    }
    return storageService!;
  },

  /**
   * Get the session history service
   */
  getSessionHistoryService(): ISessionHistoryService {
    if (!sessionHistoryService) {
      if (isTauri()) {
        sessionHistoryService = new TauriSessionHistoryAdapter();
      } else {
        sessionHistoryService = new WebSessionHistoryAdapter();
      }
    }
    return sessionHistoryService!;
  },

  /**
   * Reset all service instances (useful for testing)
   */
  reset(): void {
    authService = null;
    syncService = null;
    storageService = null;
    sessionHistoryService = null;
  },

  /**
   * Inject mock services (for testing)
   */
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
