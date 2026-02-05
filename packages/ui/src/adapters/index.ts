/**
 * Adapter Pattern Exports
 *
 * This module provides platform-agnostic service abstractions.
 * Use ServiceFactory to get the appropriate implementation for
 * the current platform (Tauri/Native vs Web).
 */

// Factory
export { ServiceFactory } from './factory/ServiceFactory';

// Interfaces
export type { IAuthService, AuthTokens } from './factory/interfaces/IAuthService';
export type { ISyncService, SyncOptions, SyncResult } from './factory/interfaces/ISyncService';
export type { IStorageService } from './factory/interfaces/IStorageService';

// Platform detection
export { isTauri, getPlatform, type Platform } from './shared/platform';
