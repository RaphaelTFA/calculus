import { useState, useRef, useEffect, useMemo } from 'react'

// ─── DEFAULT LESSON CONFIG ───────────────────────────────────────────────────

const DEFAULT_LESSON = {
  interactionType: "A",
  parameterSpec: {
    resolutionLevels: [
      2, 4, 6, 8, 10, 12, 14, 16,
      18, 20, 22, 24, 26, 28, 30, 32,
      34, 36, 38, 40, 42, 44, 46, 48,
      50, 52, 54, 56, 58, 60, 62, 64
    ]
  },
  systemSpec: {
    function: "x*x",
    derivative: "2*x",
    domain: [-3, 3],
    range: [-1, 8],
    anchor: 1
  },
  reflectionSpec: {
    triggers: [
      {
        condition: "state.resolution >= 50",
        message: "Sai số gần bằng 0. Hội tụ đã đạt."
      }
    ]
  }
}

// ─── PURE LOGIC ──────────────────────────────────────────────────────────────

function recompute(interaction, state) {
  const { function: fnExpr, derivative: dfExpr, domain, anchor } = interaction.systemSpec
  const resolution = state.resolution

  const f = interaction.systemSpec._f || new Function("x", `return ${fnExpr}`)
  const df = interaction.systemSpec._df || new Function("x", `return ${dfExpr}`)

  const graph = []
  const dxGraph = (domain[1] - domain[0]) / 300
  for (let x = domain[0]; x <= domain[1]; x += dxGraph) {
    graph.push({ x, y: f(x) })
  }

  const h = (domain[1] - domain[0]) / resolution
  const y0 = f(anchor)
  // Forward difference — converges visibly (central diff is exact for quadratics)
  const approxSlope = (f(anchor + h) - y0) / h
  const trueSlope = df(anchor)
  const error = Math.abs(approxSlope - trueSlope)

  return {
    newState: { resolution },
    systemState: {
      graph, anchor, y0, h, approxSlope, trueSlope, error,
      secant: {
        p1: { x: anchor, y: y0 },
        p2: { x: anchor + h, y: f(anchor + h) }
      }
    }
  }
}

function renderCanvas(systemState, interaction, ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const { domain, range } = interaction.systemSpec
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  const mapX = x => (x - domain[0]) / (domain[1] - domain[0]) * w
  const mapY = y => h - (y - range[0]) / (range[1] - range[0]) * h

  // Background grid — subtle
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 1
  for (let gx = Math.ceil(domain[0]); gx <= domain[1]; gx++) {
    ctx.beginPath(); ctx.moveTo(mapX(gx), 0); ctx.lineTo(mapX(gx), h); ctx.stroke()
  }
  for (let gy = Math.ceil(range[0]); gy <= range[1]; gy++) {
    ctx.beginPath(); ctx.moveTo(0, mapY(gy)); ctx.lineTo(w, mapY(gy)); ctx.stroke()
  }

  // Axes
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 1.5
  if (domain[0] <= 0 && domain[1] >= 0) {
    ctx.beginPath(); ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), h); ctx.stroke()
  }
  if (range[0] <= 0 && range[1] >= 0) {
    ctx.beginPath(); ctx.moveTo(0, mapY(0)); ctx.lineTo(w, mapY(0)); ctx.stroke()
  }

  // Graph curve — dark grey, thicker
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  systemState.graph.forEach((pt, i) => {
    const px = mapX(pt.x); const py = mapY(pt.y)
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  })
  ctx.stroke()

  // Tangent line — red, extended across full canvas
  const trueSlope = systemState.trueSlope
  const anchorX = systemState.anchor
  const anchorY = systemState.y0
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  const tx1 = domain[0]
  const tx2 = domain[1]
  ctx.moveTo(mapX(tx1), mapY(anchorY + trueSlope * (tx1 - anchorX)))
  ctx.lineTo(mapX(tx2), mapY(anchorY + trueSlope * (tx2 - anchorX)))
  ctx.stroke()
  ctx.setLineDash([])

  // Secant line — blue, EXTENDED across full canvas width
  const { p1, p2 } = systemState.secant
  const secSlope = (p2.y - p1.y) / (p2.x - p1.x)
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()
  const sx1 = domain[0]
  const sx2 = domain[1]
  ctx.moveTo(mapX(sx1), mapY(p1.y + secSlope * (sx1 - p1.x)))
  ctx.lineTo(mapX(sx2), mapY(p1.y + secSlope * (sx2 - p1.x)))
  ctx.stroke()

  // Sample points on the secant — blue dots
  ctx.fillStyle = '#3b82f6'
  ctx.beginPath()
  ctx.arc(mapX(p1.x), mapY(p1.y), 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(mapX(p2.x), mapY(p2.y), 4, 0, Math.PI * 2)
  ctx.fill()

  // Anchor point — green, larger
  ctx.fillStyle = '#10b981'
  ctx.beginPath()
  ctx.arc(mapX(anchorX), mapY(anchorY), 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(mapX(anchorX), mapY(anchorY), 6, 0, Math.PI * 2)
  ctx.stroke()
}

function evalCondition(trigger, state) {
  if (typeof trigger.condition === 'function') return trigger.condition(state)
  if (typeof trigger.condition === 'string') {
    try {
      return new Function('state', `"use strict"; return (${trigger.condition});`)(state)
    } catch { return false }
  }
  if (trigger.conditionSpec) {
    const { field, op, value } = trigger.conditionSpec
    const v = state[field]
    if (op === '>=') return v >= value
    if (op === '>') return v > value
    if (op === '<=') return v <= value
    if (op === '<') return v < value
    if (op === '==') return v === value
  }
  return false
}

function evaluateReflection(interaction, state) {
  if (!interaction.reflectionSpec) return ""
  for (const t of interaction.reflectionSpec.triggers) {
    if (evalCondition(t, state)) return t.message
  }
  return ""
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function InteractionTypeA({ lesson: lessonProp }) {
  const LESSON = lessonProp || DEFAULT_LESSON

  const [resolution, setResolution] = useState(LESSON.parameterSpec.resolutionLevels[0])
  const canvasRef = useRef(null)

  const { f, df } = useMemo(() => ({
    f: new Function("x", `return ${LESSON.systemSpec.function}`),
    df: new Function("x", `return ${LESSON.systemSpec.derivative}`)
  }), [LESSON])

  const interaction = useMemo(() => ({
    ...LESSON,
    systemSpec: { ...LESSON.systemSpec, _f: f, _df: df }
  }), [LESSON, f, df])

  const levels = LESSON.parameterSpec.resolutionLevels
  const minRes = levels[0]
  const maxRes = levels[levels.length - 1]

  const state = { resolution }

  const computationResult = useMemo(() => {
    return recompute(interaction, state)
  }, [resolution, interaction])

  const pendingResolutionRef = useRef(LESSON.parameterSpec.resolutionLevels[0])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    renderCanvas(computationResult.systemState, interaction, ctx, canvas)
  }, [computationResult, interaction])

  const reflection = evaluateReflection(interaction, state)
  const sys = computationResult.systemState

  // Format function expression for display
  const fnDisplay = LESSON.systemSpec.function
    .replace(/\*/g, '·')
    .replace(/x·x/g, 'x²')

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: '#fff', overflow: 'hidden',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Prompt — top bar */}
      {LESSON.prompt && (
        <div style={{
          padding: '8px 16px', background: '#f0f9ff',
          borderBottom: '1px solid #bae6fd',
          fontSize: 13, color: '#0c4a6e', lineHeight: 1.4,
          flexShrink: 0
        }}>
          {LESSON.prompt}
        </div>
      )}

      {/* Main content: canvas (left) + info panel (right) */}
      <div style={{
        flex: 1, display: 'flex', gap: 12, padding: 12,
        minHeight: 0, overflow: 'hidden'
      }}>
        {/* Canvas area */}
        <div style={{
          flex: '1 1 0%', minWidth: 0,
          display: 'flex', flexDirection: 'column', gap: 0
        }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%', flex: 1, display: 'block',
              cursor: 'crosshair', touchAction: 'none',
              borderRadius: 8, border: '1px solid #e5e7eb'
            }}
          />
          {/* Legend — below the canvas */}
          <div style={{
            display: 'flex', gap: 16, padding: '6px 4px 0',
            fontSize: 11, color: '#6b7280', flexShrink: 0
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 2, background: '#374151', display: 'inline-block', borderRadius: 1 }} />
              f(x) = {fnDisplay}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 2, background: '#3b82f6', display: 'inline-block', borderRadius: 1 }} />
              Cát tuyến
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 2, background: '#ef4444', display: 'inline-block', borderRadius: 1, borderTop: '1px dashed #ef4444' }} />
              Tiếp tuyến
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, background: '#10b981', display: 'inline-block', borderRadius: '50%' }} />
              x = {LESSON.systemSpec.anchor}
            </span>
          </div>
        </div>

        {/* Right info panel */}
        <div style={{
          flex: '0 0 240px', display: 'flex', flexDirection: 'column',
          gap: 10, overflow: 'hidden', justifyContent: 'center'
        }}>
          {/* Live readout */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '10px 12px',
            fontSize: 13, lineHeight: 1.6
          }}>
            <div style={{ fontWeight: 600, color: '#334155', marginBottom: 4, fontSize: 12 }}>
              Tại x = {LESSON.systemSpec.anchor}, h = {sys.h.toFixed(3)}
            </div>
            <div style={{ color: '#3b82f6', fontFamily: 'monospace' }}>
              Δf/Δx ≈ <b>{sys.approxSlope.toFixed(4)}</b>
            </div>
            <div style={{ color: '#ef4444', fontFamily: 'monospace' }}>
              f'({LESSON.systemSpec.anchor}) = <b>{sys.trueSlope.toFixed(4)}</b>
            </div>
            <div style={{
              color: sys.error < 0.01 ? '#10b981' : '#f59e0b',
              fontFamily: 'monospace', fontSize: 12, marginTop: 2
            }}>
              Sai số: {sys.error.toFixed(6)}
            </div>
          </div>

          {/* Reflection card */}
          {reflection && (
            <div style={{
              background: '#fff', padding: '10px 12px',
              borderLeft: '3px solid #3b82f6',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: 4, fontSize: 13,
              lineHeight: 1.5, color: '#1e293b',
              animation: 'slideIn 0.4s ease-out'
            }}>
              {reflection}
            </div>
          )}

          {/* Slider */}
          <div style={{
            background: '#f8f9fa', border: '1px solid #e5e7eb',
            borderRadius: 8, padding: '10px 12px'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 6
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                Số điểm lấy mẫu
              </span>
              <span style={{
                fontFamily: 'monospace', fontSize: 13,
                color: '#3b82f6', fontWeight: 700,
                background: '#eff6ff', padding: '1px 6px', borderRadius: 4
              }}>
                {Math.round(resolution)}
              </span>
            </div>
            <input
              type="range"
              min={minRes}
              max={maxRes}
              step="1"
              value={resolution}
              onInput={(e) => {
                const newRes = parseFloat(e.target.value)
                if (newRes !== pendingResolutionRef.current) {
                  pendingResolutionRef.current = newRes
                  setResolution(newRes)
                }
              }}
              style={{
                width: '100%', cursor: 'pointer',
                accentColor: '#3b82f6', height: 6
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, color: '#9ca3af', marginTop: 2
            }}>
              <span>{minRes}</span>
              <span>{maxRes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
