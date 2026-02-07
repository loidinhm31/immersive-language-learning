/**
 * Session History Service Interface
 *
 * Platform-agnostic interface for managing session history.
 * Implementations: IndexedDB (web), SQLite (Tauri)
 */

import type { SessionHistoryEntry } from '@immersive-lang/shared';

export interface SessionHistoryFilter {
  language?: string;
  fromLanguage?: string;
  mode?: string;
  fromDate?: number;
  toDate?: number;
  limit?: number;
  offset?: number;
}

export interface ISessionHistoryService {
  /**
   * Save a completed session to history
   */
  save(entry: SessionHistoryEntry): Promise<void>;

  /**
   * Get all session history entries
   */
  getAll(filter?: SessionHistoryFilter): Promise<SessionHistoryEntry[]>;

  /**
   * Get a single session by ID
   */
  get(id: string): Promise<SessionHistoryEntry | null>;

  /**
   * Delete a session from history
   */
  delete(id: string): Promise<void>;

  /**
   * Clear all session history
   */
  clear(): Promise<void>;

  /**
   * Get total count of sessions
   */
  count(filter?: SessionHistoryFilter): Promise<number>;
}
