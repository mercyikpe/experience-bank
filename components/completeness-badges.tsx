import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import type { CompletenessFlag, CompletenessTone } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

const ICONS: Record<CompletenessTone, typeof Info> = {
  warning: AlertCircle,
  success: CheckCircle2,
  info: Info,
}

export function CompletenessBadges({ flags }: { flags: CompletenessFlag[] }) {
  if (!flags.length) return null
  return (
    <div className="my-[14px] mb-[22px] flex flex-wrap gap-[7px]">
      {flags.map((flag) => {
        const Icon = ICONS[flag.tone] || Info
        return (
          <Badge variant={flag.tone} key={flag.id}>
            <Icon size={12} />
            {flag.label}
          </Badge>
        )
      })}
    </div>
  )
}
