import { useState, useRef, useEffect, useMemo, useCallback } from 'react'

// ─── DEFAULT LESSON CONFIG ───────────────────────────────────────────────────
// Can be overridden by passing a `lesson` prop from the slide JSON.

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
        condition: (state) => state.resolution >= 64,
        message: "The approximation error is now negligible. Convergence achieved."
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
  const approxSlope = (f(anchor + h) - f(anchor - h)) / (2 * h)
  const trueSlope = df(anchor)
  const error = Math.abs(approxSlope - trueSlope)

  return {
    newState: { resolution },
    systemState: {
      graph, anchor, y0, approxSlope, trueSlope, error,
      secant: {
        p1: { x: anchor - h, y: f(anchor - h) },
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

  // Graph curve
  ctx.strokeStyle = "#666"
  ctx.lineWidth = 2
  ctx.beginPath()
  systemState.graph.forEach((pt, i) => {
    const px = mapX(pt.x); const py = mapY(pt.y)
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  })
  ctx.stroke()

  // Secant line
  ctx.strokeStyle = "rgba(52,152,219,0.8)"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(mapX(systemState.secant.p1.x), mapY(systemState.secant.p1.y))
  ctx.lineTo(mapX(systemState.secant.p2.x), mapY(systemState.secant.p2.y))
  ctx.stroke()

  // Tangent line
  ctx.strokeStyle = "#e74c3c"
  ctx.lineWidth = 2
  ctx.beginPath()
  const x1 = systemState.anchor - 2; const x2 = systemState.anchor + 2
  ctx.moveTo(mapX(x1), mapY(systemState.y0 + systemState.trueSlope * (x1 - systemState.anchor)))
  ctx.lineTo(mapX(x2), mapY(systemState.y0 + systemState.trueSlope * (x2 - systemState.anchor)))
  ctx.stroke()

  // Anchor point
  ctx.fillStyle = "#2ecc71"
  ctx.beginPath()
  ctx.arc(mapX(systemState.anchor), mapY(systemState.y0), 5, 0, Math.PI * 2)
  ctx.fill()
}

function evalCondition(trigger, state) {
  if (typeof trigger.condition === 'function') return trigger.condition(state)
  if (typeof trigger.condition === 'string') {
    // String expression from JSON — evaluate with state in scope
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
  // We treat resolution as a continuous value between min and max levels
  const minRes = levels[0]
  const maxRes = levels[levels.length - 1]

  const state = { resolution }

  const computationResult = useMemo(() => {
    return recompute(interaction, state)
  }, [resolution, interaction])


  // Use a ref to track the "pending" resolution to avoid React batching lag during drag
  const pendingResolutionRef = useRef(LESSON.parameterSpec.resolutionLevels[0])

  // Canvas rendering - Optimized with animation frame for smooth updates
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let animationFrameId

    const renderLoop = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()

      // Only set dimensions if they changed to avoid clearing canvas unnecessarily
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      renderCanvas(computationResult.systemState, interaction, ctx, canvas)
    }

    renderLoop()

  }, [computationResult, interaction])

  // SMOOTH DRAG LOGIC
  // We use a ref to track drag state and requestAnimationFrame to throttle React state updates.
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateFromEvent = (clientX, sourceWidth, sourceLeft) => {
      const x = clientX - sourceLeft
      let ratio = Math.max(0, Math.min(1, x / sourceWidth))

      // Continuous resolution mapping
      const newRes = minRes + ratio * (maxRes - minRes)

      // Update if significantly different (e.g. > 0.1 change) to avoid micro-updates
      if (Math.abs(newRes - pendingResolutionRef.current) > 0.01) {
        pendingResolutionRef.current = newRes
        setResolution(newRes)
      }
    }

    const handleCanvasMove = (e) => {
      if (!isDraggingRef.current) return
      const rect = canvas.getBoundingClientRect()
      updateFromEvent(e.clientX, rect.width, rect.left)
    }

    const handleCanvasDown = (e) => {
      isDraggingRef.current = true
      const rect = canvas.getBoundingClientRect()
      updateFromEvent(e.clientX, rect.width, rect.left)
      document.body.style.userSelect = 'none' // Prevent text selection
    }

    const handleWindowUp = () => {
      isDraggingRef.current = false
      document.body.style.userSelect = ''
    }

    // Attach listeners
    canvas.addEventListener('mousedown', handleCanvasDown)
    window.addEventListener('mousemove', handleCanvasMove)
    window.addEventListener('mouseup', handleWindowUp)

    return () => {
      canvas.removeEventListener('mousedown', handleCanvasDown)
      window.removeEventListener('mousemove', handleCanvasMove)
      window.removeEventListener('mouseup', handleWindowUp)
    }
  }, [minRes, maxRes])

  const reflection = evaluateReflection(interaction, state)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#ffffff' }}>
      {/* Main layout: canvas + side panel */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          width: '100%', maxWidth: 1100, height: '100%',
          display: 'flex', gap: 40, padding: 20
        }}>
          {/* Canvas */}
          <div style={{ flex: '0 0 650px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }} />
          </div>

          {/* Side panel */}
          <div style={{ flex: 1, maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
            {/* Reflection message */}
            <div style={{ minHeight: 60, fontSize: 15, color: '#111827', lineHeight: 1.5 }}>
              {reflection}
            </div>

            {/* Slider control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Resolution</div>
              <input
                type="range"
                min={minRes}
                max={maxRes}
                step="0.1"
                value={resolution}
                onInput={(e) => {
                  // Using onInput for immediate feedback
                  const newRes = parseFloat(e.target.value)
                  if (newRes !== pendingResolutionRef.current) {
                    pendingResolutionRef.current = newRes
                    setResolution(newRes)
                  }
                }}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  accentColor: '#3498db',
                  height: 6
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
                <span>Coarse</span>
                <span>Fine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
