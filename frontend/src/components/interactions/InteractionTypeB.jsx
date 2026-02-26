import { useState, useRef, useEffect } from 'react'

// ─── DEFAULT LESSON CONFIG ───────────────────────────────────────────────────

const DEFAULT_LESSON = {
  meta: { parameterLabel: "System Tension" },
  parameter: { min: -5, max: 5, initial: 5 },
  system: {
    resolution: 200,
    view: { xMin: -4, xMax: 4, yMin: -10, yMax: 10 },
    model: "Math.pow(x, 4) - (p * Math.pow(x, 2))"
  },
  reflections: [
    {
      id: "single-well",
      trigger: (state) => state.currentValue < 0,
      text: "In this state, the system naturally settles toward a single central point."
    },
    {
      id: "transition",
      trigger: (state) => state.currentValue > 0 && state.currentValue < 1,
      text: "Notice the center flattening as the system loses its singular focus."
    },
    {
      id: "double-well",
      trigger: (state) => state.currentValue > 3,
      text: "The system has now split into two distinct basins, creating a choice between two states."
    }
  ]
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const MATH_HELPERS_STR = 'const {abs,pow,sin,cos,tan,sqrt,log,exp,floor,ceil,round,PI,E,min,max,sign} = Math;'

function makeEval(expr) {
  return new Function('x', 'p', `${MATH_HELPERS_STR} return ${expr}`)
}

function makeEvalP(expr) {
  return new Function('p', `${MATH_HELPERS_STR} return ${expr}`)
}

/**
 * Interpolate dynamic values in reflection text.
 * {p}           → current parameter value (2 decimals)
 * {eval:expr}   → evaluated JS expression with p in scope
 */
function interpolateText(text, p) {
  if (typeof text !== 'string') return text
  return text
    .replace(/\{p\}/g, Number.isFinite(p) ? p.toFixed(2) : String(p))
    .replace(/\{eval:([^}]+)\}/g, (_, expr) => {
      try {
        const val = makeEvalP(expr)(p)
        return Number.isFinite(val) ? val.toFixed(2) : '\u2204'
      } catch { return '?' }
    })
}

// ─── PURE RECOMPUTE ──────────────────────────────────────────────────────────

function recomputeSystem(config, p) {
  const { resolution, view } = config.system
  const dx = (view.xMax - view.xMin) / (resolution - 1)

  /* ── Build curves ──────────────────────────────────────────────────────── */
  let curvesData = []

  if (config.system.curves && config.system.curves.length > 0) {
    // ── Extended multi-curve mode ──────────────────────────────────────────
    curvesData = config.system.curves.map(curve => {
      const fn = makeEval(curve.expr)
      const pts = []
      for (let i = 0; i < resolution; i++) {
        const x = view.xMin + i * dx
        let y = 0
        try { y = fn(x, p) } catch { y = 0 }
        pts.push({ x, y })
      }
      return {
        points: pts,
        color: curve.color || '#3498db',
        label: curve.label || '',
        style: curve.style || 'solid',
        width: curve.width || 2,
        _fn: fn
      }
    })
  } else {
    // ── Legacy single-model mode ───────────────────────────────────────────
    const formula = makeEval(config.system.model)
    const mainPts = []
    for (let i = 0; i < resolution; i++) {
      const x = view.xMin + i * dx
      let y = 0
      try { y = formula(x, p) } catch { y = 0 }
      mainPts.push({ x, y })
    }

    // Legacy refCurves (behind main)
    if (config.system.refCurves && config.system.refCurves.length > 0) {
      config.system.refCurves.forEach(rc => {
        const fn = makeEval(rc.expr)
        const pts = []
        for (let i = 0; i < resolution; i++) {
          const x = view.xMin + i * dx
          let y = 0
          try { y = fn(x, p) } catch { y = 0 }
          pts.push({ x, y })
        }
        curvesData.push({
          points: pts,
          color: rc.color || '#999',
          label: rc.label || '',
          style: rc.dashed !== false ? 'dashed' : 'solid',
          width: 2,
          _fn: fn
        })
      })
    }

    // Main curve last (drawn on top)
    curvesData.push({
      points: mainPts,
      color: '#3498db',
      label: config.system.mainLabel || '',
      style: 'solid',
      width: 3,
      _fn: formula
    })
  }

  /* ── Approach point ────────────────────────────────────────────────────── */
  let approachData = null
  if (config.system.approachPoint) {
    const ax = config.system.approachPoint.x
    approachData = {
      x: ax,
      label: config.system.approachPoint.label || ('x \u2192 ' + ax),
      dots: curvesData.map(curve => {
        let y = 0
        try { y = curve._fn(ax, p) } catch { y = 0 }
        return { y, color: curve.color, label: curve.label }
      })
    }
  }

  /* ── Annotations ───────────────────────────────────────────────────────── */
  let annotationsData = []
  if (config.system.annotations) {
    annotationsData = config.system.annotations.map(ann => {
      if (ann.type === 'limitValue') {
        const fn = makeEval(ann.expr)
        let value = 0
        try { value = fn(ann.at, p) } catch { value = NaN }
        const display = Number.isFinite(value) ? value.toFixed(2) : '\u2204'
        return {
          ...ann,
          computedValue: value,
          computedLabel: (ann.label || '').replace('{value}', display)
        }
      }
      if (ann.type === 'horizontalLine') {
        const fn = makeEvalP(ann.expr)
        let value = 0
        try { value = fn(p) } catch { value = 0 }
        return { ...ann, computedValue: value }
      }
      return ann
    })
  }

  /* ── Legacy markers ────────────────────────────────────────────────────── */
  const markers = {}
  if (config.system.point) {
    markers.point = { x: config.system.point.x, y: p }
  }
  if (config.system.hole) {
    const hx = config.system.hole.x
    const fn = curvesData.length > 0
      ? curvesData[curvesData.length - 1]._fn
      : makeEval(config.system.model)
    let hy = 0
    try { hy = fn(hx, p) } catch { hy = 0 }
    markers.hole = { x: hx, y: hy }
  }

  return { curvesData, bounds: view, markers, approachData, annotationsData }
}

// ─── CANVAS RENDERING ────────────────────────────────────────────────────────

function setDash(ctx, style) {
  if (style === 'dashed') ctx.setLineDash([8, 6])
  else if (style === 'dotted') ctx.setLineDash([3, 3])
  else ctx.setLineDash([])
}

function renderCanvas(canvas, data) {
  const ctx = canvas.getContext('2d')
  const { curvesData, bounds, markers, approachData, annotationsData } = data

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const w = canvas.width / window.devicePixelRatio
  const h = canvas.height / window.devicePixelRatio

  const mapX = v => (v - bounds.xMin) / (bounds.xMax - bounds.xMin) * w
  const mapY = v => h - (v - bounds.yMin) / (bounds.yMax - bounds.yMin) * h

  /* ── Grid ──────────────────────────────────────────────────────────────── */
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 0.5
  for (let gx = Math.ceil(bounds.xMin); gx <= Math.floor(bounds.xMax); gx++) {
    if (gx === 0) continue
    ctx.beginPath(); ctx.moveTo(mapX(gx), 0); ctx.lineTo(mapX(gx), h); ctx.stroke()
  }
  for (let gy = Math.ceil(bounds.yMin); gy <= Math.floor(bounds.yMax); gy++) {
    if (gy === 0) continue
    ctx.beginPath(); ctx.moveTo(0, mapY(gy)); ctx.lineTo(w, mapY(gy)); ctx.stroke()
  }

  /* ── Axes ──────────────────────────────────────────────────────────────── */
  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, mapY(0)); ctx.lineTo(w, mapY(0))
  ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), h)
  ctx.stroke()

  // Tick labels
  ctx.fillStyle = '#b0b0b0'
  ctx.font = '10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'
  for (let tx = Math.ceil(bounds.xMin); tx <= Math.floor(bounds.xMax); tx++) {
    if (tx === 0) continue
    ctx.fillText(tx, mapX(tx), mapY(0) + 4)
  }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
  for (let ty = Math.ceil(bounds.yMin); ty <= Math.floor(bounds.yMax); ty++) {
    if (ty === 0) continue
    ctx.fillText(ty, mapX(0) - 6, mapY(ty))
  }

  /* ── Horizontal annotation lines ───────────────────────────────────────── */
  if (annotationsData) {
    annotationsData.forEach(ann => {
      if (ann.type === 'horizontalLine' && Number.isFinite(ann.computedValue)) {
        ctx.strokeStyle = ann.color || '#999'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(0, mapY(ann.computedValue))
        ctx.lineTo(w, mapY(ann.computedValue))
        ctx.stroke()
        ctx.setLineDash([])
      }
    })
  }

  /* ── Approach line ─────────────────────────────────────────────────────── */
  if (approachData) {
    const ax = mapX(approachData.x)
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])
    ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, h); ctx.stroke()
    ctx.setLineDash([])
    // Label at bottom
    ctx.fillStyle = '#64748b'
    ctx.font = 'bold 11px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
    ctx.fillText(approachData.label, ax, h - 6)
  }

  /* ── Curves ────────────────────────────────────────────────────────────── */
  curvesData.forEach(curve => {
    ctx.strokeStyle = curve.color
    ctx.lineWidth = curve.width
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    setDash(ctx, curve.style)
    ctx.beginPath()
    let pen = false
    curve.points.forEach(pt => {
      const py = mapY(pt.y)
      if (!Number.isFinite(pt.y) || py < -500 || py > h + 500) { pen = false; return }
      if (!pen) { ctx.moveTo(mapX(pt.x), py); pen = true }
      else ctx.lineTo(mapX(pt.x), py)
    })
    ctx.stroke()
    ctx.setLineDash([])
  })

  /* ── Approach dots ─────────────────────────────────────────────────────── */
  if (approachData) {
    approachData.dots.forEach(dot => {
      if (!Number.isFinite(dot.y)) return
      const dotX = mapX(approachData.x), dotY = mapY(dot.y)
      if (dotY < -10 || dotY > h + 10) return
      // White ring
      ctx.beginPath(); ctx.arc(dotX, dotY, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'; ctx.fill()
      // Colored center
      ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2)
      ctx.fillStyle = dot.color; ctx.fill()
    })
  }

  /* ── Legacy markers ────────────────────────────────────────────────────── */
  if (markers) {
    if (markers.hole) {
      const mx = mapX(markers.hole.x), my = mapY(markers.hole.y)
      ctx.beginPath(); ctx.arc(mx, my, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'; ctx.fill()
      ctx.strokeStyle = '#3498db'; ctx.lineWidth = 2.5; ctx.stroke()
    }
    if (markers.point) {
      const mx = mapX(markers.point.x), my = mapY(markers.point.y)
      ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#e74c3c'; ctx.fill()
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke()
    }
  }

  /* ── Legend (top-right) ────────────────────────────────────────────────── */
  const labeled = curvesData.filter(c => c.label)
  if (labeled.length > 0) {
    const fs = 12
    ctx.font = `bold ${fs}px Inter, system-ui, sans-serif`
    const pad = 10, lineH = fs + 8, swatchW = 24, gap = 8
    let maxLbl = 0
    labeled.forEach(c => { const m = ctx.measureText(c.label).width; if (m > maxLbl) maxLbl = m })
    const lw = pad + swatchW + gap + maxLbl + pad + 4
    const lh = labeled.length * lineH + pad * 2
    const lx = w - lw - 10, ly = 10

    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(lx, ly, lw, lh, 6); ctx.fill(); ctx.stroke()

    labeled.forEach((c, i) => {
      const ey = ly + pad + i * lineH + fs / 2 + 2
      ctx.strokeStyle = c.color
      ctx.lineWidth = c.style === 'dashed' ? 2 : Math.min(c.width || 2, 3)
      setDash(ctx, c.style)
      ctx.beginPath(); ctx.moveTo(lx + pad, ey); ctx.lineTo(lx + pad + swatchW, ey); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#333'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.fillText(c.label, lx + pad + swatchW + gap, ey)
    })
  }

  /* ── Limit-value panel (top-left) ──────────────────────────────────────── */
  const limits = (annotationsData || []).filter(a => a.type === 'limitValue')
  if (limits.length > 0) {
    const fs = 12
    ctx.font = `bold ${fs}px 'SF Mono', 'Fira Code', monospace`
    const pad = 10, lineH = fs + 8
    let maxW = 0
    limits.forEach(a => { const m = ctx.measureText(a.computedLabel).width; if (m > maxW) maxW = m })
    const pw = pad * 2 + 14 + maxW + 4
    const ph = limits.length * lineH + pad * 2
    const px = 10, py = 10

    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 6); ctx.fill(); ctx.stroke()

    limits.forEach((ann, i) => {
      const ey = py + pad + i * lineH + fs / 2 + 2
      // Color dot
      ctx.beginPath(); ctx.arc(px + pad + 4, ey, 4, 0, Math.PI * 2)
      ctx.fillStyle = ann.color || '#333'; ctx.fill()
      // Text
      ctx.fillStyle = '#1e293b'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.font = `bold ${fs}px 'SF Mono', 'Fira Code', monospace`
      ctx.fillText(ann.computedLabel, px + pad + 14, ey)
    })
  }

  ctx.restore()
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function InteractionTypeB({ lesson: lessonProp }) {
  const config = lessonProp || DEFAULT_LESSON

  const [currentValue, setCurrentValue] = useState(config.parameter.initial)
  const [cards, setCards] = useState([])

  const canvasRef = useRef(null)
  const valueRef = useRef(currentValue)

  useEffect(() => { valueRef.current = currentValue }, [currentValue])

  // Resize + initial render
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const parent = canvas.parentElement
      canvas.width = parent.clientWidth * window.devicePixelRatio
      canvas.height = parent.clientHeight * window.devicePixelRatio
      renderCanvas(canvas, recomputeSystem(config, valueRef.current))
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Re-render on value change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderCanvas(canvas, recomputeSystem(config, currentValue))
  }, [currentValue])

  // Reflection triggers — evaluate on every value change, interpolate text
  useEffect(() => {
    const state = { currentValue }
    let activeRef = null

    for (const ref of config.reflections) {
      let triggered = false
      if (typeof ref.trigger === 'function') {
        triggered = ref.trigger(state)
      } else if (typeof ref.trigger === 'string') {
        try {
          triggered = new Function('state', `"use strict"; return (${ref.trigger});`)(state)
        } catch { triggered = false }
      } else if (ref.triggerSpec) {
        const { field, op, value } = ref.triggerSpec
        const v = state[field]
        triggered = op === '>=' ? v >= value
          : op === '>' ? v > value
            : op === '<=' ? v <= value
              : op === '<' ? v < value
                : false
      }
      if (triggered) { activeRef = ref; break }
    }

    if (activeRef) {
      const text = interpolateText(activeRef.text, currentValue)
      setCards(prev => {
        // Same trigger — just update interpolated text if changed
        if (prev.length === 1 && prev[0].id === activeRef.id && prev[0].rawText === activeRef.text) {
          if (prev[0].text !== text) return [{ ...prev[0], text }]
          return prev
        }
        return [{ id: activeRef.id, rawText: activeRef.text, text, visible: false }]
      })
    } else {
      setCards([])
    }
  }, [currentValue])

  // Card fade-in animation
  useEffect(() => {
    if (cards.some(c => !c.visible)) {
      requestAnimationFrame(() => {
        setCards(prev => prev.map(c => c.visible ? c : { ...c, visible: true }))
      })
    }
  }, [cards])

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: '#ffffff', overflow: 'hidden'
    }}>
      {/* Main stage */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        {/* Canvas + reflections row */}
        <div style={{
          flex: 1, width: '100%', maxWidth: 1100,
          display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 40
        }}>
          {/* Canvas */}
          <div style={{ flex: '0 0 700px', maxWidth: 800, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', maxHeight: 500, display: 'block' }}
            />
          </div>

          {/* Reflection cards */}
          <div style={{
            flex: 1, maxWidth: 320,
            display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto'
          }}>
            {cards.map(card => (
              <div
                key={card.id}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  padding: 15,
                  borderLeft: '4px solid #3498db',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  borderRadius: 4,
                  fontSize: '0.95rem',
                  lineHeight: 1.4,
                  opacity: card.visible ? 1 : 0,
                  transform: card.visible ? 'translateX(0)' : 'translateX(20px)',
                  transition: 'all 0.5s ease-out'
                }}
              >
                {card.text}
              </div>
            ))}
          </div>
        </div>

        {/* Slider panel */}
        <div style={{
          width: '100%', maxWidth: 600,
          padding: 20, background: '#f8f9fa',
          borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          marginTop: 20, border: '1px solid #ddd'
        }}>
          {config.prompt && (
            <p style={{
              margin: '0 0 12px', fontSize: 13, color: '#64748b',
              lineHeight: 1.4, fontStyle: 'italic'
            }}>{config.prompt}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <label style={{ fontWeight: 600, minWidth: 120, fontSize: 14, color: '#2c3e50' }}>
              {config.meta.parameterLabel}
            </label>
            <input
              type="range"
              step="0.001"
              min={config.parameter.min}
              max={config.parameter.max}
              value={currentValue}
              onChange={e => setCurrentValue(parseFloat(e.target.value))}
              style={{ flex: 1, cursor: 'pointer', accentColor: '#3498db' }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#3498db', fontWeight: 700, minWidth: 40 }}>
              {currentValue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
