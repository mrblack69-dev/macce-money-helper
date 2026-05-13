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

    const { data: analytics } =
      await supabaseAdmin
        .from("financial_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

    const { data: bills } =
      await supabaseAdmin
        .from("bills")
        .select("*")
        .eq("user_id", userId)

    const alerts = []

    if (analytics?.avg_savings_rate < 10) {
      alerts.push({
        user_id: userId,
        type: "warning",
        title: "Savings rate is getting low",
        message:
          "Your current spending pace may make saving difficult this month.",
      })
    }

    if (analytics?.top_category === "TRAVEL") {
      alerts.push({
        user_id: userId,
        type: "insight",
        title: "Travel spending is elevated",
        message:
          "Travel has been your largest spending category recently.",
      })
    }

    const upcomingBills = (bills || []).filter((bill) => {
      const due = new Date(bill.predicted_next_date)
      const now = new Date()

      const diffDays =
        (due.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)

      return diffDays <= 7 && diffDays >= 0
    })

    for (const bill of upcomingBills) {
      alerts.push({
        user_id: userId,
        type: "bill",
        title: `Upcoming bill: ${bill.merchant_name}`,
        message: `Expected around ${new Date(
  bill.predicted_next_date
).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
})} for $${Number(
          bill.average_amount
        ).toFixed(2)}`,
      })
    }


    for (const alert of alerts) {
      await supabaseAdmin
        .from("alerts")
        .insert(alert)
    }

    return NextResponse.json({
      success: true,
      alerts,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Failed to generate alerts" },
      { status: 500 }
    )
  }
}