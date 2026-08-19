"use client"

import { Archive, FileText, Home, Settings, Sparkles } from "lucide-react"
import type { Screen } from "@/lib/types"
import { cn } from "@/lib/utils"

export function AppSidebar({
  screen,
  setScreen,
  onSettingsClick,
}: {
  screen: Screen
  setScreen: (screen: Screen) => void
  onSettingsClick: () => void
}) {
  const bankActive = screen === "bank" || screen === "detail" || screen === "complete" || screen === "star"

  return (
    <aside className="m-[20px_20px_20px_0] flex w-[82px] flex-none flex-col items-center rounded-[18px] bg-[var(--color-sidebar)] px-3 py-3.5 text-[var(--color-sidebar-fg)] shadow-[0_14px_28px_#28314d25] max-[900px]:m-[10px_10px_10px_0] max-[900px]:w-[62px] max-[600px]:hidden">
      <a
        href="#"
        aria-label="Career Bank home"
        className="grid h-[42px] w-[42px] place-items-center rounded-[11px] bg-[linear-gradient(145deg,var(--color-brand-from),var(--color-brand-to))] text-white shadow-[0_8px_16px_#20145a70]"
      >
        <Sparkles size={20} />
      </a>
      <nav aria-label="Main navigation" className="mt-[26px] grid gap-2.5">
        <button
          type="button"
          onClick={() => setScreen("capture")}
          aria-label="Quick capture"
          className={cn(
            "grid h-[42px] w-[42px] place-items-center rounded-[10px] text-[var(--color-sidebar-muted)] transition-colors hover:bg-[var(--color-sidebar-hover)] hover:text-white",
            screen === "capture" && "bg-[var(--color-sidebar-hover)] text-white"
          )}
        >
          <Home size={20} />
        </button>
        <button
          type="button"
          onClick={() => setScreen("bank")}
          aria-label="Career Bank"
          className={cn(
            "grid h-[42px] w-[42px] place-items-center rounded-[10px] text-[var(--color-sidebar-muted)] transition-colors hover:bg-[var(--color-sidebar-hover)] hover:text-white",
            bankActive && "bg-[var(--color-sidebar-hover)] text-white"
          )}
        >
          <Archive size={20} />
        </button>
        <button
          type="button"
          aria-label="Opportunities"
          className="grid h-[42px] w-[42px] place-items-center rounded-[10px] text-[var(--color-sidebar-muted)] transition-colors hover:bg-[var(--color-sidebar-hover)] hover:text-white"
        >
          <FileText size={20} />
        </button>
      </nav>
      <button
        type="button"
        onClick={onSettingsClick}
        aria-label="Your profile"
        className={cn(
          "mt-auto grid h-[42px] w-[42px] place-items-center rounded-[10px] text-[var(--color-sidebar-muted)] transition-colors hover:bg-[var(--color-sidebar-hover)] hover:text-white",
          (screen === "onboarding" || screen === "profile") && "bg-[var(--color-sidebar-hover)] text-white"
        )}
      >
        <Settings size={20} />
      </button>
      <div className="mt-[15px] grid h-[33px] w-[33px] place-items-center rounded-full border-2 border-[#f8ddc8] bg-[#f3b98b] text-[11px] text-[#402e27]">
        MJ
      </div>
    </aside>
  )
}
