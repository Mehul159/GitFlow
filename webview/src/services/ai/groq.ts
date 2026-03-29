import type { AIResponse } from "../../types/ai";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

export class GroqError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "GroqError";
  }
}

export async function generateWithGroq(
  prompt: string,
  apiKey: string,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AIResponse> {
  if (!apiKey) {
    throw new GroqError("API key not provided", 401);
  }

  const url = GROQ_BASE_URL;

  const body = {
    model: GROQ_MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw new GroqError("Rate limit exceeded", 429, "RATE_LIMIT");
      }
      
      if (response.status === 401) {
        throw new GroqError("API key invalid", 401, "INVALID_KEY");
      }

      throw new GroqError(
        errorData.error?.message || `HTTP ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new GroqError("Invalid response format from Groq");
    }

    const content = data.choices[0].message.content;

    return {
      content,
      provider: "groq",
      cached: false,
    };
  } catch (error) {
    if (error instanceof GroqError) {
      throw error;
    }
    throw new GroqError(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

export function isGroqError(error: unknown): error is GroqError {
  return error instanceof GroqError;
}
