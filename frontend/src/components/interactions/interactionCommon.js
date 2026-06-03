export const COLORS = {
  rising: '#059669',
  falling: '#dc2626',
  neutral: '#6366f1',
  preview: '#d1d5db',
  tangent: '#f59e0b',
  grid: '#f1f5f9',
  axis: '#64748b',
  bg: '#ffffff',
  point: '#1e40af',
  areaPos: 'rgba(5, 150, 105, 0.12)',
  areaNeg: 'rgba(220, 38, 38, 0.12)',
}

export function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const cssW = Math.max(1, rect.width)
  const cssH = Math.max(1, rect.height)
  const pxW = Math.round(cssW * dpr)
  const pxH = Math.round(cssH * dpr)
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW
    canvas.height = pxH
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, cssW, cssH, dpr }
}

export function createMapFns(vb, cssW, cssH, pad = { top: 16, right: 16, bottom: 32, left: 40 }) {
  const w = cssW - pad.left - pad.right
  const h = cssH - pad.top - pad.bottom
  const mapX = x => pad.left + (x - vb.xMin) / (vb.xMax - vb.xMin) * w
  const mapY = y => pad.top + h - (y - vb.yMin) / (vb.yMax - vb.yMin) * h
  return { mapX, mapY, pad, w, h }
}

export function niceStep(range) {
  const rough = range / 5
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(Math.abs(rough), 1e-12))))
  const norm = rough / mag
  if (norm < 1.5) return mag
  if (norm < 3.5) return 2 * mag
  if (norm < 7.5) return 5 * mag
  return 10 * mag
}

export function fmtNum(n) {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1)
}
