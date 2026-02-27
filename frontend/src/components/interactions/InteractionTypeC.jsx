import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { MathText } from './MathText'

// ─── DEFAULT LESSON CONFIG ───────────────────────────────────────────────────

const DEFAULT_LESSON = {
  interactionType: "C",
  parameterSpec: {
    time: { start: 0, end: 2 * Math.PI, step: 0.02 }
  },
  systemSpec: {
    initialState: { x: 0, y: -1 },
    evolutionRule: {
      type: "expression",
      expression: "[cos(t), sin(t)]",
      variables: ["t"]
    }
  },
  representationSpec: {
    encoding: "motion",
    viewBox: { xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2 }
  },
  reflectionSpec: {
    triggers: [
      { type: "timeReached", value: Math.PI, message: "Half cycle: velocity reverses." }
    ]
  }
}

// ─── DSL EVALUATOR ───────────────────────────────────────────────────────────

const ALLOWED_FNS = {
  sin: Math.sin, cos: Math.cos, abs: Math.abs,
  sqrt: Math.sqrt, log: Math.log, exp: Math.exp,
  pow: Math.pow, sign: Math.sign
}

function createEvaluator(model) {
  const expr = model.expression.replace(/\^/g, "**")
  return function (scope) {
    const fn = new Function(
      ...Object.keys(ALLOWED_FNS),
      ...Object.keys(scope),
      `"use strict"; return (${expr});`
    )
    return fn(...Object.values(ALLOWED_FNS), ...Object.values(scope))
  }
}

// ─── PURE LOGIC ──────────────────────────────────────────────────────────────

function computeFullTrace(interaction) {
  const evaluator = createEvaluator(interaction.systemSpec.evolutionRule)
  const { start, end, step } = interaction.parameterSpec.time
  let position = { ...interaction.systemSpec.initialState }
  const trace = []
  for (let tau = start; tau <= end; tau += step) {
    const [vx, vy] = evaluator({ t: tau, x: position.x, y: position.y })
    position = { x: position.x + vx * step, y: position.y + vy * step }
    trace.push({ x: position.x, y: position.y, vy })
  }
  return trace
}

function recompute(interaction, state) {
  const evaluator = createEvaluator(interaction.systemSpec.evolutionRule)
  const { start, step } = interaction.parameterSpec.time

  let position = { ...interaction.systemSpec.initialState }
  const trace = []
  let lastVy = 0

  for (let tau = start; tau <= state.t; tau += step) {
    const [vx, vy] = evaluator({ t: tau, x: position.x, y: position.y })
    position = { x: position.x + vx * step, y: position.y + vy * step }
    lastVy = vy
    trace.push({ x: position.x, y: position.y, vy })
  }

  return { position, trace, velocity: lastVy }
}

function evaluateReflections(interaction, state) {
  if (!interaction.reflectionSpec) return null
  const triggers = [...interaction.reflectionSpec.triggers].sort((a, b) => b.value - a.value)
  for (const trigger of triggers) {
    if (trigger.type === "timeReached" && state.t >= trigger.value) return trigger.message
  }
  return null
}

// ─── CANVAS RENDERER ─────────────────────────────────────────────────────────

const COLORS = {
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

function renderCanvas(ctx, canvas, vb, fullTrace, currentTrace, position, velocity, repSpec) {
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
  ctx.clearRect(0, 0, cssW, cssH)
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, cssW, cssH)

  const pad = { top: 16, right: 16, bottom: 32, left: 40 }
  const w = cssW - pad.left - pad.right
  const h = cssH - pad.top - pad.bottom

  const mapX = x => pad.left + (x - vb.xMin) / (vb.xMax - vb.xMin) * w
  const mapY = y => pad.top + h - (y - vb.yMin) / (vb.yMax - vb.yMin) * h

  // ── Grid ──
  ctx.save()
  ctx.strokeStyle = COLORS.grid
  ctx.lineWidth = 1
  const xRange = vb.xMax - vb.xMin
  const yRange = vb.yMax - vb.yMin
  const xGridStep = niceStep(xRange)
  const yGridStep = niceStep(yRange)
  for (let x = Math.ceil(vb.xMin / xGridStep) * xGridStep; x <= vb.xMax; x += xGridStep) {
    ctx.beginPath(); ctx.moveTo(mapX(x), pad.top); ctx.lineTo(mapX(x), pad.top + h); ctx.stroke()
  }
  for (let y = Math.ceil(vb.yMin / yGridStep) * yGridStep; y <= vb.yMax; y += yGridStep) {
    ctx.beginPath(); ctx.moveTo(pad.left, mapY(y)); ctx.lineTo(pad.left + w, mapY(y)); ctx.stroke()
  }
  ctx.restore()

  // ── Axes ──
  ctx.save()
  ctx.strokeStyle = COLORS.axis
  ctx.lineWidth = 1.5
  if (vb.yMin <= 0 && vb.yMax >= 0) {
    ctx.beginPath(); ctx.moveTo(pad.left, mapY(0)); ctx.lineTo(pad.left + w, mapY(0)); ctx.stroke()
  }
  if (vb.xMin <= 0 && vb.xMax >= 0) {
    ctx.beginPath(); ctx.moveTo(mapX(0), pad.top); ctx.lineTo(mapX(0), pad.top + h); ctx.stroke()
  }
  ctx.restore()

  // ── Tick labels ──
  ctx.save()
  ctx.fillStyle = COLORS.axis
  ctx.font = '10px system-ui'
  ctx.textAlign = 'center'
  for (let x = Math.ceil(vb.xMin / xGridStep) * xGridStep; x <= vb.xMax; x += xGridStep) {
    if (Math.abs(x) < 0.001) continue
    ctx.fillText(fmtNum(x), mapX(x), pad.top + h + 14)
  }
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let y = Math.ceil(vb.yMin / yGridStep) * yGridStep; y <= vb.yMax; y += yGridStep) {
    if (Math.abs(y) < 0.001) continue
    ctx.fillText(fmtNum(y), pad.left - 5, mapY(y))
  }
  ctx.restore()

  // ── Axis labels ──
  if (repSpec.xLabel) {
    ctx.save()
    ctx.fillStyle = '#374151'
    ctx.font = '11px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(repSpec.xLabel, pad.left + w / 2, cssH - 4)
    ctx.restore()
  }
  if (repSpec.yLabel) {
    ctx.save()
    ctx.fillStyle = '#374151'
    ctx.font = '11px system-ui'
    ctx.translate(12, pad.top + h / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText(repSpec.yLabel, 0, 0)
    ctx.restore()
  }

  // ── Full preview trace (light gray) ──
  if (fullTrace.length > 1) {
    ctx.save()
    ctx.strokeStyle = COLORS.preview
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    fullTrace.forEach((pt, i) => {
      const px = mapX(pt.x), py = mapY(pt.y)
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    })
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  // ── Area fill under current trace (optional) ──
  if (repSpec.showArea && currentTrace.length > 1) {
    let i = 0
    while (i < currentTrace.length - 1) {
      const isPos = currentTrace[i].y >= 0
      ctx.beginPath()
      ctx.moveTo(mapX(currentTrace[i].x), mapY(0))
      while (i < currentTrace.length && (currentTrace[i].y >= 0) === isPos) {
        ctx.lineTo(mapX(currentTrace[i].x), mapY(currentTrace[i].y))
        i++
      }
      if (i < currentTrace.length) {
        ctx.lineTo(mapX(currentTrace[i - 1].x), mapY(0))
      } else {
        ctx.lineTo(mapX(currentTrace[currentTrace.length - 1].x), mapY(0))
      }
      ctx.closePath()
      ctx.fillStyle = isPos ? COLORS.areaPos : COLORS.areaNeg
      ctx.fill()
    }
  }

  // ── Derivative-colored trace ──
  if (currentTrace.length > 1) {
    ctx.save()
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    for (let i = 1; i < currentTrace.length; i++) {
      const prev = currentTrace[i - 1]
      const cur = currentTrace[i]
      const vy = cur.vy
      ctx.strokeStyle = Math.abs(vy) < 0.05 ? COLORS.neutral : vy > 0 ? COLORS.rising : COLORS.falling
      ctx.beginPath()
      ctx.moveTo(mapX(prev.x), mapY(prev.y))
      ctx.lineTo(mapX(cur.x), mapY(cur.y))
      ctx.stroke()
    }
    ctx.restore()
  }

  // ── Tangent line at current point ──
  if (currentTrace.length > 0 && position) {
    const len = 0.4 * Math.min(xRange, yRange)
    const last = currentTrace[currentTrace.length - 1]
    const vx = 1
    const vy = last.vy
    const mag = Math.sqrt(vx * vx + vy * vy) || 1
    const dx = (vx / mag) * len / 2
    const dy = (vy / mag) * len / 2

    ctx.save()
    ctx.strokeStyle = COLORS.tangent
    ctx.lineWidth = 2
    ctx.setLineDash([5, 3])
    ctx.beginPath()
    ctx.moveTo(mapX(position.x - dx), mapY(position.y - dy))
    ctx.lineTo(mapX(position.x + dx), mapY(position.y + dy))
    ctx.stroke()
    ctx.setLineDash([])

    // Arrowhead
    const ax = mapX(position.x + dx)
    const ay = mapY(position.y + dy)
    const angle = Math.atan2(-(dy / yRange) * h, (dx / xRange) * w)
    const aSize = 7
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(ax - aSize * Math.cos(angle - 0.4), ay - aSize * Math.sin(angle - 0.4))
    ctx.moveTo(ax, ay)
    ctx.lineTo(ax - aSize * Math.cos(angle + 0.4), ay - aSize * Math.sin(angle + 0.4))
    ctx.stroke()
    ctx.restore()
  }

  // ── Current point ──
  if (position) {
    const px = mapX(position.x), py = mapY(position.y)
    ctx.save()
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(px, py); ctx.lineTo(px, mapY(0))
    ctx.moveTo(px, py); ctx.lineTo(mapX(0), py)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.fillStyle = COLORS.point
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
  }
}

function niceStep(range) {
  const rough = range / 5
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / mag
  if (norm < 1.5) return mag
  if (norm < 3.5) return 2 * mag
  if (norm < 7.5) return 5 * mag
  return 10 * mag
}

function fmtNum(n) {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1)
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function InteractionTypeC({ lesson: lessonProp }) {
  const LESSON = lessonProp || DEFAULT_LESSON
  const canvasRef = useRef(null)
  const requestRef = useRef(null)
  const [t, setT] = useState(LESSON.parameterSpec.time.start)
  const [playing, setPlaying] = useState(false)

  const fullTrace = useMemo(() => computeFullTrace(LESSON), [LESSON])

  const { position, trace: currentTrace, velocity } = useMemo(
    () => recompute(LESSON, { t }),
    [LESSON, t]
  )

  const reflection = useMemo(
    () => evaluateReflections(LESSON, { t }) || "",
    [LESSON, t]
  )

  const timeSpec = LESSON.parameterSpec.time
  const vb = LESSON.representationSpec.viewBox
  const percent = Math.max(0, Math.min(1, (t - timeSpec.start) / (timeSpec.end - timeSpec.start)))

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    renderCanvas(ctx, canvas, vb, fullTrace, currentTrace, position, velocity, LESSON.representationSpec)
  }, [t, fullTrace, currentTrace, position, velocity, vb, LESSON.representationSpec])

  // Animation loop — clock-based so speed is independent of frame rate
  useEffect(() => {
    if (!playing) return
    const PLAY_SPEED = 0.8  // units of t per second
    let currentT = t
    let running = true
    let lastTime = performance.now()

    function tick(now) {
      if (!running) return
      const dt = Math.min((now - lastTime) / 1000, 0.1)  // cap dt to avoid jumps after tab switch
      lastTime = now
      currentT += dt * PLAY_SPEED
      if (currentT >= timeSpec.end) {
        setT(timeSpec.end)
        setPlaying(false)
        return
      }
      setT(currentT)
      requestRef.current = requestAnimationFrame(tick)
    }
    requestRef.current = requestAnimationFrame(tick)
    return () => { running = false; if (requestRef.current) cancelAnimationFrame(requestRef.current) }
  }, [playing]) // eslint-disable-line

  // Timeline scrub
  const scrubFromEvent = useCallback((e) => {
    const bar = document.getElementById('tc-timeline')
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setT(timeSpec.start + pct * (timeSpec.end - timeSpec.start))
  }, [timeSpec])

  const handleScrubStart = useCallback((e) => {
    scrubFromEvent(e)
    const move = ev => scrubFromEvent(ev)
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move)
    window.addEventListener('touchend', up)
  }, [scrubFromEvent])

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif',
      userSelect: 'none',
    }}>

      {/* Prompt */}
      {LESSON.prompt && (
        <div style={{
          padding: '6px 12px', fontSize: 14, lineHeight: 1.5,
          color: '#1e293b', flexShrink: 0,
        }}>
          <MathText text={LESSON.prompt} />
        </div>
      )}

      {/* Main: graph + info panel */}
      <div style={{
        flex: 1, display: 'flex', gap: 8, padding: '0 8px',
        minHeight: 0, overflow: 'hidden'
      }}>
        {/* Graph + controls */}
        <div style={{
          flex: '1 1 0%', minWidth: 0,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{
            flex: 1, minHeight: 0, position: 'relative',
            background: '#fff', border: '1.5px solid #e2e8f0',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <canvas ref={canvasRef} style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', display: 'block',
            }} />
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flexShrink: 0, padding: '2px 0 4px',
          }}>
            <button
              onClick={() => {
                if (t >= timeSpec.end - timeSpec.step) {
                  setT(timeSpec.start)
                  setPlaying(true)
                } else {
                  setPlaying(p => !p)
                }
              }}
              style={{
                width: 32, height: 32, border: 'none', borderRadius: '50%',
                background: '#2563eb', color: '#fff', fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}
            >
              {playing ? '\u275A\u275A' : '\u25B6'}
            </button>

            <div
              id="tc-timeline"
              style={{
                flex: 1, height: 6, background: '#e5e7eb',
                borderRadius: 3, position: 'relative', cursor: 'pointer',
              }}
              onMouseDown={handleScrubStart}
              onTouchStart={handleScrubStart}
            >
              <div style={{
                height: '100%', background: '#2563eb', borderRadius: 3,
                position: 'absolute', left: 0, top: 0,
                width: `${percent * 100}%`,
              }} />
              <div style={{
                position: 'absolute', top: -5, width: 14, height: 14,
                borderRadius: '50%', background: '#2563eb',
                border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                left: `calc(${percent * 100}% - 7px)`,
              }} />
            </div>

            <span style={{
              minWidth: 52, textAlign: 'right', color: '#6b7280',
              fontSize: 12, fontFamily: 'monospace', flexShrink: 0,
            }}>
              t = {t.toFixed(2)}
            </span>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 14, fontSize: 11, color: '#6b7280',
            flexShrink: 0, paddingBottom: 2,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 3, background: COLORS.rising, display: 'inline-block', borderRadius: 2 }} />
              Tăng
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 3, background: COLORS.falling, display: 'inline-block', borderRadius: 2 }} />
              Giảm
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 3, background: COLORS.tangent, display: 'inline-block', borderRadius: 2 }} />
              Tiếp tuyến
            </span>
          </div>
        </div>

        {/* Right info panel */}
        <div style={{
          flex: '0 0 180px', display: 'flex', flexDirection: 'column',
          gap: 8, overflow: 'hidden', justifyContent: 'center',
        }}>
          <InfoCard label="Thời gian" value={`t = ${t.toFixed(2)}`} color="#2563eb" />
          <InfoCard
            label={LESSON.representationSpec.yLabel || "y(t)"}
            value={position ? position.y.toFixed(3) : '—'}
            color={velocity > 0.05 ? COLORS.rising : velocity < -0.05 ? COLORS.falling : COLORS.neutral}
          />
          <InfoCard
            label="Tốc độ thay đổi"
            value={velocity != null ? velocity.toFixed(3) : '—'}
            color={velocity > 0.05 ? COLORS.rising : velocity < -0.05 ? COLORS.falling : '#94a3b8'}
            icon={velocity > 0.05 ? '↗' : velocity < -0.05 ? '↘' : '→'}
          />
          <div style={{
            padding: '8px 10px', borderRadius: 6,
            background: reflection ? '#fffbeb' : '#f8f9fa',
            border: '1px solid ' + (reflection ? '#fde68a' : '#e5e7eb'),
            fontSize: 13, lineHeight: 1.5,
            color: reflection ? '#78350f' : '#9ca3af',
          }}>
            {reflection ? <MathText text={reflection} /> : 'Nhấn ▶ để bắt đầu...'}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: '#f8f9fa', borderRadius: 6, padding: '8px 10px',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: 17, fontWeight: 600, color,
        fontVariantNumeric: 'tabular-nums',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        {value}
      </div>
    </div>
  )
}
