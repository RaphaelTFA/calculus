const MATH_HELPERS = 'const {abs,pow,sin,cos,tan,sqrt,log,exp,floor,ceil,round,PI,E,min,max,sign} = Math;'

export function createExpressionFn(expression, argNames = ['x']) {
  return new Function(...argNames, `${MATH_HELPERS} return (${expression});`)
}

export function evaluateExpression(expression, scope = {}) {
  return new Function(...Object.keys(scope), `${MATH_HELPERS} return (${expression});`)(...Object.values(scope))
}

export function buildSamplePoints(fn, domain, baseSteps = 300, focusXs = []) {
  const [a, b] = domain
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return []

  const safeSteps = Math.max(2, Math.floor(baseSteps))
  const xs = []
  const addX = x => {
    if (!Number.isFinite(x)) return
    xs.push(Math.min(b, Math.max(a, x)))
  }

  for (let i = 0; i <= safeSteps; i++) {
    addX(a + ((b - a) * i) / safeSteps)
  }

  const focusStep = (b - a) / (safeSteps * 6)
  focusXs.forEach(focusX => {
    if (!Number.isFinite(focusX)) return
    if (focusX < a || focusX > b) return
    for (let offset = -2; offset <= 2; offset++) {
      addX(focusX + offset * focusStep)
    }
  })

  // dedupe using numeric tolerance to avoid collapsing distinct nearby samples
  const tol = 1e-12
  const sorted = xs.map(x => Number(x)).sort((a, b) => a - b)
  const unique = []
  for (const x of sorted) {
    if (unique.length === 0 || Math.abs(x - unique[unique.length - 1]) > tol) unique.push(x)
  }
  const uniqueXs = unique
  return uniqueXs.map(x => {
    let y = NaN
    try { y = fn(x) } catch { y = NaN }
    return { x, y }
  })
}