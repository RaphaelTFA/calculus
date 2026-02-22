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
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const vb = representationSpec.viewBox
  const w = canvas.clientWidth; const h = canvas.clientHeight

  const mapX = x => (x - vb.xMin) / (vb.xMax - vb.xMin) * w
  const mapY = y => h - (y - vb.yMin) / (vb.yMax - vb.yMin) * h

  systemState.geometry.forEach(obj => {
    if (obj.type === "axes") {
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, mapY(0)); ctx.lineTo(w, mapY(0))
      ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), h)
      ctx.stroke()
    }

    if (obj.type === "trace") {
      ctx.strokeStyle = "rgba(37,99,235,0.25)"
      ctx.lineWidth = 1.5
      ctx.beginPath()
      obj.data.forEach((pt, i) => {
        const px = mapX(pt.x); const py = mapY(pt.y)
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      })
      ctx.stroke()
    }

    if (obj.type === "point") {
      ctx.fillStyle = "#2563eb"
      ctx.beginPath()
      ctx.arc(mapX(obj.x), mapY(obj.y), 6, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

function evaluateReflections(interaction, state) {
  if (!interaction.reflectionSpec) return null
  for (const trigger of interaction.reflectionSpec.triggers) {
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
  const reflectionRef = useRef(null)
  const requestRef = useRef(null)
  const [reflection, setReflection] = useState("")

  useEffect(() => {
    try { validateTypeC(LESSON) } catch (e) { console.error(e); return }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const timeSpec = LESSON.parameterSpec.time

    let currentState = { t: timeSpec.start }

    function resize() {
      if (!canvas.parentElement) return
      const rect = canvas.parentElement.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const result = recompute(LESSON, currentState)
      renderCanvas(result.systemState, LESSON.representationSpec, ctx, canvas)
    }

    window.addEventListener("resize", resize)
    resize()

    function step() {
      if (currentState.t > timeSpec.end) return

      const result = recompute(LESSON, currentState)
      const message = evaluateReflections(LESSON, currentState)
      if (message !== null) setReflection(message)

      renderCanvas(result.systemState, LESSON.representationSpec, ctx, canvas)

      currentState = { t: currentState.t + timeSpec.step }
      requestRef.current = requestAnimationFrame(step)
    }

    requestRef.current = requestAnimationFrame(step)

    return () => {
      window.removeEventListener("resize", resize)
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#ffffff' }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          width: '100%', maxWidth: 1100, height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, padding: 20
        }}>
          {/* Canvas */}
          <div style={{ flex: '0 0 600px', height: '80%' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>

          {/* Reflection */}
          <div ref={reflectionRef} style={{
            flex: 1, maxWidth: 320,
            fontSize: 16, lineHeight: 1.5, color: '#111827',
            display: 'flex', alignItems: 'center'
          }}>
            {reflection}
          </div>
        </div>
      </div>
    </div>
  )
}
