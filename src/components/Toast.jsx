import { Check } from 'lucide-react'

export function Toast({ message }) {
  return (
    <div className={`toast ${message ? 'show' : ''}`} role="status">
      <Check size={14} />
      {message}
    </div>
  )
}
