import { useState, useMemo } from 'react'

// ─── DEFAULT LESSON CONFIG ───────────────────────────────────────────────────

const DEFAULT_LESSON = {
  "interactionType": "E",
  "parameterSpec": {
    "structure": { "min": 0, "max": 1, "step": 0.01, "initial": 0.4, "label": "Điểm chia (s)" }
  },
  "systemSpec": {
    "baseValues": {},
    "conservedObject": { "type": "expression", "expression": "(4*4*4)/3", "variables": [] }
  },
  "reflectionSpec": {
    "triggers": [
      { "type": "structureNear", "value": 0.5, "tolerance": 0.05, "message": "Diện tích được chia thành hai phần bằng nhau." },
      { "type": "structureBelow", "value": 0.15, "message": "Hầu hết diện tích nằm về phía phải điểm chia." },
      { "type": "structureAbove", "value": 0.85, "message": "Hầu hết diện tích nằm về phía trái điểm chia." }
    ]
  },
  "representationSpec": {
    "mode": "geometricSplit",
    "geometryBase": { "type": "areaUnderCurve", "function": "x*x", "domain": [0, 4] },
    "splitSpec": { "type": "domainSplit" },
    "viewBox": { "xMin": 0, "xMax": 4.5, "yMin": 0, "yMax": 18 }
  }
}

// ─── MATH UTILITIES ──────────────────────────────────────────────────────────

function evalExpr(expr, scope) {
  const fn = new Function(...Object.keys(scope), `"use strict"; return (${expr});`)
  return fn(...Object.values(scope))
}

const MATH_HELPERS = 'const {abs,pow,sin,cos,tan,sqrt,log,exp,floor,ceil,round,PI,E,min,max,sign} = Math;'
function makeFn(expr) {
  return new Function("x", `${MATH_HELPERS} return ${expr}`)
}

function integrate(f, a, b, n = 300) {
  const dx = (b - a) / n
  let sum = 0
  for (let i = 0; i < n; i++) sum += f(a + i * dx) * dx
  return sum
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

// ─── GEOMETRY ENGINE ─────────────────────────────────────────────────────────

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

function applySplit(splitSpec, base, structure, scope) {
  switch (splitSpec.type) {
    case "rectangleContribution": {
      const { u, v, du, dv } = scope
      return [
        { type: "rectangle", x: base.x, y: base.y + v, width: u, height: dv, contribution: "u·dv" },
        { type: "rectangle", x: base.x + u, y: base.y, width: du, height: v, contribution: "v·du" }
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
      const f = makeFn(base.f)
      const g = makeFn(base.g)
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

function measure(geom) {
  switch (geom.type) {
    case "rectangle": return geom.width * geom.height
    case "areaUnderCurve": {
      const f = makeFn(geom.functionSpec)
      return integrate(f, geom.domain[0], geom.domain[1])
    }
    case "regionBetweenCurves": {
      const f = makeFn(geom.f)
      const g = makeFn(geom.g)
      return Math.abs(integrate(x => f(x) - g(x), geom.domain[0], geom.domain[1]))
    }
    default: return 0
  }
}

function recompute(lesson, state) {
  const scope = lesson.systemSpec.baseValues || {}
  const TOTAL = evalExpr(lesson.systemSpec.conservedObject.expression, scope)
  const base = buildBaseGeometry(lesson.representationSpec.geometryBase, scope)
  const parts = applySplit(lesson.representationSpec.splitSpec, base, state.structure, scope)

  let activeIndex = null
  if (lesson.representationSpec.splitSpec.type === "signPartition" && parts.length > 0)
    activeIndex = Math.min(parts.length - 1, Math.floor(state.structure * parts.length))

  return { base, parts, invariant: TOTAL, activeIndex }
}

function evaluateReflection(lesson, state) {
  if (!lesson.reflectionSpec) return ""
  if (lesson.representationSpec.splitSpec.type === "signPartition") {
    const system = recompute(lesson, state)
    if (system.activeIndex != null) {
      const active = system.parts[system.activeIndex]
      return active.sign === "positive"
        ? "Trên khoảng này f(x) > g(x), diện tích có dấu dương."
        : "Trên khoảng này f(x) < g(x), diện tích có dấu âm."
    }
  }
  for (const t of lesson.reflectionSpec.triggers) {
    if (t.type === "structureAbove" && state.structure > t.value) return t.message
    if (t.type === "structureBelow" && state.structure < t.value) return t.message
    if (t.type === "structureNear" && Math.abs(state.structure - t.value) < (t.tolerance || 0.05)) return t.message
  }
  return ""
}

// ─── SVG HELPERS ─────────────────────────────────────────────────────────────

const COLORS = {
  left: { fill: '#6366f1', stroke: '#4338ca', text: '#4338ca' },   // indigo
  right: { fill: '#38bdf8', stroke: '#0284c7', text: '#0369a1' },   // sky
  positive: { fill: '#34d399', stroke: '#059669', text: '#065f46' },   // emerald
  negative: { fill: '#f87171', stroke: '#dc2626', text: '#991b1b' },   // red
  splitLine: '#f59e0b',                                                  // amber
  curve: '#1e293b',
  axis: '#94a3b8',
  grid: '#e2e8f0',
  label: '#64748b',
}

function buildCurvePath(fnSpec, domain, mapX, mapY, steps = 300) {
  const f = makeFn(fnSpec)
  const [a, b] = domain
  const dx = (b - a) / steps
  let d = ""
  for (let i = 0; i <= steps; i++) {
    const x = a + i * dx
    const y = f(x)
    d += i === 0 ? `M ${mapX(x)} ${mapY(y)}` : ` L ${mapX(x)} ${mapY(y)}`
  }
  return d
}

function buildAreaPath(geom, mapX, mapY, steps = 300) {
  if (geom.type === "areaUnderCurve") {
    const f = makeFn(geom.functionSpec)
    const [a, b] = geom.domain
    if (a >= b) return ""
    const dx = (b - a) / steps
    let pts = []
    for (let i = 0; i <= steps; i++) {
      const x = a + i * dx
      pts.push(`${mapX(x)},${mapY(f(x))}`)
    }
    return `M ${mapX(a)},${mapY(0)} L ${pts.join(" L ")} L ${mapX(b)},${mapY(0)} Z`
  }
  if (geom.type === "regionBetweenCurves") {
    const f = makeFn(geom.f)
    const g = makeFn(geom.g)
    const [a, b] = geom.domain
    const dx = (b - a) / steps
    const top = [], bot = []
    for (let i = 0; i <= steps; i++) {
      const x = a + i * dx
      top.push(`${mapX(x)},${mapY(f(x))}`)
      bot.push(`${mapX(x)},${mapY(g(x))}`)
    }
    return `M ${top[0]} L ${top.join(" L ")} L ${bot[steps]} L ${bot.slice().reverse().join(" L ")} Z`
  }
  if (geom.type === "rectangle") {
    const { x, y, width, height } = geom
    return `M ${mapX(x)},${mapY(y)} L ${mapX(x + width)},${mapY(y)} L ${mapX(x + width)},${mapY(y + height)} L ${mapX(x)},${mapY(y + height)} Z`
  }
  return ""
}

// ─── SVG GRAPH VIEW ──────────────────────────────────────────────────────────

function GraphView({ lesson, structure, system }) {
  const vb = lesson.representationSpec.viewBox
  const splitType = lesson.representationSpec.splitSpec.type

  const W = 500, H = 280
  const PAD = { top: 16, right: 16, bottom: 36, left: 42 }
  const gW = W - PAD.left - PAD.right
  const gH = H - PAD.top - PAD.bottom

  const mapX = x => PAD.left + (x - vb.xMin) / (vb.xMax - vb.xMin) * gW
  const mapY = y => PAD.top + gH - (y - vb.yMin) / (vb.yMax - vb.yMin) * gH

  // Grid lines
  const xTicks = []
  const yTicks = []
  const xStep = Math.ceil((vb.xMax - vb.xMin) / 6)
  const yStep = Math.ceil((vb.yMax - vb.yMin) / 5)
  for (let x = Math.ceil(vb.xMin); x <= vb.xMax; x += xStep) xTicks.push(x)
  for (let y = Math.ceil(vb.yMin); y <= vb.yMax; y += yStep) yTicks.push(y)

  // Split line x position (for domainSplit)
  let splitX = null
  if (splitType === "domainSplit" && system.base.type === "areaUnderCurve") {
    const [a, b] = system.base.domain
    splitX = a + structure * (b - a)
  }

  // Curve path (full domain)
  let curvePath = ""
  if (system.base.type === "areaUnderCurve")
    curvePath = buildCurvePath(system.base.functionSpec, system.base.domain, mapX, mapY)
  else if (system.base.type === "regionBetweenCurves") {
    curvePath = buildCurvePath(system.base.f, system.base.domain, mapX, mapY)
    curvePath += " " + buildCurvePath(system.base.g, system.base.domain, mapX, mapY)
  }

  // Part color logic
  function partColor(p, i) {
    if (p.type === "regionBetweenCurves")
      return p.sign === "positive" ? COLORS.positive.fill : COLORS.negative.fill
    if (p.type === "areaUnderCurve")
      return i === 0 ? COLORS.left.fill : COLORS.right.fill
    if (p.type === "rectangle")
      return p.contribution === "u·dv" ? COLORS.left.fill : COLORS.right.fill
    return "#aaa"
  }

  function partOpacity(p, i) {
    if (splitType === "signPartition")
      return (system.activeIndex !== null && p.intervalIndex === system.activeIndex) ? 0.85 : 0.2
    return 0.75
  }

  // Area labels for domainSplit
  let leftLabelX = null, rightLabelX = null, labelY = null
  if (splitType === "domainSplit" && splitX !== null) {
    const [a, b] = system.base.domain
    leftLabelX = mapX((a + splitX) / 2)
    rightLabelX = mapX((splitX + b) / 2)
    labelY = mapY(vb.yMax * 0.35)
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="grad-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.left.fill} stopOpacity="0.9" />
          <stop offset="100%" stopColor={COLORS.left.fill} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="grad-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.right.fill} stopOpacity="0.9" />
          <stop offset="100%" stopColor={COLORS.right.fill} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="grad-pos" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.positive.fill} stopOpacity="0.9" />
          <stop offset="100%" stopColor={COLORS.positive.fill} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="grad-neg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.negative.fill} stopOpacity="0.9" />
          <stop offset="100%" stopColor={COLORS.negative.fill} stopOpacity="0.4" />
        </linearGradient>
        <clipPath id="graph-clip">
          <rect x={PAD.left} y={PAD.top} width={gW} height={gH} />
        </clipPath>
      </defs>

      {/* Background */}
      <rect x={PAD.left} y={PAD.top} width={gW} height={gH} fill="#f8fafc" rx="6" />

      {/* Grid */}
      <g stroke={COLORS.grid} strokeWidth="1">
        {xTicks.map(x => <line key={`gx${x}`} x1={mapX(x)} y1={PAD.top} x2={mapX(x)} y2={PAD.top + gH} />)}
        {yTicks.map(y => <line key={`gy${y}`} x1={PAD.left} y1={mapY(y)} x2={PAD.left + gW} y2={mapY(y)} />)}
      </g>

      {/* Filled parts — with clip */}
      <g clipPath="url(#graph-clip)">
        {system.parts.map((p, i) => {
          const d = buildAreaPath(p, mapX, mapY)
          if (!d) return null
          let fill
          if (p.type === "areaUnderCurve")
            fill = i === 0 ? "url(#grad-left)" : "url(#grad-right)"
          else if (p.type === "regionBetweenCurves")
            fill = p.sign === "positive" ? "url(#grad-pos)" : "url(#grad-neg)"
          else
            fill = p.contribution === "u·dv" ? "url(#grad-left)" : "url(#grad-right)"
          return (
            <path
              key={i}
              d={d}
              fill={fill}
              opacity={partOpacity(p, i)}
              style={{ transition: 'opacity 0.2s' }}
            />
          )
        })}

        {/* Curve outline */}
        {curvePath && (
          <path d={curvePath} fill="none" stroke={COLORS.curve} strokeWidth="2.5" strokeLinejoin="round" />
        )}

        {/* Split line */}
        {splitX !== null && (
          <line
            x1={mapX(splitX)} y1={PAD.top}
            x2={mapX(splitX)} y2={PAD.top + gH}
            stroke={COLORS.splitLine} strokeWidth="2"
            strokeDasharray="6 4"
            style={{ transition: 'x1 0.05s, x2 0.05s' }}
          />
        )}

        {/* Area labels inside graph */}
        {leftLabelX !== null && splitX - system.base.domain[0] > 0.3 && (
          <text x={leftLabelX} y={labelY} textAnchor="middle" fontSize="13" fill={COLORS.left.stroke} fontWeight="600" fontFamily="system-ui">
            A₁
          </text>
        )}
        {rightLabelX !== null && system.base.domain[1] - splitX > 0.3 && (
          <text x={rightLabelX} y={labelY} textAnchor="middle" fontSize="13" fill={COLORS.right.stroke} fontWeight="600" fontFamily="system-ui">
            A₂
          </text>
        )}
      </g>

      {/* Axes */}
      <g stroke={COLORS.axis} strokeWidth="1.5">
        {/* x-axis */}
        <line x1={PAD.left} y1={mapY(0)} x2={PAD.left + gW + 6} y2={mapY(0)} markerEnd="url(#arrow)" />
        {/* y-axis */}
        <line x1={PAD.left} y1={PAD.top + gH} x2={PAD.left} y2={PAD.top - 6} />
      </g>

      {/* Axis tick labels */}
      <g fill={COLORS.label} fontSize="10" fontFamily="system-ui" textAnchor="middle">
        {xTicks.filter(x => x > 0).map(x => (
          <text key={`xl${x}`} x={mapX(x)} y={PAD.top + gH + 14}>{x}</text>
        ))}
      </g>
      <g fill={COLORS.label} fontSize="10" fontFamily="system-ui" textAnchor="end">
        {yTicks.filter(y => y > 0).map(y => (
          <text key={`yl${y}`} x={PAD.left - 5} y={mapY(y) + 4}>{y}</text>
        ))}
      </g>

      {/* Split x label */}
      {splitX !== null && (
        <text
          x={mapX(splitX)} y={PAD.top + gH + 25}
          textAnchor="middle" fontSize="11" fill={COLORS.splitLine} fontWeight="700" fontFamily="system-ui"
          style={{ transition: 'x 0.05s' }}
        >
          s={splitX.toFixed(2)}
        </text>
      )}
    </svg>
  )
}

// ─── METRIC CARD ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, color, textColor, isTotal }) {
  return (
    <div style={{
      flex: 1,
      background: isTotal ? '#1e293b' : color,
      borderRadius: 12,
      padding: '10px 14px',
      display: 'flex', flexDirection: 'column', gap: 2,
      border: isTotal ? 'none' : `1.5px solid ${textColor}33`,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: isTotal ? '#94a3b8' : textColor, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 20, fontWeight: 700, color: isTotal ? '#f1f5f9' : textColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
        {typeof value === 'number' ? value.toFixed(3) : value}
      </span>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function InteractionTypeE({ lesson: lessonProp }) {
  const lesson = lessonProp || DEFAULT_LESSON
  const paramSpec = lesson.parameterSpec.structure || { min: 0, max: 1, step: 0.01, initial: 0.5 }
  const splitType = lesson.representationSpec.splitSpec.type

  const [structure, setStructure] = useState(paramSpec.initial ?? 0.5)
  const state = { structure }

  const system = useMemo(() => recompute(lesson, state), [lesson, structure])
  const message = evaluateReflection(lesson, state)

  // Compute part measures for display
  const partMeasures = useMemo(() => system.parts.map(p => measure(p)), [system])
  const total = system.invariant

  // Build metric cards
  const metrics = useMemo(() => {
    if (splitType === "domainSplit") {
      return [
        { label: "A₁", value: partMeasures[0] ?? 0, color: '#e0e7ff', textColor: COLORS.left.text },
        { label: "A₂", value: partMeasures[1] ?? 0, color: '#e0f2fe', textColor: COLORS.right.text },
        { label: "A₁ + A₂", value: total, isTotal: true },
      ]
    }
    if (splitType === "rectangleContribution") {
      return [
        { label: "u · dv", value: partMeasures[0] ?? 0, color: '#e0e7ff', textColor: COLORS.left.text },
        { label: "v · du", value: partMeasures[1] ?? 0, color: '#e0f2fe', textColor: COLORS.right.text },
        { label: "Tổng", value: total, isTotal: true },
      ]
    }
    if (splitType === "signPartition") {
      const active = system.activeIndex != null ? system.parts[system.activeIndex] : null
      return [
        { label: "Diện tích >0", value: partMeasures.reduce((s, v, i) => system.parts[i]?.sign === 'positive' ? s + v : s, 0), color: '#d1fae5', textColor: COLORS.positive.text },
        { label: "Diện tích <0", value: partMeasures.reduce((s, v, i) => system.parts[i]?.sign === 'negative' ? s + v : s, 0), color: '#fee2e2', textColor: COLORS.negative.text },
        { label: "Tổng", value: total, isTotal: true },
      ]
    }
    return []
  }, [system, partMeasures, total, splitType])

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      userSelect: 'none',
    }}>

      {/* Metric cards */}
      {metrics.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {metrics.map((m, i) => (
            <MetricCard key={i} {...m} />
          ))}
        </div>
      )}

      {/* Graph */}
      <div style={{
        background: '#fff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 16,
        padding: '12px 8px 8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <GraphView lesson={lesson} structure={structure} system={system} />
      </div>

      {/* Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
            {paramSpec.label || "Cấu trúc"}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 700,
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: 6,
            padding: '2px 8px',
            border: '1px solid #fde68a',
          }}>
            {structure.toFixed(2)}
          </span>
        </div>
        <div style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center' }}>
          {/* Track background */}
          <div style={{
            position: 'absolute', left: 0, right: 0,
            height: 6, borderRadius: 99,
            background: '#e2e8f0',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(structure - paramSpec.min) / (paramSpec.max - paramSpec.min) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1, #38bdf8)',
              borderRadius: 99,
              transition: 'width 0.05s',
            }} />
          </div>
          <input
            type="range"
            min={paramSpec.min}
            max={paramSpec.max}
            step={paramSpec.step}
            value={structure}
            onChange={e => setStructure(parseFloat(e.target.value))}
            style={{
              position: 'absolute', left: 0, right: 0,
              width: '100%',
              appearance: 'none', WebkitAppearance: 'none',
              background: 'transparent',
              cursor: 'pointer',
              margin: 0,
            }}
          />
        </div>
      </div>

      {/* Reflection */}
      <div style={{
        minHeight: 40,
        padding: '10px 14px',
        borderRadius: 12,
        background: message ? '#fefce8' : '#f8fafc',
        border: message ? '1.5px solid #fde68a' : '1.5px solid #e2e8f0',
        fontSize: 14,
        color: message ? '#78350f' : '#94a3b8',
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all 0.25s ease',
      }}>
        {message
          ? <><span style={{ fontSize: 16 }}>💡</span> {message}</>
          : <span>Kéo thanh trượt để khám phá...</span>
        }
      </div>

      {/* Slider thumb styles */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid #6366f1;
          box-shadow: 0 1px 6px rgba(99,102,241,0.4);
          cursor: grab;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:active {
          cursor: grabbing;
          border-color: #38bdf8;
          box-shadow: 0 2px 10px rgba(56,189,248,0.5);
        }
        input[type=range]::-moz-range-thumb {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid #6366f1;
          box-shadow: 0 1px 6px rgba(99,102,241,0.4);
          cursor: grab;
        }
      `}</style>
    </div>
  )
}

