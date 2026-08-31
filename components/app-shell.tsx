"use client"

// Shared chrome — sidebar, mobile nav, and a header button that changes
// meaning based on the current route.

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, ArrowRight, Plus } from "lucide-react"
import { AppSidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/lib/app-data-context"

function HeaderAction({ pathname }: { pathname: string }) {
  const isCaptureRoute = pathname === "/" || /^\/experience\/[^/]+\/edit$/.test(pathname)

  if (isCaptureRoute) {
    return (
      <Button variant="ghost" className="mt-4" asChild>
        <Link href="/bank">
          View career bank <ArrowRight size={15} />
        </Link>
      </Button>
    )
  }

  if (pathname === "/bank") {
    return (
      <Button className="mt-4" asChild>
        <Link href="/">
          <Plus size={15} />
          Add new entry
        </Link>
      </Button>
    )
  }

  return (
    <Button variant="ghost" className="mt-4" asChild>
      <Link href="/bank">
        <ArrowLeft size={15} />
        Back to Career Bank
      </Link>
    </Button>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile, avatarUrl } = useAppData()

  return (
    <div className="flex min-h-screen">
      <AppSidebar profile={profile} avatarUrl={avatarUrl} />
      <MobileNav profile={profile} avatarUrl={avatarUrl} />
      <main className="mx-auto w-[min(1360px,calc(100%-122px))] px-3 pt-13.5 pb-15 max-[900px]:w-[calc(100%-82px)] max-[900px]:pt-8 max-[600px]:w-full max-[600px]:px-3.5 max-[600px]:pt-6 max-[600px]:pb-24">
        <header className="mx-2 mb-8 flex items-start justify-between gap-7.5 max-[600px]:block max-[600px]:mb-5.5">
          <div>
            <p className="mb-1.75 text-[11px] font-bold tracking-[.11em] text-(--color-muted-fg)">
              YOUR CAREER BANK
            </p>
            <h1 className="m-0 max-w-155 font-serif text-[34px] leading-[1.13] tracking-[-.035em] max-[600px]:text-[29px]">
              Turn your work into stories worth telling.
            </h1>
          </div>
          <HeaderAction pathname={pathname} />
        </header>

        {children}
      </main>
    </div>
  )
}
