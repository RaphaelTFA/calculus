# Mathematical Interaction Engine — Instructions

## 1. Overview

This system is a multi-type mathematical interaction engine based on strict primitive ownership and deterministic recomputation. Each interaction type owns exactly one primitive; all other values are derived. No interaction type may leak its primitive or mix with another.

All interactions follow this universal recompute contract:

```
recompute(interaction, state) → { newState, systemState }
```
- **interaction**: Immutable lesson JSON
- **state**: Minimal primitive state owned by this type
- **newState**: Next primitive state
- **systemState**: Fully derived geometry and metrics

- `render()` consumes only `systemState` and NEVER mutates semantic state.
- `recompute()` NEVER performs rendering.

---

## 2. Interaction Types

### 🔷 Type A — Resolution Interaction
- **Primitive Owned**: Resolution / sampling fidelity
- **State**: `{ resolution: number }`
- **Semantics**: Resolution changes sampling density only. Function definition and domain NEVER change. No semantic parameters.

### 🔷 Type B — Parameter Control Interaction
- **Primitive Owned**: Semantic parameter
- **State**: `{ parameterValue: number }`
- **Semantics**: Parameter modifies semantic function. Sampling fidelity is fixed. No time or structural reordering.

#### Type B Extended Mode — Multi-Curve with Annotations

Type B supports an **extended mode** for lessons involving relationships between functions (limit rules, comparison, squeeze theorem, etc.).

**Extended system spec fields:**
- `curves[]`: Array of named curves. Each: `{ expr, label, color, style (solid|dashed|dotted), width }`. Replaces `model` + `refCurves`. Drawn in array order (last = on top).
- `approachPoint`: `{ x, label }` — vertical dashed line at x, with colored dots where each curve intersects.
- `annotations[]`:
  - `{ type: "limitValue", expr, at, label, color }` — evaluates `expr` at `x=at`, renders in a panel. Use `{value}` in label for computed substitution.
  - `{ type: "horizontalLine", expr, color }` — evaluates `expr` (using `p` only), draws a dotted horizontal line.
- `prompt`: Vietnamese instruction text displayed above the slider.

**Reflection text interpolation:**
- `{p}` → current parameter value (2 decimals)
- `{eval:JS_expression_using_p}` → evaluated expression result

**When to use extended mode:**
- Limit arithmetic (sum, product, quotient rules) — show f, g, and f∘g simultaneously
- Squeeze theorem — show bounded function + envelope curves
- Function comparison — show f vs f' or f vs g
- Continuity — show function value vs limit behavior

**Backward compatibility:** If `curves[]` is absent, the renderer falls back to `model` + `refCurves` (legacy mode). All existing lessons continue to work unchanged.

### 🔷 Type C — Temporal Playback
- **Primitive Owned**: Time
- **State**: `{ t: number }`
- **Semantics**: Only time changes. Deterministic replay from start to `state.t`. No incremental mutation. All positions and metrics are derived each frame. Rendering never computes physics.

### 🔷 Type E — Structural Decomposition Interaction
- **Primitive Owned**: Structural parameter (normalized, e.g., in [0, 1])
- **State**: `{ structure: number }`
- **Semantics**: Structure modifies partitioning or emphasis only. Conserved object and geometry base NEVER change. All partitions are derived deterministically. No semantic parameter, time, or resolution control.

#### Structural Meaning by `splitSpec`:
- `rectangleContribution`: Contribution emphasis
- `domainSplit`: Boundary position
- `signPartition`: Interval selection

---

## 3. Universal Engine Contract

Every interaction must obey:

```
function recompute(interaction, state) {
  return {
    newState: minimalPrimitiveState,
    systemState: {
      geometry: [...],
      metrics: {...},
      invariants: {...}
    }
  }
}
```

- `recompute` is pure
- `render` consumes only `systemState`
- No physics in render
- No geometry in React state
- No mutation of interaction JSON
- All DSL expressions evaluated through `createEvaluator`

---

## 4. DSL Evaluator Contract

All expression rules use:
```json
{
  "type": "expression",
  "expression": "...",
  "variables": [ ... ]
}
```
Allowed functions: `sin`, `cos`, `abs`, `sqrt`, `pow`, `log`, `exp`, `sign`

Expressions may return:
- Scalar
- Vector (Type C)
- Arithmetic sum (Type E)

---

## 5. Adaptation Requirements for New Systems

When adapting to a new process, the agent must:
- Map `interactionType` to correct primitive owner
- Preserve recompute purity
- Preserve deterministic replay for Type C
- Preserve structural-only mutation for Type E
- Preserve DSL evaluation boundaries
- Avoid mixing primitives
- Avoid storing derived values in state
- Avoid converting layout algorithms into semantic rules

---

## 6. Absolute Prohibitions

The adapting agent must NOT:
- Merge types
- Introduce new primitives
- Convert deterministic replay into incremental mutation
- Store geometry in persistent state
- Let rendering compute semantic values
- Convert conservation into hardcoded sums
- Hardcode layout per lesson
- Replace DSL with unscoped eval

---

## 7. Engine Capability vs Lesson Semantics

**Engine Capabilities:**
- Layout templates
- Encoding modes
- Trace rendering
- Axes rendering
- DSL evaluator
- Animation loop
- Drag-to-reorder

**Lesson Semantics:**
- Expression strings
- Parameter ranges
- Conservation formulas
- Initial conditions
- Reflection triggers

Engine may interpret capabilities, but may NOT reinterpret semantics.

---

## 8. Final Goal for Adaptation Agent

The adapted implementation must:
- Produce identical visual output
- Preserve invariant behavior
- Preserve primitive ownership
- Preserve JSON-driven configuration
- Maintain separation of:
  - Semantic definition
  - State transition
  - Rendering
