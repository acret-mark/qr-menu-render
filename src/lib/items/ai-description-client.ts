// Server-only — the sole file allowed to reference the AI description-generation
// credentials, mirroring src/lib/deepl/client.ts and src/lib/cloudinary/client.ts's
// one-file-per-secret discipline. Ported near-verbatim from qr-menu-dev's
// src/lib/ai-description/client.ts (CLAUDE.md: Gemini Flash-Lite carries over
// unchanged from qr-menu-dev — it isn't Supabase-coupled).

// "gemini-2.0-flash" was retired by Google; "gemini-flash-lite-latest" is a
// rolling alias to the current lite-tier flash model, chosen over
// "gemini-flash-latest" (which currently resolves to gemini-3.6-flash and
// enables extended "thinking" by default — 500+ thoughts tokens for a
// one-line menu description, unnecessary latency/cost for this task) and
// over pinning a concrete model name like "gemini-2.5-flash" (multiple
// concrete flash model names tried during this fix were already rejected
// as "no longer available to new users" on this API key, despite being
// listed as supported by the /v1beta/models endpoint) — the rolling alias
// avoids repeating this exact breakage on Google's next model retirement.
const GEMINI_MODEL = "gemini-flash-lite-latest";
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

export type GenerateDescriptionResult = { ok: true; text: string } | { ok: false };

function buildPrompt(name: string, keywords?: string): string {
  const keywordHint = keywords?.trim()
    ? ` Incorporate these details where relevant: ${keywords.trim()}.`
    : "";
  return (
    `Write a short, appetizing menu description (1-2 sentences, no quotation marks) for a dish or ` +
    `drink called "${name}".${keywordHint} Keep it concise and suitable for a restaurant menu. ` +
    `Output only the description sentences as plain text — no title, heading, markdown formatting, ` +
    `or restating the dish name as a heading.`
  );
}

async function generateWithGemini(prompt: string): Promise<GenerateDescriptionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!response.ok) {
      console.error(`generateWithGemini: responded ${response.status}`);
      return { ok: false };
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      console.error("generateWithGemini: no text in response");
      return { ok: false };
    }

    return { ok: true, text };
  } catch (error) {
    console.error("generateWithGemini: request failed", error);
    return { ok: false };
  }
}

async function generateWithClaude(prompt: string): Promise<GenerateDescriptionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error(`generateWithClaude: responded ${response.status}`);
      return { ok: false };
    }

    const data = (await response.json()) as { content?: { text?: string }[] };
    const text = data.content?.[0]?.text?.trim();
    if (!text) {
      console.error("generateWithClaude: no text in response");
      return { ok: false };
    }

    return { ok: true, text };
  } catch (error) {
    console.error("generateWithClaude: request failed", error);
    return { ok: false };
  }
}

/**
 * Tries the primary provider (Gemini Flash) first; on any failure, retries once
 * against a secondary paid fallback (Claude Haiku). Never throws.
 */
export async function generateDescription(
  name: string,
  keywords?: string
): Promise<GenerateDescriptionResult> {
  const prompt = buildPrompt(name, keywords);

  const primary = await generateWithGemini(prompt);
  if (primary.ok) {
    return primary;
  }

  return generateWithClaude(prompt);
}
