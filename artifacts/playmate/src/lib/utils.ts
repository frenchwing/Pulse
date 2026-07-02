import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse a "YYYY-MM-DD" (+ optional "HH:mm") pair as LOCAL time.
// `new Date("YYYY-MM-DD")` parses as UTC midnight, which renders a day
// early in UTC-negative timezones.
export function parseLocalDate(date: string, time?: string): Date {
  return new Date(`${date}T${time || "00:00"}`)
}
