/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Environment configuration interface
 */
export interface AppEnvironment {
  VITE_API_BASE_URL: string;
  DEV: boolean;
  PROD: boolean;
  MODE: string;
}

/**
 * Default values for environment variables
 */
const ENV_DEFAULTS: Partial<AppEnvironment> = {
  VITE_API_BASE_URL: "http://localhost:8000", // Default to local Vite dev server
  DEV: false,
  PROD: true,
  MODE: "production",
};

/**
 * Environment manager for safe access to Vite environment variables
 */
class EnvironmentManager {
  private cachedEnv: Record<string, unknown> | null = null;

  /**
   * Get Vite environment object safely
   */
  private getViteEnv(): Record<string, unknown> | null {
    if (this.cachedEnv !== null) {
      return this.cachedEnv;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const env = (import.meta as any).env;
      if (env && typeof env === "object") {
        this.cachedEnv = env;
        return env;
      }
    } catch {
      // Not in a Vite environment
    }

    return null;
  }

  /**
   * Get an environment variable with type safety
   */
  get<K extends keyof AppEnvironment>(key: K): AppEnvironment[K] {
    const env = this.getViteEnv();

    if (env && key in env) {
      return env[key] as AppEnvironment[K];
    }

    return ENV_DEFAULTS[key] as AppEnvironment[K];
  }

  /**
   * Check if running in development mode
   */
  get isDev(): boolean {
    const env = this.getViteEnv();
    if (env) {
      return env.DEV === true || env.MODE === "development";
    }
    return false;
  }

  /**
   * Check if running in production mode
   */
  get isProd(): boolean {
    const env = this.getViteEnv();
    if (env) {
      return env.PROD === true || env.MODE === "production";
    }
    return true;
  }

  /**
   * Get the API base URL
   */
  get apiBaseUrl(): string {
    return this.get("VITE_API_BASE_URL");
  }
}

/**
 * Singleton environment manager instance
 */
export const env = new EnvironmentManager();
