import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      user_id,
      role,
      content,
    } = body

    if (
      !user_id ||
      !role ||
      !content
    ) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      )
    }

    await supabaseAdmin
      .from("ai_memories")
      .insert({
        user_id,
        role,
        content,
      })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to save memory",
      },
      { status: 500 }
    )
  }
}