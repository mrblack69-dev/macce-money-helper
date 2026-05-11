import { NextResponse } from "next/server"
import { plaidClient } from "@/lib/plaid"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { data: itemData, error } =
      await supabaseAdmin
        .from("plaid_items")
        .select("*")
        .eq("user_id", body.user_id)
        .single()

    if (error || !itemData) {
      return NextResponse.json(
        { error: "No plaid item found" },
        { status: 404 }
      )
    }

    const response =
      await plaidClient.transactionsSync({
        access_token:
          itemData.access_token,
      })

    const transactions =
      response.data.added || []

    for (const tx of transactions) {
      await supabaseAdmin
        .from("transactions")
        .upsert({
          user_id: body.user_id,
          plaid_transaction_id:
            tx.transaction_id,
          account_id: tx.account_id,
          name: tx.name,
          merchant_name:
            tx.merchant_name,
          amount: tx.amount,
          date: tx.date,
          category:
            tx.personal_finance_category
              ?.primary || "Other",
          pending: tx.pending,
          raw: tx,
        })
    }

    return NextResponse.json({
      success: true,
      added: transactions.length,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to sync transactions",
      },
      { status: 500 }
    )
  }
}