export const PALETTE = [
  { color: '#2563EB', bg: '#DBEAFE' },
  { color: '#16A34A', bg: '#DCFCE7' },
  { color: '#DC2626', bg: '#FEE2E2' },
  { color: '#9333EA', bg: '#F3E8FF' },
  { color: '#EA580C', bg: '#FFEDD5' },
  { color: '#0891B2', bg: '#CFFAFE' },
  { color: '#65A30D', bg: '#ECFCCB' },
  { color: '#DB2777', bg: '#FCE7F3' },
  { color: '#B45309', bg: '#FEF3C7' },
  { color: '#475569', bg: '#F1F5F9' },
]

function hashOrg(name: string): number {
  return name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

export function getOrgColor(name: string, customColors?: Record<string, { color: string; bg: string }>) {
  if (customColors && customColors[name]) return customColors[name]
  return PALETTE[hashOrg(name) % PALETTE.length]
}
