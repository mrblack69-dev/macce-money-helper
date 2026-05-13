import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userId = body.user_id

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gt("amount", 0)
      .order("date", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const grouped: Record<string, any[]> = {}

    for (const tx of data || []) {
        const raw = tx.raw || {}

const isSubscription =
  raw.personal_finance_category?.primary ===
    "SUBSCRIPTION" ||
  raw.personal_finance_category?.detailed
    ?.includes("SUBSCRIPTION") ||
  raw.transaction_code ===
    "subscription"

if (!isSubscription) continue
      const merchant = tx.merchant_name || tx.name

      if (!merchant) continue

      if (!grouped[merchant]) {
        grouped[merchant] = []
      }

      grouped[merchant].push(tx)
    }

    const subscriptions = []

    for (const merchant of Object.keys(grouped)) {
  const merchantTxs = grouped[merchant]

  if (merchantTxs.length < 3)
    continue

  const amounts = merchantTxs.map((tx) =>
    Number(tx.amount)
  )

  const avgAmount =
    amounts.reduce(
      (sum, amt) => sum + amt,
      0
    ) / amounts.length

  const similarAmounts =
    amounts.every(
      (amt) =>
        Math.abs(amt - avgAmount) <
        avgAmount * 0.25
    )

  if (!similarAmounts)
    continue

  const sorted = merchantTxs.sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  )

  const lastSeen = sorted[0].date
  const nextDate = new Date(lastSeen)

  nextDate.setDate(nextDate.getDate() + 30)

  const subscription = {
    user_id: userId,
    merchant_name: merchant,
    average_amount: avgAmount,
    transaction_count: merchantTxs.length,
    category: sorted[0].category,
    last_seen: lastSeen,
    predicted_next_date: nextDate
      .toISOString()
      .split("T")[0],
    confidence: Math.min(merchantTxs.length / 5, 1),
  }

      subscriptions.push(subscription)

      await supabaseAdmin
        .from("subscriptions")
        .upsert(subscription)
    }

    return NextResponse.json({
      success: true,
      subscriptions,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Failed to detect subscriptions" },
      { status: 500 }
    )
  }
}