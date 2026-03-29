export type AIProvider = "gemini" | "groq" | "ollama";

export interface AIRequest {
  prompt: string;
  task: AITask;
  provider?: AIProvider;
}

export type AITask =
  | "commitMessage"
  | "conflictResolution"
  | "branchName"
  | "prDescription"
  | "riskScore"
  | "rebasePredict"
  | "explain";

export interface AIResponse {
  content: string;
  provider: AIProvider;
  cached: boolean;
  confidence?: number;
}

export interface CommitMessageSuggestion {
  subject: string;
  body?: string;
  confidence: number;
}

export interface ConflictSuggestion {
  resolution: string;
  confidence: number;
  reasoning: string;
  winner: "ours" | "theirs" | "mixed";
}

export interface BranchNameSuggestion {
  name: string;
  alternatives: string[];
}

export interface PRDescription {
  title: string;
  body: string;
}

export interface RiskScore {
  score: number;
  risks: string[];
  recommendation: string;
}

export interface RebasePrediction {
  conflicts: string[];
  confidence: number;
}

export interface AIQuota {
  gemini: { used: number; limit: number };
  groq: { used: number; limit: number };
  ollama: { available: boolean };
}

export interface AICacheEntry {
  inputHash: string;
  response: string;
  provider: string;
  createdAt: number;
}
