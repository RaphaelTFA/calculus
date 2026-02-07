import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// URL encoding/decoding for step IDs
export function encodeStepId(id) {
  if (!id) return ''
  const str = String(id)
  // Simple base64 encoding with prefix to obfuscate
  return btoa(`step_${str}_${Date.now() % 1000}`).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function decodeStepId(encoded) {
  if (!encoded) return null
  try {
    // Restore base64 padding and decode
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    const decoded = atob(base64)
    // Extract ID from pattern: step_ID_timestamp
    const match = decoded.match(/^step_(\d+)_\d+$/)
    return match ? parseInt(match[1], 10) : null
  } catch {
    return null
  }
}
