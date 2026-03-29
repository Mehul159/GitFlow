import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { AIProvider, AIQuota } from "../types/ai";

interface AISlice {
  isGenerating: boolean;
  dailyUsage: Record<AIProvider, number>;
  lastError: string | null;
  queueLength: number;
  ollamaAvailable: boolean;
  activeProvider: AIProvider;
  quota: AIQuota;
  geminiKey: string;
  groqKey: string;
  setGenerating: (generating: boolean) => void;
  incrementUsage: (provider: AIProvider) => void;
  setError: (error: string | null) => void;
  setQueueLength: (length: number) => void;
  setOllamaAvailable: (available: boolean) => void;
  setActiveProvider: (provider: AIProvider) => void;
  setApiKeys: (gemini: string, groq: string) => void;
  resetDailyUsage: () => void;
}

export const useAIStore = create<AISlice>()(
  immer((set) => ({
    isGenerating: false,
    dailyUsage: {
      gemini: 0,
      groq: 0,
      ollama: 0,
    },
    lastError: null,
    queueLength: 0,
    ollamaAvailable: false,
    activeProvider: "gemini",
    quota: {
      gemini: { used: 0, limit: 500 },
      groq: { used: 0, limit: 1000 },
      ollama: { available: false },
    },
    geminiKey: "",
    groqKey: "",

    setGenerating: (generating) =>
      set((state) => {
        state.isGenerating = generating;
      }),

    incrementUsage: (provider) =>
      set((state) => {
        state.dailyUsage[provider]++;
        state.quota[provider].used = state.dailyUsage[provider];
      }),

    setError: (error) =>
      set((state) => {
        state.lastError = error;
      }),

    setQueueLength: (length) =>
      set((state) => {
        state.queueLength = length;
      }),

    setOllamaAvailable: (available) =>
      set((state) => {
        state.ollamaAvailable = available;
        state.quota.ollama.available = available;
      }),

    setActiveProvider: (provider) =>
      set((state) => {
        state.activeProvider = provider;
      }),

    setApiKeys: (gemini, groq) =>
      set((state) => {
        state.geminiKey = gemini;
        state.groqKey = groq;
      }),

    resetDailyUsage: () =>
      set((state) => {
        state.dailyUsage = {
          gemini: 0,
          groq: 0,
          ollama: 0,
        };
        state.quota.gemini.used = 0;
        state.quota.groq.used = 0;
      }),
  }))
);
