import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { data, error } =
      await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("user_id", body.user_id)
        .order("date", {
          ascending: false,
        })
        .limit(50)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      transactions: data || [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Failed to load transactions",
      },
      { status: 500 }
    )
  }
}