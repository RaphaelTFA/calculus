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

// ─── PURE LOGIC ──────────────────────────────────────────────────────────────

function recomputeSystem(config, p) {
  const { resolution, view, model } = config.system
  const points = []
  const dx = (view.xMax - view.xMin) / (resolution - 1)
  const formula = new Function('x', 'p', `return ${model}`)

  for (let i = 0; i < resolution; i++) {
    const x = view.xMin + i * dx
    let y = 0
    try { y = formula(x, p) } catch { y = 0 }
    points.push({ x, y })
  }
  return { points, bounds: view }
}

function renderCanvas(canvas, systemData) {
  const ctx = canvas.getContext('2d')
  const { points, bounds } = systemData

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const w = canvas.width / window.devicePixelRatio
  const h = canvas.height / window.devicePixelRatio

  const mapX = val => (val - bounds.xMin) / (bounds.xMax - bounds.xMin) * w
  const mapY = val => h - (val - bounds.yMin) / (bounds.yMax - bounds.yMin) * h

  // Axes
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, mapY(0)); ctx.lineTo(w, mapY(0))
  ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), h)
  ctx.stroke()

  // Curve
  ctx.strokeStyle = '#3498db'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  points.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(mapX(pt.x), mapY(pt.y))
    else ctx.lineTo(mapX(pt.x), mapY(pt.y))
  })
  ctx.stroke()
  ctx.restore()
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function InteractionTypeB({ lesson: lessonProp }) {
  const config = lessonProp || DEFAULT_LESSON

  const [currentValue, setCurrentValue] = useState(config.parameter.initial)
  const triggeredRef = useRef(new Set())
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

  // Reflection triggers — use ref to avoid race conditions with duplicate cards
  useEffect(() => {
    const newCards = []
    const state = { currentValue }

    config.reflections.forEach(ref => {
      if (triggeredRef.current.has(ref.id)) return
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
      if (triggered) {
        triggeredRef.current.add(ref.id)
        newCards.push({ id: ref.id, text: ref.text, visible: false })
      }
    })

    if (newCards.length > 0) {
      // Show only the latest triggered card, replacing any previous one
      setCards([{ ...newCards[newCards.length - 1], visible: false }])
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
