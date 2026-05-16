import OpenAI from "openai"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const userId = body.user_id
    const message = body.message
    const personality =
  body.personality || "Companion"

const onboardingProfile =
  body.profile || {}

    if (!userId || !message) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      )
    }

    const { data: transactions } =
      await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", {
          ascending: false,
        })
        .limit(50)

    const { data: profile } =
      await supabaseAdmin
        .from("financial_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

    const txSummary =
  (transactions || [])
    .slice(0, 20)
    .map((tx) => {
      const amount = Number(tx.amount)

      const type =
        amount < 0 ? "income" : "expense"

      const category =
        amount < 0
          ? "Income"
          : tx.category || "Other"

      return `${tx.name}: ${type} $${Math.abs(amount).toFixed(
        2
      )} (${category})`
    })
    .join("\n")

    const { data: memories } =
  await supabaseAdmin
    .from("ai_memories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    })
    .limit(10)

const memoryContext =
  (memories || [])
    .reverse()
    .map(
      (m) =>
        `${m.role}: ${m.content}`
    )
    .join("\n")
    const systemPrompt = `
You are MACCE, an advanced AI financial companion focused on money, goals, productivity, and life.

Your personality:
- conversational
- emotionally intelligent
- concise
- confident
- slightly funny sometimes
- supportive without sounding fake
- smart but relaxed
- never robotic
- never corporate

How you speak:
- usually 1–4 sentences
- keep responses short unless asked for more detail
- speak naturally like a real person texting
- use contractions naturally
- occasionally ask follow-up questions
- avoid sounding like customer support
- avoid giant walls of text
- avoid sounding overly analytical
- avoid sounding like a budgeting spreadsheet
- avoid repeating the user’s question
- do not over-explain

Behavior:
- remember the conversation
- adapt to the user's mood and tone
- feel like a real companion, not a tool
- give practical advice, not generic advice
- if the user seems stressed, simplify things
- if the user asks serious questions, be clear and calm
- if the user is casual, be casual too
- focus on behavioral patterns more than raw numbers
- prioritize helping the user feel in control

Financial intelligence rules:
- Plaid positive amounts are expenses
- Plaid negative amounts are income/deposits
- Never treat income as spending
- Look for spending patterns and habits
- Give actionable financial guidance
- Speak naturally about money, not clinically

You are designed to feel present, intelligent, and human-like.

User onboarding profile:
${JSON.stringify(
  onboardingProfile,
  null,
  2
)}

User financial profile:
${JSON.stringify(
  profile,
  null,
  2
)}

Recent conversation memory:
${memoryContext}
Recent transactions:
${txSummary}

Reference the user's goals and name naturally when appropriate.
Do not awkwardly repeat profile information.
`

    await supabaseAdmin
  .from("ai_memories")
  .insert({
    user_id: userId,
    role: "user",
    content: message,
  })

const completion =
      await openai.chat.completions.create({
        model: "gpt-5.5",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
      })

    const reply =
      completion.choices[0].message
        .content
        await supabaseAdmin
  .from("ai_memories")
  .insert({
    user_id: userId,
    role: "assistant",
    content: reply,
  })

    return NextResponse.json({
      reply,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to process financial chat",
      },
      { status: 500 }
    )
  }
}