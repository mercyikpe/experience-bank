import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

const ICONS = { warning: AlertCircle, success: CheckCircle2, info: Info }

export function CompletenessBadges({ flags }) {
  if (!flags.length) return null
  return (
    <div className="completeness-row">
      {flags.map((flag) => {
        const Icon = ICONS[flag.tone] || Info
        return (
          <span className={`completeness-badge ${flag.tone}`} key={flag.id}>
            <Icon size={12} />
            {flag.label}
          </span>
        )
      })}
    </div>
  )
}
