/**
 * Authentication Service Interface
 *
 * Single source of truth for token management.
 * All services that need auth should call getTokens().
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface IAuthService {
  /**
   * Get current authentication tokens
   * Returns null if not authenticated
   */
  getTokens(): Promise<AuthTokens | null>;

  /**
   * Save tokens (e.g., after login or token refresh)
   */
  saveTokens(tokens: AuthTokens): Promise<void>;

  /**
   * Save tokens from external source (e.g., sync service refresh)
   * This is used when another service refreshes tokens
   */
  saveTokensExternal(tokens: AuthTokens): Promise<void>;

  /**
   * Clear all tokens (logout)
   */
  clearTokens(): Promise<void>;

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Check if access token is expired
   */
  isTokenExpired(): Promise<boolean>;
}
