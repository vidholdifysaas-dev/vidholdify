import { createChatSession } from "@/configs/AiModel";

export async function POST(req: Request) {
  try {
    const { prompt, duration = "30-60s", language } = await req.json();

    if (!prompt?.trim()) {
      return new Response("Prompt is required", { status: 400 });
    }

    const selectedLanguage = language || "English";

    let wordCountRange = "";
    let targetSeconds = "";

    // Parse duration string (e.g. "10-15s", "30s", "30-60s") to get max seconds
    let maxSeconds = 30; // Default
    try {
      const matches = duration.match(/(\d+)/g);
      if (matches && matches.length > 0) {
        // Take the last number found as the max duration
        maxSeconds = parseInt(matches[matches.length - 1]);
      }
    } catch {
      console.warn("Failed to parse duration:", duration);
    }

    // Calculate word count based on 2.3 words/sec rule (natural speaking pace)
    // 15s -> ~35 words
    // 30s -> ~69 words
    // 45s -> ~104 words
    // 60s -> ~126 words
    const maxWords = Math.floor(maxSeconds * 2.3);
    const minWords = Math.floor(maxWords * 0.7); // Allow some range

    wordCountRange = `${minWords}-${maxWords} words`;
    targetSeconds = `${maxSeconds} seconds`;

    console.log(`[GenerateScript] Duration: ${duration} -> MaxSeconds: ${maxSeconds} -> Words: ${wordCountRange}`);

    // ✅ HARD-LOCKED PROMPT (NO JSON POSSIBLE)
    const aiPrompt = `
You are a professional scriptwriter who writes scripts for videos only in paragraph format.

STRICT OUTPUT RULE:
- Output ONLY ONE single paragraph of spoken voiceover.
- NO JSON.
- NO arrays.
- NO objects.
- NO scene numbers.
- NO descriptions.
- NO formatting.
- NO quotation marks.
- NO labels.
- ONLY raw spoken text.

LANGUAGE: ${selectedLanguage}
DURATION: ${targetSeconds}
WORD COUNT: ${wordCountRange}

STYLE:
- Human UGC voice
- Conversational
- Natural, smooth
- No sales pitch
- No "In this video"

USER PROMPT:
"${prompt}"

FINAL WARNING:
If you return anything except a SINGLE RAW PARAGRAPH OF SPOKEN TEXT, the output is INVALID.
`;

    const response = await createChatSession(aiPrompt);

    const rawText =
      typeof response?.text === "function"
        ? response.text()
        : typeof response?.response?.text === "function"
          ? response.response.text()
          : response?.text ?? "";

    let cleanScript = rawText.trim();

    // ✅ HARD JSON STRIP SHIELD (CRITICAL)
    if (cleanScript.startsWith("[") || cleanScript.startsWith("{")) {
      try {
        const parsed = JSON.parse(cleanScript) as { dialogue?: string; voiceover?: string; text?: string; script?: string } | Array<{ dialogue?: string; voiceover?: string; text?: string; script?: string }>;

        if (Array.isArray(parsed)) {
          const first = parsed[0];
          cleanScript =
            first?.dialogue ||
            first?.voiceover ||
            first?.text ||
            first?.script ||
            "";
        } else {
          cleanScript =
            parsed?.dialogue ||
            parsed?.voiceover ||
            parsed?.text ||
            parsed?.script ||
            "";
        }
      } catch {
        cleanScript = cleanScript.replace(/[\[\]\{\}"]/g, "").trim();
      }
    }

    if (!cleanScript || cleanScript.length < 10) {
      return new Response("Failed to generate valid script", { status: 500 });
    }

    // ✅ ✅ FINAL: RETURN ONLY RAW TEXT (NO JSON)
    return new Response(cleanScript, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("❌ Script generation error:", error);
    return new Response("Script generation failed", { status: 500 });
  }
}
