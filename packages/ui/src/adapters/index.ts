/**
 * Adapter Pattern Exports
 *
 * This module provides platform-agnostic service abstractions.
 * Use ServiceFactory to get the appropriate implementation for
 * the current platform (Tauri/Native vs Web).
 */

// Factory
export * from "@immersive-lang/ui/adapters/factory";

// Interfaces
export * from "@immersive-lang/ui/adapters/factory/interfaces";

// Platform detection
export * from "@immersive-lang/ui/adapters/shared";
