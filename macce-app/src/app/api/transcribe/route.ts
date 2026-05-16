import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const audio = formData.get("audio")

    if (!(audio instanceof File)) {
      return NextResponse.json(
        {
          error: "No audio file received",
        },
        { status: 400 }
      )
    }

    const transcription =
      await openai.audio.transcriptions.create({
        model: "gpt-4o-transcribe",
        file: audio,
        language: "en",
      })

    return NextResponse.json({
      text: transcription.text || "",
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: "Failed to transcribe audio",
      },
      { status: 500 }
    )
  }
}