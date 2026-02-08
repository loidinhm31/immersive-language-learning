/**
 * Platform detection utilities
 */

export type Platform = "tauri" | "web";

/**
 * Detects if the app is running inside Tauri
 */
export function isTauri(): boolean {
    return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * Gets the current platform
 */
export function getPlatform(): Platform {
    return isTauri() ? "tauri" : "web";
}
