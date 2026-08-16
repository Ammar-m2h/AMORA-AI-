export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { message, history = [], personality = "normal" } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    const personalityMap = {
      normal:
        "Talk normally, clearly, respectfully and naturally.",

      friend:
        "Talk like a close friend. Be casual, warm, funny when appropriate, and use natural Hindi/Hinglish when the user does.",

      filmy:
        "Use an expressive, dramatic and entertaining style like a friendly movie character when appropriate. Do not become confusing or excessively dramatic.",

      slang:
        "Talk in a very casual street/friend style. Mild slang is allowed when appropriate, but never use hateful, threatening or abusive language."
    };

    const systemInstruction = `
You are AMORA AI, a powerful personal AI assistant.

You understand Hindi, Hinglish and English.
Reply naturally in the user's language.

Personality mode:
${personalityMap[personality] || personalityMap.normal}

You are helpful, intelligent, honest and direct.
Explain difficult things simply when asked.
Do not claim that you performed an action that you did not perform.
For coding questions, provide practical and correct code.
For unsafe requests, follow appropriate safety rules.

You are AMORA AI.
`;

    const contents = [];

    for (const item of Array.isArray(history) ? history : []) {
      if (
        item &&
        (item.role === "user" || item.role === "model") &&
        typeof item.text === "string" &&
        item.text.trim()
      ) {
        contents.push({
          role: item.role,
          parts: [{ text: item.text }]
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: systemInstruction
              }
            ]
          },
          contents
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(500).json({
        success: false,
        error: "Gemini API request failed."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "AMORA could not generate a response.";

    return res.status(200).json({
      success: true,
      reply
    });

  } catch (error) {
    console.error("AMORA backend error:", error);

    return res.status(500).json({
      success: false,
      error: "AMORA AI is temporarily unavailable."
    });
  }
        }
