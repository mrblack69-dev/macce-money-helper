"use client"

type Props = {
  chat: any[]
  loading: boolean
  message: string
  setMessage: (value: string) => void
  sendMessage: () => void
  voiceEnabled: boolean
  setVoiceEnabled: (
    value: boolean
  ) => void
  stopVoice: () => void
  chatEndRef: any
}

export default function AskMacceContent({
  chat,
  loading,
  message,
  setMessage,
  sendMessage,
  voiceEnabled,
  setVoiceEnabled,
  stopVoice,
  chatEndRef,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-cyan-300/20 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,0.08)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold">
            askMACCE ✨
          </h3>

          <button
            onClick={() => {
              stopVoice()
              setVoiceEnabled(
                !voiceEnabled
              )
            }}
            className={`min-h-[44px] text-xs rounded-xl px-3 py-2 ${
              voiceEnabled
                ? "bg-cyan-500/20 text-cyan-200"
                : "bg-white/5 text-gray-400"
            }`}
          >
            {voiceEnabled
              ? "Voice On"
              : "Voice Off"}
          </button>
        </div>

        <div className="space-y-3 h-[55vh] overflow-y-auto mb-4 pr-2">
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`rounded-2xl p-4 whitespace-pre-wrap ${
                msg.role ===
                "assistant"
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

        <div className="sticky bottom-20 z-40 bg-[#07111f]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-3">
          <input
            type="text"
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage()
              }
            }}
            placeholder="Talk to MACCE..."
            className="w-full min-h-[44px] bg-black/20 border border-white/10 rounded-2xl p-4 text-white outline-none"
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="min-h-[44px] mt-4 w-full bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-3 rounded-2xl font-semibold hover:scale-[1.02] transition disabled:opacity-60"
          >
            {loading
              ? "Thinking..."
              : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}