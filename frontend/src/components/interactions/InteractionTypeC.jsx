import { useState, useRef, useEffect } from 'react'

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
      {
        type: "timeReached",
        value: 2 * Math.PI - 0.02,
        message: "The motion has completed one full cycle."
      },
      {
        type: "timeReached",
        value: 3.14159,
        message: "Half a cycle: velocity reverses direction."
      }
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
    trace.push({ x: position.x, y: position.y })
  }
  return trace
}

function recompute(interaction, state) {
  const evaluator = createEvaluator(interaction.systemSpec.evolutionRule)
  const { start, step } = interaction.parameterSpec.time

  let position = { ...interaction.systemSpec.initialState }
  const trace = []

  for (let tau = start; tau <= state.t; tau += step) {
    const [vx, vy] = evaluator({ t: tau, x: position.x, y: position.y })
    position = { x: position.x + vx * step, y: position.y + vy * step }
    trace.push({ x: position.x, y: position.y })
  }

  return {
    newState: { t: state.t, position, trace },
    systemState: {
      geometry: [
        { type: "axes" },
        { type: "trace", data: trace },
        { type: "point", x: position.x, y: position.y }
      ]
    }
  }
}

function renderCanvas(systemState, representationSpec, ctx, canvas) {
  // Ensure canvas backing store matches CSS size (handles clipping and HiDPI)
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
  // Scale drawing so 1 unit = 1 CSS pixel
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // White background (use CSS size coordinates)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, cssW, cssH)

  const vb = representationSpec.viewBox
  const w = cssW; const h = cssH

  // Minimal, precise padding for arrowheads only
  const pad = 10;
  const innerW = w - 2 * pad;
  const innerH = h - 2 * pad;

  // Centered mapping: ensures (0,0) is visually centered if in viewBox
  const mapX = x => pad + ((x - vb.xMin) / (vb.xMax - vb.xMin)) * innerW;
  const mapY = y => pad + innerH - ((y - vb.yMin) / (vb.yMax - vb.yMin)) * innerH;

  // Draw each geometry object with a clean, textbook style
  systemState.geometry.forEach(obj => {
    // Bold black axes with arrowheads, axes extended beyond viewBox
    if (obj.type === 'axes') {
      ctx.save()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = Math.max(3, Math.min(5, Math.round(w / 120))) // thicker axes
      ctx.beginPath()
      // x-axis (extend beyond viewBox)
      const y0 = mapY(0)
      ctx.moveTo(0, y0); ctx.lineTo(w, y0)
      // y-axis (extend beyond viewBox)
      const x0 = mapX(0)
      ctx.moveTo(x0, 0); ctx.lineTo(x0, h)
      ctx.stroke()

      // arrowheads (slightly larger, proportional)
      const ah = Math.max(10, Math.round(Math.min(innerW, innerH) / 60))
      // x-axis arrow (right)
      ctx.beginPath()
      ctx.moveTo(w - ah, y0 - ah / 2)
      ctx.lineTo(w, y0)
      ctx.lineTo(w - ah, y0 + ah / 2)
      ctx.fillStyle = '#000'
      ctx.fill()
      // y-axis arrow (top)
      ctx.beginPath()
      ctx.moveTo(x0 - ah / 2, ah)
      ctx.lineTo(x0, 0)
      ctx.lineTo(x0 + ah / 2, ah)
      ctx.fill()
      ctx.restore()
    }

    // Secondary reference: orange line, thicker
    if (obj.type === 'fullCurve') {
      ctx.save()
      ctx.strokeStyle = '#fb923c' // orange-400
      ctx.lineWidth = 2.2 // thicker
      ctx.setLineDash([6, 6])
      ctx.beginPath()
      obj.data.forEach((pt, i) => {
        const px = mapX(pt.x); const py = mapY(pt.y)
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      })
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    // Main trace: strong blue, thicker
    if (obj.type === 'trace') {
      ctx.save()
      ctx.strokeStyle = '#1e40af' // strong indigo-blue
      ctx.lineWidth = 4.5 // thicker
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      obj.data.forEach((pt, i) => {
        const px = mapX(pt.x); const py = mapY(pt.y)
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      })
      ctx.stroke()
      ctx.restore()
    }

    // Highlight points with larger markers and projections
    if (obj.type === 'point') {
      const px = mapX(obj.x); const py = mapY(obj.y)
      // dashed projection to axes
      ctx.save()
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      // vertical to x-axis
      ctx.moveTo(px, py); ctx.lineTo(px, mapY(0))
      // horizontal to y-axis
      ctx.moveTo(px, py); ctx.lineTo(mapX(0), py)
      ctx.stroke()
      ctx.setLineDash([])
      // filled circular marker with white ring, larger
      ctx.beginPath()
      ctx.fillStyle = '#1e40af'
      ctx.arc(px, py, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
      ctx.restore()
    }
  })
}

function evaluateReflections(interaction, state) {
  if (!interaction.reflectionSpec) return null
  // Sort by value descending so the HIGHEST reached trigger wins
  const triggers = [...interaction.reflectionSpec.triggers]
    .sort((a, b) => b.value - a.value)
  for (const trigger of triggers) {
    if (trigger.type === "timeReached" && state.t >= trigger.value) {
      return trigger.message
    }
  }
  return null
}

function validateTypeC(interaction) {
  if (interaction.interactionType !== "C") throw new Error("Not Type C interaction")
  const { start, end, step } = interaction.parameterSpec.time
  if (start >= end) throw new Error("Time start must be < end")
  if (step <= 0) throw new Error("Time step must be > 0")
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────


export default function InteractionTypeC({ lesson: lessonProp }) {
  const LESSON = lessonProp || DEFAULT_LESSON
  const canvasRef = useRef(null)
  const requestRef = useRef(null)
  const [t, setT] = useState(LESSON.parameterSpec.time.start)
  const [playing, setPlaying] = useState(false)
  const [reflection, setReflection] = useState("")

  // Shrink all sizes by ~20% and make slide-friendly
  // For best appearance, Step.jsx should use a white or transparent background for interaction slides.
  const styles = {
    root: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'system-ui',
      background: 'transparent',
      gap: 8
    },
    canvas: {
      width: '100%',
      maxWidth: 420,
      aspectRatio: '7/5',
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      display: 'block',
      marginBottom: 8,
      height: 'auto'
    },
    controls: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    },
    playBtn: {
      width: 32,
      height: 32,
      border: 'none',
      borderRadius: '50%',
      background: '#2563eb',
      color: '#fff',
      fontSize: 16,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      outline: 'none'
    },
    timelineBar: {
      flex: 1,
      height: 6,
      background: '#e5e7eb',
      borderRadius: 3,
      position: 'relative',
      cursor: 'pointer',
      margin: '0 8px'
    },
    progress: {
      height: '100%',
      background: '#2563eb',
      borderRadius: 3,
      position: 'absolute',
      left: 0,
      top: 0
    },
    scrubber: {
      position: 'absolute',
      top: -4,
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: '#2563eb',
      border: '2px solid #fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      cursor: 'pointer',
      transform: 'translateX(-6px)'
    },
    tLabel: {
      minWidth: 44,
      textAlign: 'right',
      color: '#555',
      fontSize: 12
    },
    reflection: {
      width: '100%',
      minHeight: 24,
      fontSize: 13,
      color: '#111827',
      textAlign: 'center',
      marginTop: 4
    }
  }

  // Animation loop
  useEffect(() => {
    try { validateTypeC(LESSON) } catch (e) { console.error(e); return }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const timeSpec = LESSON.parameterSpec.time
    let running = playing
    let currentT = t
    const fullTrace = computeFullTrace(LESSON)

    function drawFrame(timeVal) {
      const result = recompute(LESSON, { t: timeVal })
      const sysWithFull = {
        geometry: [{ type: "fullCurve", data: fullTrace }, ...result.systemState.geometry]
      }
      renderCanvas(sysWithFull, LESSON.representationSpec, ctx, canvas)
      const message = evaluateReflections(LESSON, { t: timeVal })
      setReflection(message || "")
    }

    function step() {
      if (!running) return
      if (currentT >= timeSpec.end) {
        setPlaying(false)
        return
      }
      currentT += timeSpec.step
      setT(currentT)
      drawFrame(currentT)
      requestRef.current = requestAnimationFrame(step)
    }

    drawFrame(t)
    if (playing) {
      running = true
      requestRef.current = requestAnimationFrame(step)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
    // eslint-disable-next-line
  }, [playing, t])

  // Timeline scrub handler
  function handleTimelineClick(e) {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const timeSpec = LESSON.parameterSpec.time
    const tVal = timeSpec.start + percent * (timeSpec.end - timeSpec.start)
    setT(tVal)
  }

  // Scrubber drag
  function handleScrubberDrag(e) {
    if (e.type === 'mousedown' || e.type === 'touchstart') {
      const move = evt => {
        let clientX = evt.touches ? evt.touches[0].clientX : evt.clientX
        const bar = document.getElementById('timeline-bar')
        const rect = bar.getBoundingClientRect()
        const x = clientX - rect.left
        const percent = Math.max(0, Math.min(1, x / rect.width))
        const timeSpec = LESSON.parameterSpec.time
        const tVal = timeSpec.start + percent * (timeSpec.end - timeSpec.start)
        setT(tVal)
      }
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
    }
  }

  // Progress percent
  const timeSpec = LESSON.parameterSpec.time
  const percent = Math.max(0, Math.min(1, (t - timeSpec.start) / (timeSpec.end - timeSpec.start)))
  const progressWidth = `${percent * 100}%`
  const scrubberLeft = `calc(${percent * 100}% - 6px)`

  return (
    <div style={styles.root}>
      <canvas ref={canvasRef} style={styles.canvas}></canvas>
      <div style={styles.controls}>
        <button style={styles.playBtn} onClick={() => setPlaying(p => !p)}>
          {playing ? (
            <span>&#10073;&#10073;</span>
          ) : (
            <span>&#9654;</span>
          )}
        </button>
        <div
          id="timeline-bar"
          style={styles.timelineBar}
          onClick={handleTimelineClick}
        >
          <div style={{ ...styles.progress, width: progressWidth }} />
          <div
            style={{ ...styles.scrubber, left: scrubberLeft }}
            onMouseDown={handleScrubberDrag}
            onTouchStart={handleScrubberDrag}
          />
        </div>
        <span style={styles.tLabel}>t = {t.toFixed(2)}</span>
      </div>
      <div style={styles.reflection}>{reflection}</div>
    </div>
  )
}
