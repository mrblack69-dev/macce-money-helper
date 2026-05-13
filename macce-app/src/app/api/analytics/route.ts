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

    const { data, error } =
      await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("user_id", userId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const transactions = data || []

    let income = 0
    let expenses = 0

    const categoryTotals:
      Record<string, number> = {}

    for (const tx of transactions) {
  const amount = Number(tx.amount)

  if (amount > 0) {
    expenses += amount

    const category =
      tx.category || "Other"

    categoryTotals[category] =
      (categoryTotals[category] || 0) +
      amount
  } else {
    income += Math.abs(amount)
  }
}

    return NextResponse.json({
      income,
      expenses,
      net: income - expenses,
      categories: categoryTotals,
      transactionCount:
        transactions.length,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to load analytics",
      },
      { status: 500 }
    )
  }
}