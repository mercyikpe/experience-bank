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
    <div className="my-3.5 mb-5.5 flex flex-wrap gap-1.75">
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
