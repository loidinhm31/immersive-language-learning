/**
 * LocalStorage Adapter
 *
 * Web implementation of IStorageService using localStorage.
 */

import type { IStorageService } from '../factory/interfaces/IStorageService';

export class LocalStorageAdapter implements IStorageService {
  private prefix: string;

  constructor(prefix: string = 'immergo_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const item = localStorage.getItem(this.getKey(key));
    if (item === null) {
      return null;
    }
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(this.getKey(key), serialized);
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  async keys(): Promise<string[]> {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        result.push(key.slice(this.prefix.length));
      }
    }
    return result;
  }
}
