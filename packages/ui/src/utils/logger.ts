/* eslint-disable @typescript-eslint/no-explicit-any */

const PREFIX = "[Immergo]";

/**
 * Simple console logger with prefixes
 */
export const serviceLogger = {
    qmServer: (msg: string, ...args: any[]) => console.log(`${PREFIX}[QmServer]`, msg, ...args),
    qmServerDebug: (msg: string, ...args: any[]) => console.debug(`${PREFIX}[QmServer]`, msg, ...args),
    qmServerError: (msg: string, ...args: any[]) => console.error(`${PREFIX}[QmServer]`, msg, ...args),
    sync: (msg: string, ...args: any[]) => console.log(`${PREFIX}[Sync]`, msg, ...args),
    syncDebug: (msg: string, ...args: any[]) => console.debug(`${PREFIX}[Sync]`, msg, ...args),
    syncError: (msg: string, ...args: any[]) => console.error(`${PREFIX}[Sync]`, msg, ...args),
    auth: (msg: string, ...args: any[]) => console.log(`${PREFIX}[Auth]`, msg, ...args),
    authDebug: (msg: string, ...args: any[]) => console.debug(`${PREFIX}[Auth]`, msg, ...args),
    authError: (msg: string, ...args: any[]) => console.error(`${PREFIX}[Auth]`, msg, ...args),
};
