import type { AIProvider, AIResponse, AITask } from "../../types/ai";
import { generateWithGemini, isGeminiError } from "./gemini";
import { generateWithGroq, isGroqError } from "./groq";
import { generateWithOllama, checkOllamaAvailable } from "./ollama";
import { getCachedResponse, storeCachedResponse } from "./cache";
import { queueAIRequest } from "./queue";
import { sha256 } from "../../utils/sha256";

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  forceProvider?: AIProvider;
}

const providerOrder: AIProvider[] = ["gemini", "groq", "ollama"];

let ollamaAvailable = false;

export async function initAIProviders(): Promise<void> {
  ollamaAvailable = await checkOllamaAvailable();
}

export function isOllamaAvailable(): boolean {
  return ollamaAvailable;
}

export async function aiRequest(
  prompt: string,
  _task: AITask,
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const inputHash = await sha256(prompt);

  const cached = await getCachedResponse(inputHash);
  if (cached) {
    return {
      content: cached,
      provider: "gemini",
      cached: true,
    };
  }

  const providers = options.forceProvider
    ? [options.forceProvider]
    : providerOrder.filter((p) => {
        if (p === "ollama") return ollamaAvailable;
        return true;
      });

  const geminiKey = localStorage.getItem("gemini_api_key") || "";
  const groqKey = localStorage.getItem("groq_api_key") || "";

  const lastError: Error[] = [];

  for (const provider of providers) {
    try {
      let response: AIResponse;

      const requestFn = async () => {
        switch (provider) {
          case "gemini":
            if (!geminiKey) throw new Error("No Gemini API key");
            return generateWithGemini(prompt, geminiKey, {
              temperature: options.temperature,
              maxTokens: options.maxTokens,
            });
          case "groq":
            if (!groqKey) throw new Error("No Groq API key");
            return generateWithGroq(prompt, groqKey, {
              temperature: options.temperature,
              maxTokens: options.maxTokens,
            });
          case "ollama":
            return generateWithOllama(prompt, undefined, {
              temperature: options.temperature,
              maxTokens: options.maxTokens,
            });
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }
      };

      response = await queueAIRequest(requestFn);

      await storeCachedResponse(inputHash, response.content, provider);

      return response;
    } catch (error) {
      const isRateLimit =
        isGeminiError(error) && error.code === "RATE_LIMIT" ||
        isGroqError(error) && error.code === "RATE_LIMIT";

      if (!isRateLimit) {
        lastError.push(error as Error);
      }

      continue;
    }
  }

  throw lastError[0] || new Error("All AI providers failed");
}

export async function generateCommitMessage(
  diff: string,
  recentCommits: string[]
): Promise<{ subject: string; body?: string; confidence: number }> {
  const prompt = `Analyze this diff and write a git commit message following Conventional Commits spec.
Subject line max 72 chars. Be specific about what changed and why.

Diff:
${diff}

Recent commits for context:
${recentCommits.join("\n")}

Output JSON only:
{ "subject": "...", "body": "...", "confidence": 0.0 }`;

  const response = await aiRequest(prompt, "commitMessage");

  try {
    const parsed = JSON.parse(response.content);
    return {
      subject: parsed.subject || "Update",
      body: parsed.body,
      confidence: parsed.confidence || 0.5,
    };
  } catch {
    return {
      subject: response.content.slice(0, 72),
      confidence: 0.3,
    };
  }
}

export async function resolveConflict(
  ours: string,
  theirs: string,
  base: string,
  filename: string
): Promise<{ resolution: string; confidence: number; reasoning: string; winner: "ours" | "theirs" | "mixed" }> {
  const prompt = `You are resolving a git merge conflict in ${filename}.

OURS:
${ours}

THEIRS:
${theirs}

BASE:
${base}

Provide the best merged result. Explain your reasoning. Output JSON only:
{ "resolution": "...", "confidence": 0, "reasoning": "...", "winner": "ours|theirs|mixed" }`;

  const response = await aiRequest(prompt, "conflictResolution");

  try {
    return JSON.parse(response.content);
  } catch {
    return {
      resolution: ours,
      confidence: 0.3,
      reasoning: "Failed to parse AI response",
      winner: "ours",
    };
  }
}

export async function suggestBranchName(description: string): Promise<{ name: string; alternatives: string[] }> {
  const prompt = `Generate a git branch name for: '${description}'.
Follow: type/short-description. Types: feature, bugfix, hotfix, chore, refactor.

Output JSON:
{ "name": "...", "alternatives": ["...", "..."] }`;

  const response = await aiRequest(prompt, "branchName");

  try {
    return JSON.parse(response.content);
  } catch {
    const slug = description.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
    return {
      name: `feature/${slug}`,
      alternatives: [`bugfix/${slug}`, `refactor/${slug}`],
    };
  }
}

export async function scoreRisk(
  operation: "push" | "merge" | "force-push" | "rebase",
  files: string[],
  branches: string[]
): Promise<{ score: number; risks: string[]; recommendation: string }> {
  const prompt = `Rate the risk (0-100) of this git operation: ${operation}
Affected files: ${files.join(", ")}. Branches: ${branches.join(", ")}.

Output JSON:
{ "score": 0, "risks": [], "recommendation": "..." }`;

  const response = await aiRequest(prompt, "riskScore");

  try {
    return JSON.parse(response.content);
  } catch {
    return {
      score: 50,
      risks: ["Unable to analyze risk"],
      recommendation: "Proceed with caution",
    };
  }
}
