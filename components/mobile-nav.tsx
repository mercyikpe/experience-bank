"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Archive, Home } from "lucide-react"
import type { UserProfile } from "@/lib/types"
import { cn, initials } from "@/lib/utils"

export function MobileNav({
  profile,
  avatarUrl,
}: {
  profile: UserProfile
  avatarUrl: string | null
}) {
  const pathname = usePathname()
  const captureActive = pathname === "/"
  const bankActive = pathname === "/bank" || pathname.startsWith("/experience")
  const profileActive = pathname === "/profile" || pathname === "/onboarding"

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 hidden items-center justify-around border-t border-(--color-sidebar-hover) bg-(--color-sidebar) px-4 py-2 text-(--color-sidebar-fg) pb-[calc(0.5rem+env(safe-area-inset-bottom))] max-[600px]:flex"
    >
      <Link
        href="/"
        aria-label="Quick capture"
        className={cn(
          "grid h-11 w-11 place-items-center rounded-[10px] text-(--color-sidebar-muted) transition-colors",
          captureActive && "bg-(--color-sidebar-hover) text-white"
        )}
      >
        <Home size={20} />
      </Link>
      <Link
        href="/bank"
        aria-label="Career Bank"
        className={cn(
          "grid h-11 w-11 place-items-center rounded-[10px] text-(--color-sidebar-muted) transition-colors",
          bankActive && "bg-(--color-sidebar-hover) text-white"
        )}
      >
        <Archive size={20} />
      </Link>
      <Link
        href="/profile"
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
      </Link>
    </nav>
  )
}
