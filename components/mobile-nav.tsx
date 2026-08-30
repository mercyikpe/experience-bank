"use client"

import Image from "next/image"
import { Archive, Home } from "lucide-react"
import type { Screen, UserProfile } from "@/lib/types"
import { cn, initials } from "@/lib/utils"

export function MobileNav({
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
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 hidden items-center justify-around border-t border-(--color-sidebar-hover) bg-(--color-sidebar) px-4 py-2 text-(--color-sidebar-fg) pb-[calc(0.5rem+env(safe-area-inset-bottom))] max-[600px]:flex"
    >
      <button
        type="button"
        onClick={() => setScreen("capture")}
        aria-label="Quick capture"
        className={cn(
          "grid h-11 w-11 place-items-center rounded-[10px] text-(--color-sidebar-muted) transition-colors",
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
          "grid h-11 w-11 place-items-center rounded-[10px] text-(--color-sidebar-muted) transition-colors",
          bankActive && "bg-(--color-sidebar-hover) text-white"
        )}
      >
        <Archive size={20} />
      </button>
      <button
        type="button"
        onClick={onSettingsClick}
        aria-label="Your profile"
        className={cn(
          "grid h-8.25 w-8.25 flex-none place-items-center rounded-full border-2 text-[11px] font-semibold transition-colors",
          profileActive
            ? "border-(--color-brand-from) bg-[linear-gradient(145deg,var(--color-brand-from),var(--color-brand-to))] text-white"
            : "border-(--color-sidebar-hover) bg-(--color-sidebar-hover) text-(--color-sidebar-fg)"
        )}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={33} height={33} className="h-full w-full rounded-full object-cover" />
        ) : (
          initials(profile.name)
        )}
      </button>
    </nav>
  )
}
