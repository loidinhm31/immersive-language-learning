/**
 * Storage Service Interface
 *
 * Platform-agnostic key-value storage.
 * Uses secure encrypted storage on Tauri, localStorage on web.
 */

export interface IStorageService {
  /**
   * Get a value by key
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Remove a value
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all stored values
   */
  clear(): Promise<void>;

  /**
   * Check if a key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Get all keys
   */
  keys(): Promise<string[]>;
}
