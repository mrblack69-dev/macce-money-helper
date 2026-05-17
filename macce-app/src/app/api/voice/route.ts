import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const rawText = String(body.text || "")

    const spokenText = rawText
  .replace(/MACCE/gi, "maychee")
  .replace(/\*\*/g, "")
  .replace(/\$(\d+)/g, "$1 dollars")
  .replace(/(\d+)%/g, "$1 percent")
  .replace(
    /\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/gi,
    (match) => {
      const months: Record<string, string> = {
        jan: "January",
        feb: "February",
        mar: "March",
        apr: "April",
        jun: "June",
        jul: "July",
        aug: "August",
        sep: "September",
        oct: "October",
        nov: "November",
        dec: "December",
      }
      return months[match.toLowerCase()] || match
    }
  )
  .replace(/\b(\d{4,})\b/g, (value) => {
    const parsed = parseInt(value, 10)
    return isNaN(parsed)
      ? value
      : parsed.toLocaleString()
  })
  .replace(/\s+/g, " ");

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