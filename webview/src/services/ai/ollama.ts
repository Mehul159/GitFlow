import type { AIResponse } from "../../types/ai";

const OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_MODEL = "gemma2:2b";

export class OllamaError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "OllamaError";
  }
}

let cachedModels: string[] = [];

export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getAvailableModels(): Promise<string[]> {
  if (cachedModels !== null) {
    return cachedModels;
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      throw new OllamaError("Failed to fetch models");
    }

    const data = await response.json();
    cachedModels = data.models?.map((m: { name: string }) => m.name) || [];
    return cachedModels;
  } catch {
    cachedModels = [];
    return cachedModels;
  }
}

export async function selectBestModel(): Promise<string> {
  const models = await getAvailableModels();
  
  const preferred = ["gemma2:2b", "phi4", "llama3.3", "mistral", "codellama"];
  
  for (const preferredModel of preferred) {
    const found = models.find((m) => m.startsWith(preferredModel));
    if (found) {
      return found;
    }
  }

  return models[0] || DEFAULT_MODEL;
}

export async function generateWithOllama(
  prompt: string,
  model?: string,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AIResponse> {
  const selectedModel = model || await selectBestModel();

  const body = {
    model: selectedModel,
    prompt,
    stream: false,
    options: {
      temperature: options.temperature ?? 0.7,
      num_predict: options.maxTokens ?? 2048,
    },
  };

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new OllamaError(
        `Ollama error: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    
    if (!data.response) {
      throw new OllamaError("Invalid response from Ollama");
    }

    return {
      content: data.response,
      provider: "ollama",
      cached: false,
    };
  } catch (error) {
    if (error instanceof OllamaError) {
      throw error;
    }
    throw new OllamaError(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

export function isOllamaError(error: unknown): error is OllamaError {
  return error instanceof OllamaError;
}
