import * as https from "https";

export interface SuggestKeys {
  gemini: string;
  groq: string;
}

export interface SuggestResult {
  message: string;
  error?: string;
}

const PROMPT =
  "You write concise Git commit messages (imperative mood, <=72 chars first line). " +
  "Reply with ONLY the commit subject line, no quotes or markdown, based on this staged diff:\n\n";

function heuristicMessage(diff: string): string {
  const lines = diff.split("\n").filter((l) => l.startsWith("diff --git"));
  if (lines.length === 1) {
    const m = lines[0].match(/b\/(.+)$/);
    if (m) {
      return `Update ${m[1].split("/").pop() ?? m[1]}`;
    }
  }
  if (lines.length > 1) {
    return `Update ${lines.length} files`;
  }
  return "chore: apply staged changes";
}

async function geminiSuggest(apiKey: string, diff: string): Promise<string> {
  const body = JSON.stringify({
    contents: [
      {
        parts: [{ text: PROMPT + diff.slice(0, 120_000) }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 128,
    },
  });

  const path =
    "/v1beta/models/gemini-2.0-flash:generateContent?key=" +
    encodeURIComponent(apiKey);

  const raw = await httpsRequest(
    {
      hostname: "generativelanguage.googleapis.com",
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body
  );

  const parsed = JSON.parse(raw) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (parsed.error?.message) {
    throw new Error(parsed.error.message);
  }
  const text =
    parsed.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!text) {
    throw new Error("Empty response from Gemini");
  }
  return text.split("\n")[0].trim();
}

async function groqSuggest(apiKey: string, diff: string): Promise<string> {
  const body = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: diff.slice(0, 120_000) },
    ],
    temperature: 0.3,
    max_tokens: 128,
  });

  const raw = await httpsRequest(
    {
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body
  );

  const parsed = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (parsed.error?.message) {
    throw new Error(parsed.error.message);
  }
  const text = parsed.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    throw new Error("Empty response from Groq");
  }
  return text.split("\n")[0].replace(/^["']|["']$/g, "").trim();
}

function httpsRequest(
  opts: https.RequestOptions,
  body: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c as Buffer));
      res.on("end", () => {
        const txt = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(txt || `HTTP ${res.statusCode}`));
        } else {
          resolve(txt);
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function suggestCommitMessage(
  diff: string,
  keys: SuggestKeys
): Promise<SuggestResult> {
  if (keys.gemini) {
    try {
      const message = await geminiSuggest(keys.gemini, diff);
      return { message };
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      if (keys.groq) {
        try {
          const message = await groqSuggest(keys.groq, diff);
          return { message };
        } catch (e2: unknown) {
          return {
            message: heuristicMessage(diff),
            error: `Gemini: ${err}; Groq: ${e2 instanceof Error ? e2.message : String(e2)}`,
          };
        }
      }
      return { message: heuristicMessage(diff), error: err };
    }
  }
  if (keys.groq) {
    try {
      const message = await groqSuggest(keys.groq, diff);
      return { message };
    } catch (e: unknown) {
      return {
        message: heuristicMessage(diff),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
  return { message: heuristicMessage(diff) };
}
