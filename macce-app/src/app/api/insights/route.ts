import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

function cleanCategory(category: string) {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase())
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userId = body.user_id

    const { data, error } = await supabaseAdmin
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
    const insights: string[] = []
    const categoryTotals: Record<string, number> = {}

    let totalSpent = 0

    for (const tx of transactions) {
      const amount = Number(tx.amount)

      if (amount > 0) {
        totalSpent += amount

        const category = tx.category || "Other"

        categoryTotals[category] =
          (categoryTotals[category] || 0) + amount
      }
    }

    const topCategory = Object.entries(
      categoryTotals
    ).sort((a, b) => b[1] - a[1])[0]

    if (topCategory) {
      const categoryName =
        cleanCategory(topCategory[0])

      const categoryAmount =
        topCategory[1].toFixed(2)

      insights.push(
        "Your highest spending category is " +
          categoryName +
          " at $" +
          categoryAmount
      )
    }

    if (totalSpent > 2000) {
      insights.push(
        "Your spending is elevated this month."
      )
    }

    if (
      (categoryTotals[
        "FOOD_AND_DRINK"
      ] || 0) > 300
    ) {
      insights.push(
        "Dining spending is unusually high this month."
      )
    }

    return NextResponse.json({
      insights,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to generate insights",
      },
      { status: 500 }
    )
  }
}