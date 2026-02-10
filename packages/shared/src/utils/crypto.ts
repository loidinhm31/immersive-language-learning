/**
 * Simple encryption utilities for localStorage using Web Crypto API.
 * Uses AES-GCM with PBKDF2 key derivation.
 */

const APP_ENCRYPTION_KEY = "immersive-lang-v1";

/**
 * Encrypt a plaintext string for secure localStorage storage.
 * @param plaintext The string to encrypt
 * @returns Base64-encoded ciphertext (salt + iv + encrypted data)
 */
export async function encryptForStorage(plaintext: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Derive key from app identifier using PBKDF2
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(APP_ENCRYPTION_KEY), "PBKDF2", false, [
        "deriveKey",
    ]);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"],
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

    // Combine salt + iv + ciphertext, encode as base64
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a ciphertext string from localStorage.
 * @param ciphertext Base64-encoded ciphertext from encryptForStorage
 * @returns The original plaintext string
 */
export async function decryptFromStorage(ciphertext: string): Promise<string> {
    const encoder = new TextEncoder();
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(APP_ENCRYPTION_KEY), "PBKDF2", false, [
        "deriveKey",
    ]);

    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"],
    );

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);

    return new TextDecoder().decode(decrypted);
}
