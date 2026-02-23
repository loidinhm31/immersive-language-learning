/**
 * Tauri IPC Invoke Wrapper
 *
 * Type-safe wrapper for Tauri invoke calls.
 */

import { invoke } from "@tauri-apps/api/core";
import { serviceLogger } from "@immersive-lang/ui/utils";

declare const __DEV__: boolean | undefined;

/**
 * Type-safe Tauri IPC invoke wrapper
 */
export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
        serviceLogger.tauriDebug(`${command}`, args);
    }
    const result = await invoke<T>(command, args);
    if (typeof __DEV__ !== "undefined" && __DEV__) {
        serviceLogger.tauriDebug(`${command} ->`, result);
    }
    return result;
}
