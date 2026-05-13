import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userId = body.user_id

    const { data: transactions } =
      await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("user_id", userId)

    const { data: bills } =
      await supabaseAdmin
        .from("bills")
        .select("*")
        .eq("user_id", userId)

    let income = 0
    let spending = 0

    for (const tx of transactions || []) {
      const amount = Number(tx.amount)

      if (amount < 0) {
        income += Math.abs(amount)
      } else {
        spending += amount
      }
    }

    const upcomingBills =
      (bills || []).reduce(
        (sum, bill) =>
          sum +
          Number(
            bill.average_amount
          ),
        0
      )

    const safeToSpend =
      income -
      spending -
      upcomingBills

    return NextResponse.json({
      income,
      spending,
      upcomingBills,
      safeToSpend,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to calculate safe to spend",
      },
      { status: 500 }
    )
  }
}