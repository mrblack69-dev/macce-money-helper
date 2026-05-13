"use client"

import {
  Home,
  MessageCircle,
  CreditCard,
  Bell,
  User,
} from "lucide-react"

type Props = {
  activeTab: string
  setActiveTab: (
    tab: string
  ) => void
}

export default function MobileNav({
  activeTab,
  setActiveTab,
}: Props) {
  const tabs = [
    {
      id: "Dashboard",
      label: "Home",
      icon: Home,
    },
    {
      id: "chat",
      label: "AI",
      icon: MessageCircle,
    },
    {
      id: "Transactions",
      label: "Money",
      icon: CreditCard,
    },
    {
      id: "Alerts",
      label: "Alerts",
      icon: Bell,
    },
    {
      id: "Profile",
      label: "Profile",
      icon: User,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 md:hidden pb-safe">
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon

          const active =
            activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`flex flex-col items-center justify-center py-3 transition ${
                active
                  ? "text-cyan-300"
                  : "text-white/50"
              }`}
            >
              <Icon size={22} />

              <span className="text-xs mt-1">
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}