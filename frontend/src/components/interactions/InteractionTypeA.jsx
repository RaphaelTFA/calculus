import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { MathText } from './MathText'
import { buildSamplePoints, createExpressionFn, evaluateExpression } from './interactionMath'
import { setupCanvas } from './interactionCommon'

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

  const f = interaction.systemSpec._f || createExpressionFn(fnExpr, ['x'])
  const df = interaction.systemSpec._df || createExpressionFn(dfExpr, ['x'])

  const h = 1 / resolution
  const graph = buildSamplePoints(f, domain, 300, [anchor, anchor + h])
  const y0 = f(anchor)
  // Forward difference — converges as h→0
    const MIN_H = 1e-9
    const hh = Math.max(MIN_H, h)
    const approxSlope = (f(anchor + hh) - y0) / hh
  const trueSlope = df(anchor)
  const error = Math.abs(approxSlope - trueSlope)

  return {
    newState: { resolution },
    systemState: {
      graph, anchor, y0, h, approxSlope, trueSlope, error,
      secant: {
        p1: { x: anchor, y: y0 },
          p2: { x: anchor + hh, y: f(anchor + hh) }
      }
    }
  }
}

// ─── RIEMANN MODE LOGIC ─────────────────────────────────────────────────────

function recomputeRiemann(interaction, state) {
  const { function: fnExpr, integral, sumType, domain } = interaction.systemSpec
  const n = state.resolution

  const f = interaction.systemSpec._f || createExpressionFn(fnExpr, ['x'])

  const graph = buildSamplePoints(f, domain, 300)

  const dx = (domain[1] - domain[0]) / n
  let sum = 0
  const rectangles = []
  for (let i = 0; i < n; i++) {
    const xLeft = domain[0] + i * dx
    let sampleX
    if (sumType === "right") sampleX = xLeft + dx
    else if (sumType === "midpoint") sampleX = xLeft + dx / 2
    else sampleX = xLeft  // default: left

    const height = f(sampleX)
    sum += height * dx
    rectangles.push({ x: xLeft, width: dx, height, sampleX })
  }

  const error = Math.abs(sum - integral)

  return {
    newState: { resolution: n },
    systemState: { graph, rectangles, sum, integral, error, n, dx, sumType }
  }
}

function renderCanvasRiemann(systemState, interaction, ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const { domain: rawDomain, range: rawRange } = interaction.systemSpec
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  const padX = (rawDomain[1] - rawDomain[0]) * 0.1
  const padY = (rawRange[1] - rawRange[0]) * 0.15
  const domain = [rawDomain[0] - padX, rawDomain[1] + padX]
  const range = [rawRange[0] - padY, rawRange[1] + padY]

  const mapX = x => (x - domain[0]) / (domain[1] - domain[0]) * w
  const mapY = y => h - (y - range[0]) / (range[1] - range[0]) * h

  // Grid
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

  // Rectangles
  const { rectangles } = systemState
  const y0px = mapY(0)
  for (const rect of rectangles) {
    const px = mapX(rect.x)
    const pw = mapX(rect.x + rect.width) - px
    const pyH = mapY(rect.height)
    const top = Math.min(y0px, pyH)
    const rh = Math.abs(pyH - y0px)

    ctx.fillStyle = rect.height >= 0 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(239, 68, 68, 0.25)'
    ctx.fillRect(px, top, pw, rh)
    ctx.strokeStyle = rect.height >= 0 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.6)'
    ctx.lineWidth = 1
    ctx.strokeRect(px, top, pw, rh)
  }

  // Function curve on top
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 2.5
    ctx.beginPath()
    let started2 = false
    for (const pt of systemState.graph) {
      if (!Number.isFinite(pt.y)) continue
      const px = mapX(pt.x); const py = mapY(pt.y)
      if (!started2) { ctx.moveTo(px, py); started2 = true } else ctx.lineTo(px, py)
    }
    ctx.stroke()

  // Sample points on rectangles
  if (rectangles.length <= 64) {
    ctx.fillStyle = '#3b82f6'
    for (const rect of rectangles) {
      ctx.beginPath()
      ctx.arc(mapX(rect.sampleX), mapY(rect.height), 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function renderCanvas(systemState, interaction, ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const { domain: rawDomain, range: rawRange } = interaction.systemSpec
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  // ── Dynamic camera padding (reduced to keep origin placement stable)
  const padX = (rawDomain[1] - rawDomain[0]) * 0.08
  const padY = (rawRange[1] - rawRange[0]) * 0.12
  const domain = [rawDomain[0] - padX, rawDomain[1] + padX]
  const range = [rawRange[0] - padY, rawRange[1] + padY]

  // ── Anchor-centered bias: shift viewport so anchor sits near center ─
  const anchorX = systemState.anchor
  const anchorY = systemState.y0
  const domainMid = (domain[0] + domain[1]) / 2
  const rangeMid = (range[0] + range[1]) / 2
  // Bias toward anchor (kept small to avoid large shifts)
  const biasFactor = 0
  const biasX = (anchorX - domainMid) * biasFactor
  const biasY = (anchorY - rangeMid) * biasFactor
  domain[0] += biasX; domain[1] += biasX
  range[0] += biasY; range[1] += biasY

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
  // draw only finite points; find first valid point to moveTo
  let started = false
  for (const pt of systemState.graph) {
    if (!Number.isFinite(pt.y)) continue
    const px = mapX(pt.x); const py = mapY(pt.y)
    if (!started) { ctx.moveTo(px, py); started = true } else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // Tangent line — red, extended across full canvas
  const trueSlope = systemState.trueSlope
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(mapX(domain[0]), mapY(anchorY + trueSlope * (domain[0] - anchorX)))
  ctx.lineTo(mapX(domain[1]), mapY(anchorY + trueSlope * (domain[1] - anchorX)))
  ctx.stroke()
  ctx.setLineDash([])

  // Secant line — blue, EXTENDED across full canvas width
  const { p1, p2 } = systemState.secant
  const secSlope = (p2.y - p1.y) / (p2.x - p1.x)
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(mapX(domain[0]), mapY(p1.y + secSlope * (domain[0] - p1.x)))
  ctx.lineTo(mapX(domain[1]), mapY(p1.y + secSlope * (domain[1] - p1.x)))
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
      return evaluateExpression(trigger.condition, { state })
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
  const isRiemann = LESSON.mode === 'riemann'

  const [levelIndex, setLevelIndex] = useState(0)
  const canvasRef = useRef(null)

  const { f, df } = useMemo(() => {
    return {
      f: createExpressionFn(LESSON.systemSpec.function, ['x']),
      df: !isRiemann && LESSON.systemSpec.derivative
        ? createExpressionFn(LESSON.systemSpec.derivative, ['x'])
        : () => 0
    }
  }, [LESSON, isRiemann])

  const interaction = useMemo(() => ({
    ...LESSON,
    systemSpec: { ...LESSON.systemSpec, _f: f, _df: df }
  }), [LESSON, f, df])

  const levels = LESSON.parameterSpec.resolutionLevels
  const resolution = levels[levelIndex] ?? levels[0]

  const state = { resolution }

  const computationResult = useMemo(() => {
    return isRiemann ? recomputeRiemann(interaction, state) : recompute(interaction, state)
  }, [resolution, interaction, isRiemann])

  const pendingIndexRef = useRef(0)
  const containerRef = useRef(null)

  // Draw helper — always reads current canvas CSS size, sets buffer to match
  const draw = useCallback((result, inter) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { cssW, cssH } = setupCanvas(canvas)
    if (!cssW || !cssH) return
    const sys = (result || computationResult).systemState
    const inter2 = inter || interaction
    if (isRiemann) renderCanvasRiemann(sys, inter2, ctx, canvas)
    else renderCanvas(sys, inter2, ctx, canvas)
  }, [computationResult, interaction, isRiemann])

  // Re-draw when data changes
  useEffect(() => { draw() }, [draw])

  // Re-draw when container is resized (fixes zoom/stretch after first paint)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => { draw() })
    ro.observe(container)
    return () => ro.disconnect()
  }, [draw])

  const reflection = evaluateReflection(interaction, state)
  const sys = computationResult.systemState

  // Format function expression for display
  const fnDisplay = LESSON.systemSpec.function
    .replace(/\*/g, '·')
    .replace(/x·x/g, 'x²')

  // Sum type label for riemann mode
  const sumTypeLabel = isRiemann
    ? (LESSON.systemSpec.sumType === 'right' ? 'phải' : LESSON.systemSpec.sumType === 'midpoint' ? 'trung điểm' : 'trái')
    : null

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
          <MathText text={LESSON.prompt} />
        </div>
      )}

      {/* Main content: canvas (left) + info panel (right) */}
      <div style={{
        flex: 1, display: 'flex', gap: 8, padding: '6px 8px',
        minHeight: 0, overflow: 'hidden'
      }}>
        {/* Canvas area */}
        <div
          ref={containerRef}
          style={{
            flex: '1 1 0%', minWidth: 0,
            display: 'flex', flexDirection: 'column', gap: 0
          }}
        >
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
            {isRiemann ? (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.6)', display: 'inline-block' }} />
                  HCN ({sumTypeLabel})
                </span>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Right info panel */}
        <div style={{
          flex: '0 0 200px', display: 'flex', flexDirection: 'column',
          gap: 8, overflow: 'hidden', justifyContent: 'center'
        }}>
          {/* Live readout */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '10px 12px',
            fontSize: 13, lineHeight: 1.6
          }}>
            {isRiemann ? (
              <>
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: 4, fontSize: 12 }}>
                  n = {sys.n}, Δx = {sys.dx.toFixed(4)}
                </div>
                <div style={{ color: '#3b82f6', fontFamily: 'monospace' }}>
                  Tổng ≈ <b>{sys.sum.toFixed(4)}</b>
                </div>
                <div style={{ color: '#374151', fontFamily: 'monospace' }}>
                  ∫ = <b>{sys.integral.toFixed(4)}</b>
                </div>
                <div style={{
                  color: sys.error < 0.01 ? '#10b981' : '#f59e0b',
                  fontFamily: 'monospace', fontSize: 12, marginTop: 2
                }}>
                  Sai số: {sys.error.toFixed(6)}
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
              <MathText text={reflection} />
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
                {LESSON.sliderLabel || 'Số điểm vẽ đồ thị'}
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
              min={0}
              max={levels.length - 1}
              step="1"
              value={levelIndex}
              onInput={(e) => {
                const idx = parseInt(e.target.value, 10)
                if (idx !== pendingIndexRef.current) {
                  pendingIndexRef.current = idx
                  setLevelIndex(idx)
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
              <span>{levels[0]}</span>
              <span>{levels[levels.length - 1]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
