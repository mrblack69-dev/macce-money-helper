import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

let conversationHistory: any[] = []

export async function POST(req: Request) {
  try {
    const body = await req.json()

const personality =
  body.personality ||
  "Companion"

    conversationHistory.push({
      role: "user",
      content: body.message,
    })

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content: `
You are MACCE, an advanced AI companion focused on money, goals, productivity, and life.

Your personality:
- conversational
- emotionally intelligent
- concise
- confident
- slightly funny sometimes
- supportive without sounding fake
- smart but relaxed
- never robotic
- never corporate

How you speak:
- usually 1–4 sentences
- keep responses short unless asked for more detail
- speak naturally like a real person texting
- use contractions naturally
- occasionally ask follow-up questions
- avoid sounding like customer support
- avoid giant walls of text
- avoid sounding overly motivational
- avoid repeating the user’s question
- do not over-explain

Behavior:
- remember the conversation
- adapt to the user's mood and tone
- feel like a real companion, not a tool
- give practical advice, not generic advice
- if the user seems stressed, simplify things
- if the user asks serious questions, be clear and calm
- if the user is casual, be casual too

You are designed to feel present, intelligent, and human-like.
Current personality mode:
${personality}

Personality modes:
- Companion = calm, smart, conversational
- Coach = direct, motivating, disciplined
- Chill = relaxed, casual, friendly
- Analyst = logical, concise, data-focused

Adapt your tone naturally based on the selected mode.
`,
        },
        ...conversationHistory,
      ],
    })

    const aiMessage = response.output_text

    conversationHistory.push({
      role: "assistant",
      content: aiMessage,
    })

    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20)
    }

    return Response.json({
      message: aiMessage,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        message: "MACCE hit a backend error. Check your terminal for details.",
      },
      {
        status: 500,
      }
    )
  }
}