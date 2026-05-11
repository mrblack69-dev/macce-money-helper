import { NextResponse } from "next/server"
import { plaidClient } from "@/lib/plaid"

export async function POST() {
  try {
    const response =
      await plaidClient.linkTokenCreate({
        user: {
          client_user_id: "macce-user",
        },
        client_name: "MACCE",
        products: ["transactions"] as any,
        country_codes: ["US"],
        language: "en",
      })

    return NextResponse.json({
      link_token:
        response.data.link_token,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to create link token",
      },
      { status: 500 }
    )
  }
}