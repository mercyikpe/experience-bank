"use client"

import Image from "next/image"
import { Archive, Home, Sparkles } from "lucide-react"
import type { Screen, UserProfile } from "@/lib/types"
import { cn, initials } from "@/lib/utils"

export function AppSidebar({
  screen,
  setScreen,
  onSettingsClick,
  profile,
  avatarUrl,
}: {
  screen: Screen
  setScreen: (screen: Screen) => void
  onSettingsClick: () => void
  profile: UserProfile
  avatarUrl: string | null
}) {
  const bankActive = screen === "bank" || screen === "detail" || screen === "complete" || screen === "star"
  const profileActive = screen === "onboarding" || screen === "profile"

  return (
    <aside className="mt-5 mr-5 mb-5 ml-0 flex w-20.5 flex-none flex-col items-center rounded-[18px] bg-(--color-sidebar) px-3 py-3.5 text-(--color-sidebar-fg) shadow-[0_14px_28px_#28314d25] max-[900px]:mt-2.5 max-[900px]:mr-2.5 max-[900px]:mb-2.5 max-[900px]:ml-0 max-[900px]:w-15.5 max-[600px]:hidden">
      <a
        href="#"
        aria-label="Career Bank home"
        className="grid h-10.5 w-10.5 place-items-center rounded-[11px] bg-[linear-gradient(145deg,var(--color-brand-from),var(--color-brand-to))] text-white shadow-[0_8px_16px_#20145a70]"
      >
        <Sparkles size={20} />
      </a>
      <nav aria-label="Main navigation" className="mt-6.5 grid gap-2.5">
        <button
          type="button"
          onClick={() => setScreen("capture")}
          aria-label="Quick capture"
          className={cn(
            "grid h-10.5 w-10.5 place-items-center rounded-[10px] text-(--color-sidebar-muted) transition-colors hover:bg-(--color-sidebar-hover) hover:text-white",
            screen === "capture" && "bg-(--color-sidebar-hover) text-white"
          )}
        >
          <Home size={20} />
        </button>
        <button
          type="button"
          onClick={() => setScreen("bank")}
          aria-label="Career Bank"
          className={cn(
            "grid h-10.5 w-10.5 place-items-center rounded-[10px] text-(--color-sidebar-muted) transition-colors hover:bg-(--color-sidebar-hover) hover:text-white",
            bankActive && "bg-(--color-sidebar-hover) text-white"
          )}
        >
          <Archive size={20} />
        </button>
      </nav>
      <button
        type="button"
        onClick={onSettingsClick}
        aria-label="Your profile"
        className={cn(
          "mt-auto grid h-8.25 w-8.25 flex-none place-items-center rounded-full border-2 text-[11px] font-semibold transition-colors",
          profileActive
            ? "border-(--color-brand-from) bg-[linear-gradient(145deg,var(--color-brand-from),var(--color-brand-to))] text-white"
            : "border-(--color-sidebar-hover) bg-(--color-sidebar-hover) text-(--color-sidebar-fg) hover:border-(--color-brand-from)"
        )}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={33} height={33} className="h-full w-full rounded-full object-cover" />
        ) : (
          initials(profile.name)
        )}
      </button>
    </aside>
  )
}
