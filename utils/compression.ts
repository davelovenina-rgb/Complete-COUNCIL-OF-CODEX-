
import pako from 'pako';

/**
 * SOVEREIGN COMPRESSION ENGINE v1.0
 * Uses Pako (zlib) to reduce the storage footprint of the Rodriguez Archive.
 */

export const compressText = (text: string): string => {
    try {
        const uint8 = new TextEncoder().encode(text);
        const compressed = pako.deflate(uint8);
        // Store as base64 to ensure IndexedDB string compatibility across shells
        return btoa(String.fromCharCode.apply(null, compressed as any));
    } catch (e) {
        console.error("Compression Failed:", e);
        return text;
    }
};

export const decompressText = (base64: string): string => {
    try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const decompressed = pako.inflate(bytes);
        return new TextDecoder().decode(decompressed);
    } catch (e) {
        // Fallback for uncompressed data or errors
        return base64;
    }
};
