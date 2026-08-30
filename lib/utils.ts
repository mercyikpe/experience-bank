import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Two-letter initials for an avatar — first letter of the first two words
 * in the name, uppercased. Falls back to "?" for an empty/blank name (a
 * profile that hasn't been filled in yet), same convention used wherever
 * an avatar needs to render before there's a real name to show. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase()
}
