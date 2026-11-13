import { CryptoDigestAlgorithm, digest, getRandomValues } from "expo-crypto";
import { Platform } from "react-native";

// Supabase uses Web Crypto to create the verifier and SHA-256 challenge for PKCE.
export function installNativeAuthCrypto() {
    if (Platform.OS === "web") return;

    if (!globalThis.crypto) {
        Object.defineProperty(globalThis, "crypto", { value: {}, configurable: true });
    }
    if (!globalThis.crypto.getRandomValues) {
        Object.defineProperty(globalThis.crypto, "getRandomValues", { value: getRandomValues });
    }
    if (!globalThis.crypto.subtle) {
        Object.defineProperty(globalThis.crypto, "subtle", {
            value: {
                digest(algorithm: string | { name: string }, bytes: BufferSource) {
                    const name = typeof algorithm === "string" ? algorithm : algorithm.name;
                    if (name !== "SHA-256") throw new Error("Unsupported digest algorithm");
                    return digest(CryptoDigestAlgorithm.SHA256, bytes);
                },
            },
        });
    }
}
