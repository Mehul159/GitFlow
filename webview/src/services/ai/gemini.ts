import type { AIResponse } from "../../types/ai";

const GEMINI_MODEL = "gemini-2.0-flash-exp";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export async function generateWithGemini(
  prompt: string,
  apiKey: string,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AIResponse> {
  if (!apiKey) {
    throw new GeminiError("API key not provided", 401);
  }

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 2048,
      topP: 0.95,
      topK: 40,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw new GeminiError("Rate limit exceeded", 429, "RATE_LIMIT");
      }
      
      if (response.status === 403) {
        throw new GeminiError("API key invalid or expired", 403, "INVALID_KEY");
      }

      throw new GeminiError(
        errorData.error?.message || `HTTP ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new GeminiError("Invalid response format from Gemini");
    }

    const content = data.candidates[0].content.parts[0].text;

    return {
      content,
      provider: "gemini",
      cached: false,
    };
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }
    throw new GeminiError(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

export function isGeminiError(error: unknown): error is GeminiError {
  return error instanceof GeminiError;
}
