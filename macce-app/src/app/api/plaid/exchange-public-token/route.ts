import { NextResponse } from "next/server"
import { plaidClient } from "@/lib/plaid"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const exchangeResponse =
      await plaidClient.itemPublicTokenExchange({
        public_token: body.public_token,
      })

    const accessToken =
      exchangeResponse.data.access_token

    const itemId =
      exchangeResponse.data.item_id

    const { error } = await supabaseAdmin
      .from("plaid_items")
      .insert({
        user_id: body.user_id,
        item_id: itemId,
        access_token: accessToken,
        institution_name:
          body.institution_name || "Connected Bank",
      })

    if (error) {
      console.error(error)
      throw error
    }

    return NextResponse.json({
      success: true,
      item_id: itemId,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: "Failed to exchange public token",
      },
      { status: 500 }
    )
  }
}