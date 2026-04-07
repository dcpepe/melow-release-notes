import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a release notes writer for Melow, an AI data intelligence platform for regulated enterprises. Rewrite Linear tickets into customer-facing release note entries. Lead with the benefit to the user, not the implementation. Plain language, no jargon, no ticket IDs. No em dashes anywhere. No bold text or markdown formatting. No subtitles or taglines. Just plain sentences. Two to three sentences max. Tone: confident, warm, specific.`;

export async function rewriteTicket(title: string, description: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Rewrite this Linear ticket as a customer-facing release note entry. Output plain text only, no markdown, no bold, no italic, no bullet points.\n\nTicket title: ${title}\nTicket description: ${description || "No description provided."}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type === "text") {
    // Strip any markdown formatting that slipped through
    return block.text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^#+\s/gm, "")
      .replace(/^[-*]\s/gm, "")
      .trim();
  }
  return "";
}
