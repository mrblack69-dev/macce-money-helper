import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

let conversationHistory: any[] = []

export async function POST(req: Request) {
  const body = await req.json()

  conversationHistory.push({
    role: "user",
    content: body.message,
  })

  const stream = await client.responses.stream({
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
`,
      },
      ...conversationHistory,
    ],
  })

  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      let fullResponse = ""

      for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
          const chunk = event.delta

          fullResponse += chunk

          controller.enqueue(encoder.encode(chunk))
        }
      }

      conversationHistory.push({
        role: "assistant",
        content: fullResponse,
      })

      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20)
      }

      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}