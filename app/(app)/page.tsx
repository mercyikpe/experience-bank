"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CaptureScreen } from "@/components/screens/capture-screen"

// Wrapped in Suspense because useSearchParams needs it — used here to
// read ?company=, set when "Add entry" on a work-history role pre-seeds
// the capture with an explicit company mention (see profile-screen.tsx).
function CapturePageContent() {
  const searchParams = useSearchParams()
  const company = searchParams.get("company")
  return <CaptureScreen initialDescription={company ? `At ${company.trim()}, ` : undefined} />
}

export default function CapturePage() {
  return (
    <Suspense>
      <CapturePageContent />
    </Suspense>
  )
}
