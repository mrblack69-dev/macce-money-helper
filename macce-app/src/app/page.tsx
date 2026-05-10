"use client"

import { motion } from "framer-motion"
import {
  useState,
  useEffect,
  useRef,
} from "react"

export default function Home() {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const [chat, setChat] = useState([
    {
      role: "assistant",
      content:
        "Hey — I’m MACCE. Ask me anything about money, goals, productivity, or life.",
    },
  ])

  const chatEndRef =
    useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [chat, loading])

  async function sendMessage() {
    if (!message.trim()) return

    const userMessage = {
      role: "user",
      content: message,
    }

    setChat((prev) => [
      ...prev,
      userMessage,
    ])

    const currentMessage = message

    setMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
        }),
      })

      const reader =
        res.body?.getReader()

      if (!reader) return

      let fullText = ""

      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
        },
      ])

      while (true) {
        const { done, value } =
          await reader.read()

        if (done) break

        const chunk =
          new TextDecoder().decode(value)

        fullText += chunk

        setChat((prev) => {
          const updated = [...prev]

          updated[
            updated.length - 1
          ] = {
            role: "assistant",
            content: fullText,
          }

          return updated
        })
      }
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Something broke. Try again in a second.",
        },
      ])
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#050b16] text-white flex overflow-hidden">
      <aside className="w-72 bg-[#07111f]/90 border-r border-cyan-400/10 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold text-cyan-300 mb-2">
            MACCE
          </h1>

          <p className="text-gray-400 mb-10">
            Your AI companion for money,
            goals, and life
          </p>

          <nav className="space-y-4">
            {[
              "Dashboard",
              "Transactions",
              "Budget",
              "Goals",
              "AI Insights",
              "Reports",
              "Settings",
            ].map((item, index) => (
              <div
                key={item}
                className={`rounded-2xl p-4 transition ${
                  index === 0
                    ? "bg-cyan-400/15 border border-cyan-300/30 text-cyan-200"
                    : "bg-white/5 hover:bg-white/10 text-gray-300"
                }`}
              >
                {item}
              </div>
            ))}
          </nav>
        </div>

        <div className="bg-white/5 border border-cyan-300/20 rounded-3xl p-5">
          <p className="text-cyan-300 font-semibold">
            MACCE is online
          </p>

          <p className="text-gray-400 text-sm mt-2">
            Always here. Always
            learning.
          </p>
        </div>
      </aside>

      <section className="flex-1 p-8 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-400/10 blur-[120px] rounded-full"></div>

        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full"></div>

        <div className="relative z-10 flex justify-between items-start mb-8">
          <div>
            <h2 className="text-5xl font-bold mb-3">
              Welcome back
            </h2>

            <p className="text-gray-400 text-lg">
              Here’s your money,
              goals, and life
              overview.
            </p>
          </div>

          <div className="flex gap-4 text-gray-300">
            <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              🔔
            </div>

            <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              ⚙️
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-6">
            <div className="grid grid-cols-4 gap-5">
              <Card
                title="Net Worth"
                value="$28,420.75"
                note="↗ 4.3% this month"
                good
              />

              <Card
                title="Income"
                value="$5,870.00"
                note="↗ 8.7% this month"
                good
              />

              <Card
                title="Expenses"
                value="$2,845.50"
                note="↘ 3.2% this month"
                bad
              />

              <Card
                title="Savings Rate"
                value="32%"
                note="↗ 6% this month"
                good
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                <h3 className="text-xl font-semibold mb-6">
                  Cash Flow
                  Overview
                </h3>

                <div className="h-64 flex items-end gap-3">
                  {[
                    35, 42, 40, 52,
                    50, 63, 70, 76,
                    82, 90, 95, 100,
                  ].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end"
                    >
                      <div
                        className="rounded-t-xl bg-gradient-to-t from-cyan-500 to-green-400 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                        style={{
                          height: `${height}%`,
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                <h3 className="text-xl font-semibold mb-6">
                  Spending
                  Breakdown
                </h3>

                <div className="flex items-center justify-center h-64">
                  <div className="w-44 h-44 rounded-full border-[28px] border-cyan-400 border-t-purple-500 border-r-blue-500 border-b-green-400 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        $2,845
                      </p>

                      <p className="text-gray-400 text-sm">
                        Total
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-xl font-semibold mb-5">
                  Financial Goals
                </h3>

                <Goal
                  title="Emergency Fund"
                  amount="$3,250 / $10,000"
                  progress="32%"
                  width="32%"
                />

                <Goal
                  title="Vacation Fund"
                  amount="$1,850 / $5,000"
                  progress="37%"
                  width="37%"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-xl font-semibold mb-5">
                  Recent
                  Transactions
                </h3>

                <Transaction
                  name="Starbucks"
                  amount="-$4.75"
                  bad
                />

                <Transaction
                  name="Salary Deposit"
                  amount="+$2,935.00"
                  good
                />

                <Transaction
                  name="Amazon"
                  amount="-$89.99"
                  bad
                />

                <Transaction
                  name="Uber"
                  amount="-$23.45"
                  bad
                />
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-6">
            <div className="relative min-h-[520px] flex items-center justify-center">
              <motion.div
                className="absolute w-[420px] h-[420px] bg-cyan-400/20 blur-[80px] rounded-full"
                animate={{
                  opacity: [
                    0.25, 0.45, 0.25,
                  ],
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                className="absolute bottom-6 w-72 h-10 rounded-full border border-cyan-300/40 bg-cyan-400/10 blur-sm"
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [
                    0.45, 0.75, 0.45,
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.img
                src="/macce.png"
                alt="MACCE"
                className="relative w-[430px] drop-shadow-[0_0_45px_rgba(34,211,238,0.45)]"
                animate={{
                  y: [0, -28, 0],
                  scale: [
                    1, 1.025, 1,
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            <div className="bg-white/5 border border-cyan-300/20 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,0.08)]">
              <h3 className="text-xl font-semibold mb-4">
                Ask MACCE ✨
              </h3>

              <div className="space-y-3 h-[280px] overflow-y-auto mb-4 pr-2">
                {chat.map(
                  (msg, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl p-4 ${
                        msg.role ===
                        "assistant"
                          ? "bg-cyan-500/10 text-gray-200"
                          : "bg-purple-500/10 text-white"
                      }`}
                    >
                      {msg.content}
                    </div>
                  )
                )}

                {loading && (
                  <div className="bg-cyan-500/10 rounded-2xl p-4 text-gray-300">
                    MACCE is
                    thinking...
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <input
                type="text"
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    sendMessage()
                  }
                }}
                placeholder="Talk to MACCE..."
                className="
                  w-full
                  bg-black/20
                  border
                  border-white/10
                  rounded-2xl
                  p-4
                  text-white
                  outline-none
                "
              />

              <button
                onClick={sendMessage}
                className="
                  mt-4
                  w-full
                  bg-gradient-to-r
                  from-cyan-500
                  to-purple-500
                  px-5
                  py-3
                  rounded-2xl
                  font-semibold
                  hover:scale-[1.02]
                  transition
                "
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Card({
  title,
  value,
  note,
  good,
  bad,
}: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <p className="text-gray-400 mb-3">
        {title}
      </p>

      <h3 className="text-3xl font-bold mb-3">
        {value}
      </h3>

      <p
        className={
          good
            ? "text-green-400"
            : bad
            ? "text-orange-400"
            : "text-gray-400"
        }
      >
        {note}
      </p>
    </div>
  )
}

function Goal({
  title,
  amount,
  progress,
  width,
}: any) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <div>
          <p>{title}</p>

          <p className="text-gray-400 text-sm">
            {amount}
          </p>
        </div>

        <p>{progress}</p>
      </div>

      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
          style={{ width }}
        ></div>
      </div>
    </div>
  )
}

function Transaction({
  name,
  amount,
  good,
  bad,
}: any) {
  return (
    <div className="flex justify-between border-b border-white/10 py-3">
      <p>{name}</p>

      <p
        className={
          good
            ? "text-green-400"
            : bad
            ? "text-red-400"
            : "text-gray-300"
        }
      >
        {amount}
      </p>
    </div>
  )
}