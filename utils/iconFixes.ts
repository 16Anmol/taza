// Utility to help with lucide-react-native icon props
// Use this as a reference for proper icon usage

import type { LucideProps } from "lucide-react-native"

// Correct way to use lucide icons in the new version
export const getIconProps = (size: number, color: string, strokeWidth?: number): LucideProps => ({
  size,
  stroke: color, // Use 'stroke' instead of 'color'
  strokeWidth: strokeWidth || 2,
})

// Example usage:
// <Home {...getIconProps(24, "#22C55E")} />
// or directly:
// <Home size={24} stroke="#22C55E" strokeWidth={2} />
