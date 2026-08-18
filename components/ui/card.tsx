import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-[15px] border border-[#e8e8f0] bg-white text-ink shadow-[0_12px_30px_#3438580b]",
        className
      )}
      {...props}
    />
  )
}

export { Card }
