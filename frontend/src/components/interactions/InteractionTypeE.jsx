import { useState, useRef, useEffect } from 'react'

// ─── DEFAULT LESSON CONFIG ───────────────────────────────────────────────────

const DEFAULT_LESSON = {
  "interactionType": "E",
  "parameterSpec": {
    "structure": { "min": 0, "max": 1, "step": 0.01, "initial": 0.4, "label": "Split position (s)" }
  },
  "systemSpec": {
    "baseValues": {},
    "conservedObject": { "type": "expression", "expression": "(4*4*4)/3", "variables": [] }
  },
  "reflectionSpec": {
    "triggers": [
      { "type": "structureNear",  "value": 0.5, "tolerance": 0.05, "message": "The area is being split into two equal parts." },
      { "type": "structureBelow", "value": 0.15,                   "message": "Most of the accumulated area lies to the right of the split." },
      { "type": "structureAbove", "value": 0.85,                   "message": "Most of the accumulated area now lies to the left of the split." }
    ]
  },
  "representationSpec": {
    "mode": "geometricSplit",
    "geometryBase": { "type": "areaUnderCurve", "function": "x*x", "domain": [0, 4] },
    "splitSpec": { "type": "domainSplit" },
    "viewBox": { "xMin": 0, "xMax": 4.5, "yMin": 0, "yMax": 18 }
  }
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function evalExpr(expr, scope) {
  const fn = new Function(...Object.keys(scope), `"use strict"; return (${expr});`)
  return fn(...Object.values(scope))
}

function integrate(f, a, b, n = 200) {
  const dx = (b - a) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += f(a + i * dx) * dx
  }
  return sum
}

// ─── GEOMETRY BUILDER ────────────────────────────────────────────────────────

function buildBaseGeometry(spec, scope) {
  switch (spec.type) {
    case "rectangle":
      return { type: "rectangle", x: spec.origin[0], y: spec.origin[1], width: evalExpr(spec.width, scope), height: evalExpr(spec.height, scope) }
    case "areaUnderCurve":
      return { type: "areaUnderCurve", functionSpec: spec.function, domain: spec.domain }
    case "regionBetweenCurves":
      return { type: "regionBetweenCurves", f: spec.f, g: spec.g, domain: spec.domain }
    default:
      throw new Error("Unsupported geometry: " + spec.type)
  }
}

function bisect(h, left, right, iterations = 25) {
  for (let i = 0; i < iterations; i++) {
    const mid = (left + right) / 2
    const yMid = h(mid)
    if (Math.abs(yMid) < 1e-10) return mid
    if (h(left) * yMid < 0) right = mid; else left = mid
  }
  return (left + right) / 2
}

function detectRoots(h, a, b, samples = 400) {
  const roots = []
  const dx = (b - a) / samples
  let prevX = a, prevY = h(prevX)
  for (let i = 1; i <= samples; i++) {
    const x = a + i * dx, y = h(x)
    if (Math.abs(prevY) < 1e-8) roots.push(prevX)
    else if (prevY * y < 0) roots.push(bisect(h, prevX, x))
    prevX = x; prevY = y
  }
  return roots
}

// ─── SPLIT ENGINE ────────────────────────────────────────────────────────────

function applySplit(splitSpec, base, structure, scope) {
  switch (splitSpec.type) {
    case "rectangleContribution": {
      const { u, v, du, dv } = scope
      return [
        { type: "rectangle", x: base.x, y: base.y + v, width: u,  height: dv, contribution: "u·dv" },
        { type: "rectangle", x: base.x + u, y: base.y, width: du, height: v,  contribution: "v·du" }
      ]
    }
    case "domainSplit": {
      const [a, b] = base.domain
      const split = a + structure * (b - a)
      return [
        { type: "areaUnderCurve", functionSpec: base.functionSpec, domain: [a, split] },
        { type: "areaUnderCurve", functionSpec: base.functionSpec, domain: [split, b] }
      ]
    }
    case "signPartition": {
      const f = new Function("x", `return ${base.f}`)
      const g = new Function("x", `return ${base.g}`)
      const h = x => f(x) - g(x)
      const [a, b] = base.domain
      const roots = detectRoots(h, a, b)
      const points = [a, ...roots, b].sort((x, y) => x - y)
      const parts = []
      for (let i = 0; i < points.length - 1; i++) {
        const x0 = points[i], x1 = points[i + 1]
        const sign = h((x0 + x1) / 2)
        if (Math.abs(sign) < 1e-6) continue
        parts.push({ type: "regionBetweenCurves", f: base.f, g: base.g, domain: [x0, x1], sign: sign > 0 ? "positive" : "negative", intervalIndex: i })
      }
      return parts
    }
    default:
      throw new Error("Unsupported split: " + splitSpec.type)
  }
}

// ─── MEASURE ─────────────────────────────────────────────────────────────────

function measure(geom) {
  switch (geom.type) {
    case "rectangle":
      return geom.width * geom.height
    case "areaUnderCurve": {
      const f = new Function("x", `return ${geom.functionSpec}`)
      return integrate(f, geom.domain[0], geom.domain[1])
    }
    case "regionBetweenCurves": {
      const f = new Function("x", `return ${geom.f}`)
      const g = new Function("x", `return ${geom.g}`)
      return integrate(x => f(x) - g(x), geom.domain[0], geom.domain[1])
    }
    default:
      return 0
  }
}

// ─── RECOMPUTE ───────────────────────────────────────────────────────────────

function recompute(lesson, state) {
  const scope = lesson.systemSpec.baseValues || {}
  const TOTAL = evalExpr(lesson.systemSpec.conservedObject.expression, scope)
  const base = buildBaseGeometry(lesson.representationSpec.geometryBase, scope)
  const parts = applySplit(lesson.representationSpec.splitSpec, base, state.structure, scope)

  let activeIndex = null
  if (lesson.representationSpec.splitSpec.type === "signPartition" && parts.length > 0) {
    activeIndex = Math.min(parts.length - 1, Math.floor(state.structure * parts.length))
  }

  const derived = parts.reduce((acc, p) => acc + measure(p), 0)
  if (Math.abs(derived - TOTAL) > 1e-2) console.warn("Invariant violation", derived, TOTAL)

  return { base, parts, invariant: TOTAL, activeIndex }
}

// ─── RENDER ──────────────────────────────────────────────────────────────────

function render(lesson, system, state, canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const vb = lesson.representationSpec.viewBox
  const mapX = x => (x - vb.xMin) / (vb.xMax - vb.xMin) * canvas.width
  const mapY = y => canvas.height - (y - vb.yMin) / (vb.yMax - vb.yMin) * canvas.height

  function drawRectangle(r, color, alpha = 1) {
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.fillRect(mapX(r.x), mapY(r.y + r.height), mapX(r.x + r.width) - mapX(r.x), mapY(r.y) - mapY(r.y + r.height))
    ctx.globalAlpha = 1
  }

  function drawArea(area, color) {
    const f = new Function("x", `return ${area.functionSpec}`)
    const [a, b] = area.domain
    ctx.beginPath()
    ctx.moveTo(mapX(a), mapY(0))
    for (let x = a; x <= b; x += 0.02) ctx.lineTo(mapX(x), mapY(f(x)))
    ctx.lineTo(mapX(b), mapY(0))
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  function drawRegionBetween(region, color) {
    const f = new Function("x", `return ${region.f}`)
    const g = new Function("x", `return ${region.g}`)
    const [a, b] = region.domain
    ctx.beginPath()
    ctx.moveTo(mapX(a), mapY(g(a)))
    for (let x = a; x <= b; x += 0.02) ctx.lineTo(mapX(x), mapY(f(x)))
    for (let x = b; x >= a; x -= 0.02) ctx.lineTo(mapX(x), mapY(g(x)))
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  // Draw base ghost
  if (system.base.type === "rectangle") drawRectangle(system.base, "rgba(59,130,246,0.1)")
  if (system.base.type === "areaUnderCurve") drawArea(system.base, "rgba(255,255,255,0.05)")
  if (system.base.type === "regionBetweenCurves") drawRegionBetween(system.base, "rgba(255,255,255,0.05)")

  // Draw parts
  system.parts.forEach((p, i) => {
    if (p.type === "rectangle") {
      const alpha = p.contribution === "u·dv" ? 1 - state.structure : state.structure
      drawRectangle(p, p.contribution === "u·dv" ? "#3b82f6" : "#0ea5e9", alpha)
    }
    if (p.type === "areaUnderCurve") {
      if (lesson.representationSpec.splitSpec.type === "domainSplit") {
        const balanced = Math.abs(state.structure - 0.5) < 0.05
        drawArea(p, balanced ? "#2563eb" : (i ? "#38bdf8" : "#60a5fa"))
      } else {
        drawArea(p, i ? "#38bdf8" : "#60a5fa")
      }
    }
    if (p.type === "regionBetweenCurves") {
      const isActive = system.activeIndex !== null && p.intervalIndex === system.activeIndex
      ctx.globalAlpha = isActive ? 1 : 0.25
      drawRegionBetween(p, p.sign === "positive" ? "#2563eb" : "#ef4444")
      ctx.globalAlpha = 1
    }
  })

  // Domain split labels
  if (lesson.representationSpec.splitSpec.type === "domainSplit" && system.base.type === "areaUnderCurve") {
    const [a, b] = system.base.domain
    const split = a + state.structure * (b - a)
    ctx.fillStyle = "#111827"
    ctx.font = "14px system-ui"
    ctx.fillText("∫ₐˢ f(x) dx", mapX((a + split) / 2) - 40, mapY(vb.yMax) + 20)
    ctx.fillText("∫ₛᵇ f(x) dx", mapX((split + b) / 2) - 40, mapY(vb.yMax) + 20)
  }
}

// ─── REFLECTION ──────────────────────────────────────────────────────────────

function evaluateReflection(lesson, state) {
  if (!lesson.reflectionSpec) return ""

  if (lesson.representationSpec.splitSpec.type === "signPartition") {
    const system = recompute(lesson, state)
    if (system.activeIndex != null) {
      const active = system.parts[system.activeIndex]
      return active.sign === "positive"
        ? "In this interval, f(x) > g(x), so the signed area is positive."
        : "In this interval, f(x) < g(x), so the signed area is negative."
    }
  }

  for (const t of lesson.reflectionSpec.triggers) {
    if (t.type === "structureAbove" && state.structure > t.value) return t.message
    if (t.type === "structureBelow" && state.structure < t.value) return t.message
    if (t.type === "structureNear" && Math.abs(state.structure - t.value) < (t.tolerance || 0.05)) return t.message
  }

  return ""
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function InteractionTypeE({ lesson: lessonProp }) {
  const LESSON = lessonProp || DEFAULT_LESSON

  const initialStructure = LESSON.parameterSpec.structure?.initial ?? 0.4
  const [structure, setStructure] = useState(initialStructure)
  const canvasRef = useRef(null)

  const state = { structure }
  const message = evaluateReflection(LESSON, state)

  // Render canvas when structure changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const system = recompute(LESSON, state)
    render(LESSON, system, state, canvas, ctx)
  }, [structure])

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    const handleResize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      const system = recompute(LESSON, { structure })
      render(LESSON, system, { structure }, canvas, ctx)
    }

    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [structure])

  const paramSpec = LESSON.parameterSpec.structure || { min: 0, max: 1, step: 0.01 }

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: '#ffffff',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Canvas + popup */}
      <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 20px 0' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%', borderRadius: 12, border: '1px solid #d1d5db', background: '#ffffff' }}
        />
        {/* Reflection popup */}
        <div style={{
          position: 'absolute', top: 30, right: 30,
          maxWidth: 260,
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #d1d5db',
          borderRadius: 12,
          padding: '12px 16px',
          fontSize: 14, color: '#111827',
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          pointerEvents: 'none',
          transition: 'all 0.25s ease',
          opacity: message ? 1 : 0,
          transform: message ? 'translateY(0)' : 'translateY(-6px)'
        }}>
          {message}
        </div>
      </div>

      {/* Slider */}
      <div style={{ width: '100%', maxWidth: 640, padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <input
          type="range"
          min={paramSpec.min}
          max={paramSpec.max}
          step={paramSpec.step}
          value={structure}
          onChange={e => setStructure(parseFloat(e.target.value))}
          style={{ width: '100%', cursor: 'pointer', accentColor: '#3498db' }}
        />
        {paramSpec.label && (
          <div style={{ fontSize: 13, color: '#6b7280' }}>{paramSpec.label}</div>
        )}
      </div>
    </div>
  )
}
