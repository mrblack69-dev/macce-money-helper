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

    if (!transactions) {
      return NextResponse.json(
        { error: "No transactions found" },
        { status: 404 }
      )
    }

    let income = 0
    let spending = 0

    const categoryTotals:
      Record<string, number> = {}

    for (const tx of transactions) {
      const amount = Number(tx.amount)

      if (amount < 0) {
        income += Math.abs(amount)
      } else {
        spending += amount

        const category =
          tx.category || "Other"

        categoryTotals[category] =
          (categoryTotals[category] || 0) +
          amount
      }
    }

    const savingsRate =
      income > 0
        ? (
            ((income - spending) /
              income) *
            100
          ).toFixed(1)
        : "0"

    const topCategory =
      Object.entries(categoryTotals)
        .sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] || "Other"

    let spendingPersonality =
      "Balanced"

    if (spending > income * 0.9) {
      spendingPersonality =
        "High Spender"
    } else if (
      spending < income * 0.5
    ) {
      spendingPersonality =
        "Strong Saver"
    }

    let riskLevel = "Moderate"

    if (Number(savingsRate) > 30) {
      riskLevel = "Low"
    } else if (
      Number(savingsRate) < 10
    ) {
      riskLevel = "High"
    }

    const summary =
      `User spends most heavily on ${topCategory.replace(
        /_/g,
        " "
      )}. Savings rate is ${savingsRate}%. Financial behavior currently appears ${spendingPersonality.toLowerCase()}.`

    const profile = {
      user_id: userId,
      avg_monthly_income: income,
      avg_monthly_spending: spending,
      avg_savings_rate:
        Number(savingsRate),
      top_category: topCategory,
      risk_level: riskLevel,
      spending_personality:
        spendingPersonality,
      payday_pattern:
        "Biweekly detection coming soon",
      financial_summary: summary,
      updated_at: new Date().toISOString(),
    }

    await supabaseAdmin
      .from("financial_profiles")
      .upsert(profile)

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to build profile",
      },
      { status: 500 }
    )
  }
}