import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold w-fit whitespace-nowrap shrink-0 transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        tag: "border-[#e5e2f4] bg-[#f6f3ff] text-[#5a48ba]",
        "tag-selected": "border-transparent bg-[#6851e9] text-white",
        warning: "border-transparent bg-[#fdf1e4] text-[#b3690f]",
        success: "border-transparent bg-[#edf9f0] text-[#1f9d55]",
        info: "border-transparent bg-[#f0eefc] text-[#5940dc]",
        mini: "border-transparent bg-[#f4f1fc] text-[#6956b7] rounded-lg px-1.5 py-1 text-[9px]",
      },
    },
    defaultVariants: {
      variant: "tag",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
