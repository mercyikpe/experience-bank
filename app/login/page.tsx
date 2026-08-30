import { signInWithGoogle } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8 text-center">
        <p className="mb-1.75 text-[11px] font-bold tracking-[.11em] text-(--color-muted-fg)">
          YOUR CAREER BANK
        </p>
        <h1 className="m-0 mb-6 font-serif text-[22px] leading-tight tracking-[-.02em]">
          Turn your work into stories worth telling.
        </h1>
        <form action={signInWithGoogle}>
          <Button type="submit" className="w-full justify-center">
            Continue with Google
          </Button>
        </form>
      </Card>
    </div>
  )
}
