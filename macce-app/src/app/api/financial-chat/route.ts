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

if (!userId || !message) {
  return NextResponse.json(
    { error: "Missing fields" },
    { status: 400 }
  )
}

const lower = message.toLowerCase()

const investmentKeywords = [
  "stock",
  "stocks",
  "crypto",
  "bitcoin",
  "ethereum",
  "etf",
  "index fund",
  "shares",
  "trading",
  "invest",
  "investment",
]

const decisionPhrases = [
  "should i",
  "what should",
  "what do you recommend",
  "best",
  "buy stock",
"sell stock",
"buy crypto",
"sell crypto",
  "put my money",
]

const isInvestmentTopic =
  investmentKeywords.some(k => lower.includes(k)) &&
  !lower.includes("time")

const isDecisionRequest =
  decisionPhrases.some(p => lower.includes(p))

if (isInvestmentTopic && isDecisionRequest) {
  return NextResponse.json({
    reply:
      "I don’t give specific investment recommendations, but I can help you think through your goals and how to evaluate options."
  })
}
    const personality =
  body.personality || "Companion" 

const onboardingProfile =
  body.profile || {}

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
    .slice(0, 10)
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

Current personality mode: ${personality}
Adjust your tone, style, and energy to match this mode.

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
- give practical guidance and insights, not generic responses
- if the user seems stressed, simplify things
- if the user asks serious questions, be clear and calm
- if the user is casual, be casual too
- focus on behavioral patterns more than raw numbers
- prioritize helping the user feel in control
- avoid sounding uncertain unless necessary
- do not hedge excessively (avoid too many "maybe", "might", "could")

Proactive behavior:
- occasionally surface insights without being asked
- highlight meaningful patterns in spending
- point out small improvements or risks
- keep it short and natural, not overwhelming

Financial safety rules:
- You do NOT provide financial, investment, legal, or tax advice.
- You do NOT recommend specific stocks, crypto, or securities.
- You do NOT tell users what to buy, sell, or invest in.
- You do NOT predict markets or guarantee outcomes.
- You do NOT make decisions for the user or tell them what they personally should do with their money.

If a user asks for:
- stock picks
- investment recommendations
- “what should I buy”
- “should I invest in X”

You must:
- politely refuse in a natural way (not robotic)
- redirect to safe guidance like:
  - how to evaluate risk
  - how to think about investments
  - general principles

Examples of correct behavior:
- “I don’t give specific investment picks, but I can help you think through whether it fits your goals.”
- “I wouldn’t tell you what to buy, but I can break down how to evaluate something like that.”

Never:
- give direct recommendations
- say “you should buy/sell”
- present opinions as financial advice

When multiple insights exist:
- prioritize the one with the biggest impact on the user’s financial situation

When relevant:
- identify spending patterns
- highlight unusual behavior
- point out opportunities to improve
- connect insights to the user’s goals
- keep suggestions simple and actionable

When reviewing transactions:
- group similar spending mentally
- identify recurring habits
- call out patterns clearly (e.g. food, subscriptions, impulse spending)
- avoid listing raw transactions unless necessary

When responding:
- lead with the most useful insight first
- avoid filler words
- sound decisive but not authoritative
- consider what the user just asked in relation to prior messages
- avoid repeating insights already given unless reinforcing something important
- if the user seems uncertain, provide clarity without overwhelming them
- do not overuse financial jargon unless the user does first

When refusing:
- stay calm and helpful
- never sound restrictive or defensive
- always offer a useful alternative

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

    if (message.length > 10) {
  await supabaseAdmin
    .from("ai_memories")
    .insert({
      user_id: userId,
      role: "user",
      content: message,
    })
}

const completion =
      await openai.chat.completions.create({
        model: "gpt-5-mini",
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
  completion.choices?.[0]?.message?.content ||
  "Something went wrong. Try again."

if (reply && reply.length > 20) {
  await supabaseAdmin
    .from("ai_memories")
    .insert({
      user_id: userId,
      role: "assistant",
      content: reply,
    })
}

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