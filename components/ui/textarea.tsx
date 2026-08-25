import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-29 w-full resize-y rounded-lg border border-[#e2e3ec] bg-[#fcfcff] px-3 py-2.75 text-[13px] leading-[1.45] text-ink outline-none transition-[border,box-shadow] placeholder:text-[#9299aa]",
        "focus-visible:border-[#998afa] focus-visible:ring-[3px] focus-visible:ring-[#6b50ea18]",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
