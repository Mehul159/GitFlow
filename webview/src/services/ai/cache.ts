import type { AICacheEntry } from "../../types/ai";

const CACHE_PREFIX = "ai_cache_";
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getCachedResponse(inputHash: string): Promise<string | null> {
  try {
    const key = CACHE_PREFIX + inputHash;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: AICacheEntry = JSON.parse(cached);
    const now = Date.now();

    if (now - entry.createdAt > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.response;
  } catch {
    return null;
  }
}

export async function storeCachedResponse(
  inputHash: string,
  response: string,
  provider: string
): Promise<void> {
  try {
    const key = CACHE_PREFIX + inputHash;
    const entry: AICacheEntry = {
      inputHash,
      response,
      provider,
      createdAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error("Failed to cache AI response:", error);
  }
}

export async function clearAICache(): Promise<void> {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Failed to clear AI cache:", error);
  }
}

export async function getCacheSize(): Promise<number> {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      count++;
    }
  }
  return count;
}
