import Link from "next/link"
import { Card } from "@/components/ui/card"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8 text-center">
        <h1 className="m-0 mb-2 text-[17px] font-bold">Sign-in didn&apos;t go through</h1>
        <p className="mb-6 text-[13px] text-(--color-muted-fg)">
          Something went wrong finishing Google sign-in. Please try again.
        </p>
        <Link href="/login" className="text-[13px] font-semibold text-(--color-accent)">
          Back to sign in
        </Link>
      </Card>
    </div>
  )
}
