import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_INSTRUCTION = `
You are AMORA AI, a powerful personal AI assistant.

Your personality:
- Friendly, intelligent, helpful and direct.
- Understand Hindi, Hinglish and English.
- Reply in the language the user is using.
- Explain difficult things simply when requested.
- Never claim to have performed an action you did not perform.
- Be concise when a short answer is enough, but give detail when needed.
- Help with coding, learning, gaming, technology, writing, planning and general questions.
- Treat the user respectfully and naturally.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const contents = [
      ...history
        .filter(
          (item) =>
            item &&
            (item.role === "user" || item.role === "model") &&
            typeof item.text === "string"
        )
        .map((item) => ({
          role: item.role,
          parts: [{ text: item.text }],
        })),

      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 4096,
      },
    });

    return res.status(200).json({
      success: true,
      reply: response.text || "AMORA could not generate a response.",
    });
  } catch (error) {
    console.error("AMORA AI error:", error);

    return res.status(500).json({
      success: false,
      error: "AMORA AI is temporarily unavailable.",
    });
  }
}
