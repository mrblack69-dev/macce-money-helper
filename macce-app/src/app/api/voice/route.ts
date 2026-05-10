import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const body = await req.json()

  const mp3 = await client.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "cedar",
    input: body.text,
  })

  const buffer = Buffer.from(
    await mp3.arrayBuffer()
  )

  return new Response(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
    },
  })
}