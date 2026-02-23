import { logger } from "@immersive-lang/shared";

/**
 * Domain-specific logger wrappers for consistent logging across services
 */
export const serviceLogger = {
    /**
     * Log HTTP-related messages
     */
    http: (msg: string, ...args: unknown[]) => logger.info("HTTP", msg, ...args),
    httpError: (msg: string, ...args: unknown[]) => logger.error("HTTP", msg, ...args),
    httpDebug: (msg: string, ...args: unknown[]) => logger.debug("HTTP", msg, ...args),

    /**
     * Log Tauri IPC messages
     */
    tauri: (msg: string, ...args: unknown[]) => logger.info("Tauri IPC", msg, ...args),
    tauriError: (msg: string, ...args: unknown[]) => logger.error("Tauri IPC", msg, ...args),
    tauriDebug: (msg: string, ...args: unknown[]) => logger.debug("Tauri IPC", msg, ...args),

    /**
     * Log authentication-related messages
     */
    auth: (msg: string, ...args: unknown[]) => logger.info("Auth", msg, ...args),
    authError: (msg: string, ...args: unknown[]) => logger.error("Auth", msg, ...args),
    authDebug: (msg: string, ...args: unknown[]) => logger.debug("Auth", msg, ...args),

    /**
     * Log service factory messages
     */
    factory: (msg: string, ...args: unknown[]) => logger.info("ServiceFactory", msg, ...args),
    factoryError: (msg: string, ...args: unknown[]) => logger.error("ServiceFactory", msg, ...args),
    factoryDebug: (msg: string, ...args: unknown[]) => logger.debug("ServiceFactory", msg, ...args),

    /**
     * Log QM server messages
     */
    qmServer: (msg: string, ...args: unknown[]) => logger.info("QmServer", msg, ...args),
    qmServerError: (msg: string, ...args: unknown[]) => logger.error("QmServer", msg, ...args),
    qmServerDebug: (msg: string, ...args: unknown[]) => logger.debug("QmServer", msg, ...args),

    /**
     * Log sync adapter messages
     */
    sync: (msg: string, ...args: unknown[]) => logger.info("Sync", msg, ...args),
    syncError: (msg: string, ...args: unknown[]) => logger.error("Sync", msg, ...args),
    syncDebug: (msg: string, ...args: unknown[]) => logger.debug("Sync", msg, ...args),

    /**
     * Log Gemini Live API messages
     */
    gemini: (msg: string, ...args: unknown[]) => logger.info("Gemini", msg, ...args),
    geminiError: (msg: string, ...args: unknown[]) => logger.error("Gemini", msg, ...args),
    geminiDebug: (msg: string, ...args: unknown[]) => logger.debug("Gemini", msg, ...args),

    /**
     * Log session-related messages
     */
    session: (msg: string, ...args: unknown[]) => logger.info("Session", msg, ...args),
    sessionError: (msg: string, ...args: unknown[]) => logger.error("Session", msg, ...args),
    sessionDebug: (msg: string, ...args: unknown[]) => logger.debug("Session", msg, ...args),
};
