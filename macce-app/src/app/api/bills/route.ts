import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userId = body.user_id

    const { data, error } =
      await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", {
          ascending: false,
        })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const transactions = data || []

    const grouped:
      Record<string, any[]> = {}

    for (const tx of transactions) {
      if (tx.amount <= 0) continue

      const merchant =
        tx.merchant_name ||
        tx.name

      if (!merchant) continue

      if (!grouped[merchant]) {
        grouped[merchant] = []
      }

      grouped[merchant].push(tx)
    }

    const detectedBills = []

    for (const merchant of Object.keys(grouped)) {
      const merchantTxs =
        grouped[merchant]

      if (merchantTxs.length < 2)
        continue

      const avgAmount =
        merchantTxs.reduce(
          (sum, tx) =>
            sum + Number(tx.amount),
          0
        ) / merchantTxs.length

      const sorted =
        merchantTxs.sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
        )

      const lastSeen =
        sorted[0].date

      const nextDate =
        new Date(lastSeen)

      nextDate.setDate(
        nextDate.getDate() + 30
      )

      const bill = {
        user_id: userId,
        merchant_name: merchant,
        category:
          sorted[0].category,
        average_amount:
          avgAmount,
        last_seen: lastSeen,
        predicted_next_date:
          nextDate
            .toISOString()
            .split("T")[0],
        confidence: Math.min(
          merchantTxs.length / 5,
          1
        ),
      }

      detectedBills.push(bill)

      await supabaseAdmin
        .from("bills")
        .upsert(bill)
    }

    return NextResponse.json({
      success: true,
      bills: detectedBills,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to detect bills",
      },
      { status: 500 }
    )
  }
}