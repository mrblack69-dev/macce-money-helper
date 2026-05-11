"use client"

import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

const tabs = [
  "Dashboard",
  "Transactions",
  "Budget",
  "Goals",
  "AI Insights",
  "Reports",
  "Settings",
]

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [signupMode, setSignupMode] = useState(false)
  const [activeTab, setActiveTab] = useState("Dashboard")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [theme, setTheme] = useState("Neon Dark")
  const [personality, setPersonality] = useState("Companion")
  const [firstName, setFirstName] = useState("")
const [lastName, setLastName] = useState("")
const [phone, setPhone] = useState("")
const [mainGoal, setMainGoal] = useState("")
const [incomeRange, setIncomeRange] = useState("")
const [profileSaved, setProfileSaved] = useState(false)

  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey — I’m MACCE. Ask me anything about money, goals, productivity, or life.",
    },
  ])

  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const audioQueue = useRef<HTMLAudioElement[]>([])
  const currentAudio = useRef<HTMLAudioElement | null>(null)
  const isPlaying = useRef(false)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat, loading])

  function stopVoice() {
    audioQueue.current = []

    if (currentAudio.current) {
      currentAudio.current.pause()
      currentAudio.current.currentTime = 0
      currentAudio.current = null
    }

    isPlaying.current = false
  }

  async function playAudioQueue() {
    if (!voiceEnabled) return
    if (isPlaying.current || audioQueue.current.length === 0) return

    isPlaying.current = true

    const audio = audioQueue.current.shift()

    if (!audio) {
      isPlaying.current = false
      return
    }

    currentAudio.current = audio

    audio.onended = () => {
      currentAudio.current = null
      isPlaying.current = false
      playAudioQueue()
    }

    audio.onerror = () => {
      currentAudio.current = null
      isPlaying.current = false
      playAudioQueue()
    }

    audio.play().catch(() => {
      currentAudio.current = null
      isPlaying.current = false
    })
  }

  async function generateVoice(text: string) {
    if (!voiceEnabled) return
    if (!text.trim()) return

    try {
      const voiceRes = await fetch("/api/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!voiceRes.ok) return

      const audioBlob = await voiceRes.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audioQueue.current.push(audio)
      playAudioQueue()
    } catch {
      // Voice should never break chat
    }
  }

  async function saveProfile() {
  console.log("saveProfile running")

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  console.log("user:", user)
  console.log("userError:", userError)

  if (!user) {
    alert("No logged in user found")
    return
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      main_goal: mainGoal,
      income_range: incomeRange,
    })
    .select()

  console.log("profile save data:", data)
  console.log("profile save error:", error)

  if (error) {
    alert(error.message)
    return
  }

  setProfileSaved(true)

  setTimeout(() => {
    setProfileSaved(false)
  }, 2500)
}
  async function sendMessage() {
    if (!message.trim() || loading) return

    stopVoice()

    const currentMessage = message.trim()

    setChat((prev) => [
      ...prev,
      {
        role: "user",
        content: currentMessage,
      },
      {
        role: "assistant",
        content: "",
      },
    ])

    setMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          personality,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error("Chat request failed")
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let fullText = ""
      let spokenText = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)

        try {
          const parsed = JSON.parse(chunk)
          fullText = parsed.message || chunk
        } catch {
          fullText += chunk
        }

        setChat((prev) => {
          const updated = [...prev]

          updated[updated.length - 1] = {
            role: "assistant",
            content: fullText,
          }

          return updated
        })

        const sentences = fullText.match(/[^.!?]+[.!?]+/g)

        if (sentences) {
          const completeSpeech = sentences.join(" ")

          if (completeSpeech.length > spokenText.length) {
            const newSpeech = completeSpeech.slice(spokenText.length).trim()
            spokenText = completeSpeech
            generateVoice(newSpeech)
          }
        }
      }

      const leftover = fullText.slice(spokenText.length).trim()

      if (leftover) {
        generateVoice(leftover)
      }
    } catch {
      setChat((prev) => {
        const updated = [...prev]

        updated[updated.length - 1] = {
          role: "assistant",
          content: "Something broke. Check the terminal and try again.",
        }

        return updated
      })
    }

    setLoading(false)
  }

  if (!loggedIn) {
    return (
      <main className={`min-h-screen ${getThemeBackground(theme)} text-white flex items-center justify-center p-6 overflow-hidden`}>
        <div className="absolute w-[700px] h-[700px] bg-cyan-400/10 blur-[130px] rounded-full"></div>

        <div className="relative w-full max-w-md bg-white/5 border border-cyan-400/20 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.08)]">
          <div className="flex flex-col items-center mb-8">
            <motion.img
              src="/macce.png"
              alt="MACCE"
              className="w-48 mb-6 drop-shadow-[0_0_35px_rgba(34,211,238,0.45)]"
              animate={{
                y: [0, -14, 0],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <h1 className="text-5xl font-bold text-cyan-300">MACCE</h1>

            <p className="text-gray-400 mt-3 text-center">
              Your AI companion for money, goals, and life
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
            />

            <button
              onClick={async () => {
  if (!email.trim() || !password.trim()) {
    alert("Enter email and password")
    return
  }

  if (signupMode) {
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
      })

    console.log(data)
    console.log(error)

    if (error) {
      alert(error.message)
      return
    }

    alert("Account created. Now login.")
    setSignupMode(false)
  } else {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    console.log(data)
    console.log(error)

    if (error) {
      alert(error.message)
      return
    }

    if (!data.session) {
      alert("No session created")
      return
    }

    setLoggedIn(true)
  }
}}
            >
              {signupMode ? "Create Account" : "Login"}
            </button>

            <button
              onClick={() => setSignupMode(!signupMode)}
              className="text-sm text-gray-400 w-full text-center hover:text-cyan-300 transition"
            >
              {signupMode
                ? "Already have an account? Login"
                : "Need an account? Create one"}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen ${getThemeBackground(theme)} text-white flex flex-col lg:flex-row overflow-hidden`}>
      <aside className="w-full lg:w-72 bg-[#07111f]/90 border-r border-cyan-400/10 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold text-cyan-300 mb-2">MACCE</h1>

          <p className="text-gray-400 mb-10">
            Your AI companion for money, goals, and life
          </p>

          <nav className="space-y-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left rounded-2xl p-4 transition ${
                  activeTab === tab
                    ? "bg-cyan-400/15 border border-cyan-300/30 text-cyan-200"
                    : "bg-white/5 hover:bg-white/10 text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-3 mt-6">
          <div className="bg-white/5 border border-cyan-300/20 rounded-3xl p-5">
            <p className="text-cyan-300 font-semibold">MACCE is online</p>
            <p className="text-gray-400 text-sm mt-2">
              Always here. Always learning.
            </p>
          </div>

          <button
            onClick={() => {
              stopVoice()
              setLoggedIn(false)
            }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      <section className="flex-1 p-4 lg:p-8 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-400/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
          <div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-3">
              {activeTab}
            </h2>

            <p className="text-gray-400 text-lg">
              {activeTab === "Dashboard"
                ? "Here’s your money, goals, and life overview."
                : `Manage your ${activeTab.toLowerCase()} with MACCE.`}
            </p>
          </div>

          <div className="flex gap-4 text-gray-300">
            <button className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              🔔
            </button>

            <button
              onClick={() => setActiveTab("Settings")}
              className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
            >
              ⚙️
            </button>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            {activeTab === "Dashboard" && <DashboardContent />}
            {activeTab === "Transactions" && <TransactionsContent />}
            {activeTab === "Budget" && <BudgetContent />}
            {activeTab === "Goals" && <GoalsContent />}
            {activeTab === "AI Insights" && <InsightsContent />}
            {activeTab === "Reports" && <ReportsContent />}
            {activeTab === "Settings" && (
              <SettingsContent
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                phone={phone}
                setPhone={setPhone}
                mainGoal={mainGoal}
                setMainGoal={setMainGoal}
                incomeRange={incomeRange}
                setIncomeRange={setIncomeRange}
                saveProfile={saveProfile}
                profileSaved={profileSaved}
                voiceEnabled={voiceEnabled}
                setVoiceEnabled={setVoiceEnabled}
                stopVoice={stopVoice}
                theme={theme}
                setTheme={setTheme}
                personality={personality}
                setPersonality={setPersonality}
              />
            )}
          </div>

          <div className="xl:col-span-4 space-y-6">
            <div className="relative min-h-[360px] lg:min-h-[520px] flex items-center justify-center">
              <motion.div
                className="absolute w-[260px] h-[260px] lg:w-[420px] lg:h-[420px] bg-cyan-400/20 blur-[80px] rounded-full"
                animate={{
                  opacity: [0.25, 0.45, 0.25],
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                className="absolute bottom-6 w-52 lg:w-72 h-10 rounded-full border border-cyan-300/40 bg-cyan-400/10 blur-sm"
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.45, 0.75, 0.45],
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
                className="relative w-[260px] sm:w-[320px] lg:w-[430px] drop-shadow-[0_0_45px_rgba(34,211,238,0.45)]"
                animate={{
                  y: [0, -28, 0],
                  scale: [1, 1.025, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            <div className="bg-white/5 border border-cyan-300/20 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,0.08)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Ask MACCE ✨</h3>

                <button
                  onClick={() => {
                    stopVoice()
                    setVoiceEnabled(!voiceEnabled)
                  }}
                  className={`text-xs rounded-xl px-3 py-2 ${
                    voiceEnabled
                      ? "bg-cyan-500/20 text-cyan-200"
                      : "bg-white/5 text-gray-400"
                  }`}
                >
                  {voiceEnabled ? "Voice On" : "Voice Off"}
                </button>
              </div>

              <div className="space-y-3 h-[320px] overflow-y-auto mb-4 pr-2">
                {chat.map((msg, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl p-4 whitespace-pre-wrap ${
                      msg.role === "assistant"
                        ? "bg-cyan-500/10 text-gray-200"
                        : "bg-purple-500/10 text-white"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}

                {loading && (
                  <div className="bg-cyan-500/10 rounded-2xl p-4 text-gray-300">
                    MACCE is thinking...
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage()
                  }
                }}
                placeholder="Talk to MACCE..."
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white outline-none"
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-3 rounded-2xl font-semibold hover:scale-[1.02] transition disabled:opacity-60"
              >
                {loading ? "Thinking..." : "Send"}
              </button>
            </div>

            <UpcomingBills />
          </div>
        </div>
      </section>
    </main>
  )
}

function getThemeBackground(theme: string) {
  if (theme === "Ocean") return "bg-[#031b26]"
  if (theme === "Midnight") return "bg-[#020617]"
  if (theme === "Purple") return "bg-[#12051f]"
  return "bg-[#050b16]"
}

function DashboardContent() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card title="Net Worth" value="$28,420.75" note="↗ 4.3% this month" good />
        <Card title="Income" value="$5,870.00" note="↗ 8.7% this month" good />
        <Card title="Expenses" value="$2,845.50" note="↘ 3.2% this month" bad />
        <Card title="Savings Rate" value="32%" note="↗ 6% this month" good />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowCard />
        <SpendingBreakdownCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalsMiniCard />
        <TransactionsMiniCard />
      </div>

      <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-cyan-300/20 rounded-3xl p-5 text-cyan-200">
        ✨ Small steps today, big freedom tomorrow.
      </div>
    </>
  )
}

function TransactionsContent() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <h3 className="text-2xl font-semibold mb-6">Transactions</h3>

      <Transaction name="Starbucks" amount="-$4.75" bad />
      <Transaction name="Salary Deposit" amount="+$2,935.00" good />
      <Transaction name="Amazon" amount="-$89.99" bad />
      <Transaction name="Uber" amount="-$23.45" bad />
      <Transaction name="Home Depot" amount="-$90.00" bad />
      <Transaction name="Target Diapers" amount="-$70.00" bad />
    </div>
  )
}

function BudgetContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BudgetCard title="Food" spent="$480" limit="$650" width="74%" />
      <BudgetCard title="Gas" spent="$220" limit="$350" width="63%" />
      <BudgetCard title="Kids" spent="$390" limit="$500" width="78%" />
      <BudgetCard title="Tools/Home" spent="$210" limit="$300" width="70%" />
    </div>
  )
}

function GoalsContent() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <h3 className="text-2xl font-semibold mb-6">Goals</h3>

      <Goal title="Emergency Fund" amount="$3,250 / $10,000" progress="32%" width="32%" />
      <Goal title="Vacation Fund" amount="$1,850 / $5,000" progress="37%" width="37%" />
      <Goal title="Debt Payoff" amount="$4,200 / $17,000" progress="25%" width="25%" />
      <Goal title="Business Fund" amount="$600 / $5,000" progress="12%" width="12%" />
    </div>
  )
}

function InsightsContent() {
  return (
    <div className="space-y-6">
      <InsightCard
        title="Eating Out"
        text="Food spending is one of your easiest wins. Cutting two meals out per week could free up real money fast."
      />

      <InsightCard
        title="Irregular Spending"
        text="Home project purchases should probably get their own sinking fund so they stop surprising your budget."
      />

      <InsightCard
        title="Cash Flow"
        text="Your income looks strong, but the goal is making your money predictable instead of reactive."
      />
    </div>
  )
}

function ReportsContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ReportCard title="Monthly Spending Report" />
      <ReportCard title="Savings Opportunity Report" />
      <ReportCard title="Debt Payoff Report" />
      <ReportCard title="Income Forecast Report" />
    </div>
  )
}

function SettingsContent({
    firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  mainGoal,
  setMainGoal,
  incomeRange,
  setIncomeRange,
  saveProfile,
  profileSaved,
  voiceEnabled,
  setVoiceEnabled,
  stopVoice,
  theme,
  setTheme,
  personality,
  setPersonality,
}: {
    firstName: string
  setFirstName: (value: string) => void
  lastName: string
  setLastName: (value: string) => void
  phone: string
  setPhone: (value: string) => void
  mainGoal: string
  setMainGoal: (value: string) => void
  incomeRange: string
  setIncomeRange: (value: string) => void
  saveProfile: () => void
  profileSaved: boolean
  voiceEnabled: boolean
  setVoiceEnabled: (value: boolean) => void
  stopVoice: () => void
  theme: string
  setTheme: (value: string) => void
  personality: string
  setPersonality: (value: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h3 className="text-2xl font-semibold mb-6">Settings</h3>

        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 py-4">
            <div>
              <p className="font-semibold">MACCE Voice</p>
              <p className="text-gray-400 text-sm">
                Turn AI voice playback on or off.
              </p>
            </div>

            <button
              onClick={() => {
                stopVoice()
                setVoiceEnabled(!voiceEnabled)
              }}
              className={`rounded-2xl px-5 py-3 ${
                voiceEnabled
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "bg-white/5 text-gray-400"
              }`}
            >
              {voiceEnabled ? "On" : "Off"}
            </button>
          </div>

          <div className="border-b border-white/10 py-4">
            <p className="font-semibold mb-3">Personality</p>

            <div className="grid grid-cols-2 gap-3">
              {["Companion", "Coach", "Chill", "Analyst"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPersonality(mode)}
                  className={`rounded-2xl p-3 transition ${
                    personality === mode
                      ? "bg-cyan-500/20 border border-cyan-300/30 text-cyan-200"
                      : "bg-white/5 text-gray-300"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="py-4">
            <p className="font-semibold mb-3">Theme</p>

            <div className="grid grid-cols-2 gap-3">
              {["Neon Dark", "Ocean", "Midnight", "Purple"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`rounded-2xl p-3 transition ${
                    theme === mode
                      ? "bg-cyan-500/20 border border-cyan-300/30 text-cyan-200"
                      : "bg-white/5 text-gray-300"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <p className="text-gray-400 text-sm mt-4">
              Current theme: {theme}
            </p>
          </div>
          
          <div className="space-y-4 pt-6">
  <h4 className="text-xl font-semibold">Profile</h4>

  <input
    type="text"
    placeholder="First Name"
    value={firstName}
    onChange={(e) => setFirstName(e.target.value)}
    className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
  />

  <input
    type="text"
    placeholder="Last Name"
    value={lastName}
    onChange={(e) => setLastName(e.target.value)}
    className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
  />

  <input
    type="text"
    placeholder="Phone Number"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
  />

  <input
    type="text"
    placeholder="Main Financial Goal"
    value={mainGoal}
    onChange={(e) => setMainGoal(e.target.value)}
    className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
  />

  <input
    type="text"
    placeholder="Income Range"
    value={incomeRange}
    onChange={(e) => setIncomeRange(e.target.value)}
    className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
  />

  <button
  type="button"
  onClick={() => {
    console.log("Save Profile clicked")
    saveProfile()
  }}
  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl px-5 py-3 font-semibold hover:scale-[1.02] transition"
>
  Save Profile
</button>

  {profileSaved && (
    <p className="text-green-400 text-sm">
      Profile saved.
    </p>
  )}
</div>
        </div>
      </div>
    </div>
  )
}

function CashFlowCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-6">Cash Flow Overview</h3>

      <div className="h-64 flex items-end gap-3">
        {[35, 42, 40, 52, 50, 63, 70, 76, 82, 90, 95, 100].map(
          (height, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <div
                className="rounded-t-xl bg-gradient-to-t from-cyan-500 to-green-400 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                style={{ height: `${height}%` }}
              ></div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function SpendingBreakdownCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-6">Spending Breakdown</h3>

      <div className="flex items-center justify-center h-64">
        <div className="w-44 h-44 rounded-full border-[28px] border-cyan-400 border-t-purple-500 border-r-blue-500 border-b-green-400 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">$2,845</p>
            <p className="text-gray-400 text-sm">Total</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function GoalsMiniCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <h3 className="text-xl font-semibold mb-5">Financial Goals</h3>

      <Goal title="Emergency Fund" amount="$3,250 / $10,000" progress="32%" width="32%" />
      <Goal title="Vacation Fund" amount="$1,850 / $5,000" progress="37%" width="37%" />
    </div>
  )
}

function TransactionsMiniCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <h3 className="text-xl font-semibold mb-5">Recent Transactions</h3>

      <Transaction name="Starbucks" amount="-$4.75" bad />
      <Transaction name="Salary Deposit" amount="+$2,935.00" good />
      <Transaction name="Amazon" amount="-$89.99" bad />
      <Transaction name="Uber" amount="-$23.45" bad />
    </div>
  )
}

function UpcomingBills() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <h3 className="text-xl font-semibold mb-4">Upcoming Bills</h3>

      <Bill name="Rent" date="Jun 1" amount="$1,200.00" />
      <Bill name="Car Insurance" date="Jun 5" amount="$120.00" />
      <Bill name="Phone Bill" date="Jun 8" amount="$65.00" />
    </div>
  )
}

function Card({
  title,
  value,
  note,
  good,
  bad,
}: {
  title: string
  value: string
  note: string
  good?: boolean
  bad?: boolean
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <p className="text-gray-400 mb-3">{title}</p>
      <h3 className="text-3xl font-bold mb-3">{value}</h3>

      <p
        className={
          good ? "text-green-400" : bad ? "text-orange-400" : "text-gray-400"
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
}: {
  title: string
  amount: string
  progress: string
  width: string
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <div>
          <p>{title}</p>
          <p className="text-gray-400 text-sm">{amount}</p>
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
}: {
  name: string
  amount: string
  good?: boolean
  bad?: boolean
}) {
  return (
    <div className="flex justify-between border-b border-white/10 py-3">
      <p>{name}</p>

      <p
        className={
          good ? "text-green-400" : bad ? "text-red-400" : "text-gray-300"
        }
      >
        {amount}
      </p>
    </div>
  )
}

function Bill({
  name,
  date,
  amount,
}: {
  name: string
  date: string
  amount: string
}) {
  return (
    <div className="flex justify-between py-3 border-b border-white/10">
      <div>
        <p>{name}</p>
        <p className="text-gray-400 text-sm">{date}</p>
      </div>

      <p>{amount}</p>
    </div>
  )
}

function BudgetCard({
  title,
  spent,
  limit,
  width,
}: {
  title: string
  spent: string
  limit: string
  width: string
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-gray-400 text-sm">
            {spent} used of {limit}
          </p>
        </div>
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

function InsightCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white/5 border border-cyan-300/20 rounded-3xl p-6">
      <h3 className="text-xl font-semibold text-cyan-300 mb-3">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{text}</p>
    </div>
  )
}

function ReportCard({ title }: { title: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-400 mb-5">
        Generate a clean MACCE report for this area.
      </p>

      <button className="bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl px-5 py-3 font-semibold">
        Generate Report
      </button>
    </div>
  )
}
