import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-brand-400 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(100deg,#6048e8,#7961f4)] text-white shadow-[0_6px_13px_#583ce630] hover:brightness-[1.03] active:brightness-95",
        secondary:
          "bg-white text-[#5f6473] border border-[#e0e1e9] hover:bg-[#faf9ff]",
        ghost:
          "bg-white text-[#5040c7] border border-[#dfddec] hover:bg-[#faf9ff]",
        destructive:
          "bg-white text-[#bd3b45] border border-[#f0cfd2] hover:bg-[#fdf3f3]",
        link: "text-[#6149e5] hover:underline p-0 h-auto font-semibold",
      },
      size: {
        default: "h-auto px-[18px] py-3",
        sm: "h-auto px-[15px] py-2.5",
        icon: "h-9 w-9 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
