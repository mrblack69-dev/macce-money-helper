import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const rawText = body.text || ""

    const spokenText = rawText
      .replace(/MACCE/gi, "maychee")
      .replace(/\*\*/g, "")
      .replace(/\$/g, " dollars ")

    const mp3 = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "cedar",
      input: spokenText,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error(err)

    return new Response("Voice generation failed", {
      status: 500,
    })
  }
}