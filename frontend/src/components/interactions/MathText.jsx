import { InlineMath } from 'react-katex'

/**
 * Renders text with inline $LaTeX$ segments via KaTeX.
 * Splits on $...$ and renders math inline; rest is plain text.
 */
export function MathText({ text }) {
  if (!text) return null
  const str = String(text)
  const parts = str.split(/(\$[^$]+\$)/g)
  const hasMath = parts.some(p => p.startsWith('$') && p.endsWith('$') && p.length > 1)
  if (!hasMath) return <span>{str}</span>
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
          const latex = part.slice(1, -1)
          try { return <InlineMath key={idx} math={latex} /> }
          catch { return <code key={idx} style={{ color: '#ef4444', fontSize: 12 }}>{latex}</code> }
        }
        return part ? <span key={idx}>{part}</span> : null
      })}
    </>
  )
}
