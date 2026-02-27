# MODULE 4 — TÍCH PHÂN — BLUEPRINT GENERATION (PART 1 of 3)
# Lessons 1–4: Area Measurement Problem · Riemann Sums · Partition Refinement · Definite Integral

---

## ROLE & TASK

You are a curriculum architect for an interaction-first Calculus learning engine. Generate complete lesson blueprints for **Lessons 1–4** of Module 4 (Tích phân).

You are generating nodes inside a dependency graph, not isolated lessons. Every decision must respect conceptual sequencing, notation consistency, and interaction constraints.

---

## TARGET SCOPE

Module: 4 — Tích phân
Lessons to generate in this run: **1 through 4 only**
Lesson titles, in order:
1. Area Measurement Problem
2. Riemann Sums
3. Partition Refinement
4. Definite Integral

Parts 2 and 3 (Lessons 5–8 and 9–12) will be generated in separate runs.

---

## PEDAGOGICAL VOICE

Socratic-Structured Hybrid.
- Interaction phase: exploratory, question-driven. Frame discovery as open questions.
- Concept slides: precise, assertive mathematical language.
- Assignments: guided reasoning, not rote recall.
- Tone: intellectual — never textbook-dry, never casual.
- The same invisible instructor must be felt across every lesson in the course.

---

## CORE SEQUENCING RULE

The interaction slide is always first.
It must allow direct manipulation, experimentation, and pattern detection before any formalization occurs. Interaction is exploration, not demonstration. The learner must do something meaningful.

---

## NOTATION STANDARD

| Item | Form |
|---|---|
| Derivative | f′(x) |
| Rate interpretation | dy/dx |
| Dot notation | ❌ Never |
| Integral | ∫ₐᵇ f(x) dx |
| Limit | limₓ→a f(x) |
| Function names | f, g, h (consistent) |

Never switch notation across lessons.

---

## VISUALIZATION CONSTRAINTS

- 2D only. No 3D.
- Maximum 2 functions visible simultaneously.
- Maximum 1 structural partition active at a time.
- Single primitive control per interaction. No mixing.
- Must fit a 16:9 canvas.
- No simultaneous control of multiple parameters.
- Type C: no more than one animated layer.
- If an interaction violates these, redesign it.

---

## INTERACTION ENGINE — 4 TYPES ONLY

These are immutable. No new types. No semantic mutation.

### Type A — Resolution
**Primitive:** resolution (integer slider, controls approximation density)
**Renders:** function curve + approximation structure converging as resolution increases. Live readout of approximate value, exact value, and error.
**Use when:** the lesson is about how a limit-based approximation converges.

**Two rendering modes** (selected via optional `mode` field):

**Mode `"secant"` (default — omit `mode` or set `"secant"`):**
Secant line converges to tangent as h → 0. Used for derivative-related convergence.
- systemSpec.derivative: the exact derivative f′(x) as JS expression
- systemSpec.anchor: the x-value where convergence is observed
- Readout: Δf/Δx, f′(x), error

**Mode `"riemann"` (set `mode: "riemann"`):**
Riemann sum rectangles converge to exact area as n increases. Used for integral-related convergence.
- systemSpec.integral: the exact integral value (number or JS expression evaluating to a number)
- systemSpec.sumType: `"left"` | `"right"` | `"midpoint"` (default `"left"`)
- systemSpec.domain: [a, b] used as the integration interval
- Renders: n colored rectangles (aligned left/right/midpoint) under the function curve, shaded semi-transparently
- Readout: Sₙ (current Riemann sum), exact ∫ₐᵇ f(x) dx, error |Sₙ − exact|
- Resolution slider controls n (number of rectangles)
- systemSpec.derivative and systemSpec.anchor are ignored in this mode

Config fields (prose reference):
- interactionType: "A"
- mode: "secant" (default) or "riemann" — selects rendering geometry
- parameterSpec.resolutionLevels: array of integers (e.g. [2, 4, 8, 16, 32, 64])
- systemSpec.function: JS expression using x (Math helpers: abs, pow, sin, cos, tan, sqrt, log, exp, PI, E)
- systemSpec.derivative: JS expression using x (secant mode only)
- systemSpec.integral: number or JS expression (riemann mode only)
- systemSpec.sumType: "left" | "right" | "midpoint" (riemann mode only, default "left")
- systemSpec.domain: [min, max]
- systemSpec.range: [min, max]
- systemSpec.anchor: number (secant mode only)
- reflectionSpec.triggers: array of {condition, message} — condition is JS evaluated with state.resolution in scope
- prompt: string
- sliderLabel: string

### Type B — Parameter Value
**Primitive:** continuous slider (min/max/initial float)
**Renders:** one or two function curves on a 2D canvas. The parameter p modifies curve shape. Reflection cards appear contextually.
**Use when:** the lesson is about how a curve's shape or value changes as a parameter varies.

**Optional area shading** (enabled via `shading` field in `system`):
When present, fills the region under a specified curve between two x-bounds. One bound can be dynamic (tied to the parameter p), enabling accumulation-style visualizations where the shaded area grows or shrinks as the learner drags the slider.
- system.shading.curveIndex: which curve to shade under (0-based index into curves array, default 0)
- system.shading.from: start x-value (number) — fixed left bound
- system.shading.to: end x-value — either a number (fixed) or the string `"p"` (uses current parameter value as the right bound)
- system.shading.color: fill color (default: curve color)
- system.shading.opacity: fill opacity (default 0.25)

This feature is only active when the `shading` object is present in `system`. When omitted, Type B behaves exactly as before (curves only, no fill).

Config fields (prose reference):
- interactionType: "B"
- meta.parameterLabel: string
- parameter: {min, max, initial}
- system.resolution: integer
- system.view: {xMin, xMax, yMin, yMax}
- system.model: JS expression using x and p (single curve mode)
- system.curves: array of {expr, color, label, style, width} (multi-curve mode, max 2)
- system.shading: {curveIndex, from, to, color, opacity} (optional — area fill under curve)
- reflections: array of {id, trigger, text} — trigger is JS evaluated with state.currentValue in scope
- prompt: string

### Type C — Time
**Primitive:** time (play/pause + scrubber, continuous animation)
**Renders:** a 2D trace evolving over time from an expression. The learner can play, pause, and scrub.
**Use when:** the lesson is about a dynamic process unfolding over time (motion, accumulation, etc.).

Config fields (prose reference):
- interactionType: "C"
- parameterSpec.time: {start, end, step}
- systemSpec.initialState: {x, y}
- systemSpec.evolutionRule: {type: "expression", expression: "[dx, dy]", variables: [...]}
- representationSpec.encoding: "positionTime" or "motion"
- representationSpec.viewBox: {xMin, xMax, yMin, yMax}
- reflectionSpec.triggers: array of {type: "timeReached", value, message}
- prompt: string

### Type E — Structure
**Primitive:** structure (0–1 float, controls a geometric partition)
**Renders:** an SVG view of a geometric region split into parts. Metric cards update live.
**Use when:** the lesson is about how a structural boundary affects area/measure distribution while a total is conserved.

Config fields (prose reference):
- interactionType: "E"
- parameterSpec.structure: {min, max, step, initial, label}
- systemSpec.baseValues: object
- systemSpec.conservedObject: {type: "expression", expression, variables}
- representationSpec.mode: "geometricSplit"
- representationSpec.geometryBase: {type, function, domain} — type options: "areaUnderCurve", "regionBetweenCurves", "rectangle"
- representationSpec.splitSpec: {type} — options: "domainSplit", "signPartition", "rectangleContribution"
- representationSpec.viewBox: {xMin, xMax, yMin, yMax}
- reflectionSpec.triggers: array of {type, value, tolerance?, message} — types: "structureNear", "structureAbove", "structureBelow" — compared against state.structure

---

## INTERACTION DESIGN GUIDANCE FOR LESSONS 1–4

This section maps each lesson to its recommended interaction type, mode, and key visual features. Use this as the primary design constraint when writing the Interaction Slide section of each blueprint.

**Lesson 1 — Area Measurement Problem**
Recommended type: **E** (Structure) with `splitSpec.type: "domainSplit"`
Rationale: The learner drags a partition boundary across a curved region to discover that the area under a curve is not trivially computable from simple shapes. The structure slider moves a split point; metric cards show the two sub-areas and their sum. The conserved total is the exact area (which the learner doesn’t know yet — tension). Use `geometryBase.type: "areaUnderCurve"`.
Mode/features used: standard Type E, no new features needed.

**Lesson 2 — Riemann Sums**
Recommended type: **A** (Resolution) with `mode: "riemann"`
Rationale: The learner controls n (number of rectangles) via the resolution slider. Rectangles appear under/over the curve. The readout shows Sₙ, and the learner sees how the rectangular approximation behaves at low vs. high n. This is the defining use case for riemann mode.
Key config choices: set `sumType` to `"left"` as the introductory default. Choose a simple function like f(x) = x² on [0, 2] so rectangle behavior is obvious. Set `integral` to the exact value (8/3). Resolution levels should start very low: [2, 4, 6, 8, 12, 16, 24, 32].

**Lesson 3 — Partition Refinement**
Recommended type: **A** (Resolution) with `mode: "riemann"`
Rationale: Same primitive as L2, but the focus shifts to *convergence*. Higher resolution levels: [4, 8, 16, 32, 64, 128]. The reflection triggers should fire at high n to highlight that error vanishes. Consider using a different function (e.g. f(x) = sin(x) on [0, π]) or a different sumType ("midpoint") to show that all sum types converge to the same limit. The readout’s error field is the key cognitive tool here.

**Lesson 4 — Definite Integral**
Recommended type: **A** (Resolution) with `mode: "riemann"`
Rationale: The definite integral is defined as the limit of Riemann sums. The resolution slider now goes very high: [4, 8, 16, 32, 64, 128, 256]. At maximum resolution, the rectangles visually merge into the filled area. The readout shows error approaching 0. The prompt should frame: “What is this quantity approaching?” This is where ∫ₐᵇ f(x) dx notation is introduced in the concept slide.

---

## DEPENDENCY MAP

| Module | Depends on |
|---|---|
| M2 | M1-L7 (interval shrinkage), M1-L8 (Δy/Δx) |
| M3 | M2 limit definition, limit laws, continuity |
| M4 | M3 derivative function, chain rule; M2 limit convergence |

**Vocabulary rule:** You may only use concepts, notation, and theorems introduced in earlier lessons. If a lesson would require something not yet available, redesign it.

---

## COURSE MACRO-STRUCTURE (full context)

**Module 1 — Motion, Speed, Velocity, Change**
Position Over Time · Constant vs. Changing Speed · Distance vs. Displacement · Average Speed Over an Interval · Signed Velocity · Average Velocity as Slope · Shrinking the Interval · Rates of Change Beyond Motion

**Module 2 — Limits**
Numerical Limit Exploration · One-Sided Limits · When Limits Fail · Limits Graphically · Algebraic Simplification · Limit Laws · Squeeze Theorem · Continuity · Limits at Infinity · ε–δ Definition

**Module 3 — Derivatives**
Instantaneous Velocity via Limit · Tangent Line Interpretation · Derivative Function f′ · Non-Differentiability · Power Rule · Product Rule · Quotient Rule · Chain Rule · Trigonometric Derivatives · Increasing/Decreasing · Concavity & Second Derivative · Curve Sketching Synthesis

**Module 4 — Integrals** ← CURRENT
1. Area Measurement Problem ← GENERATE
2. Riemann Sums ← GENERATE
3. Partition Refinement ← GENERATE
4. Definite Integral ← GENERATE
5. Integral Properties
6. Accumulation Function
7. FTC Part I
8. FTC Part II
9. Antiderivatives
10. Substitution Rule
11. Net Change
12. Applications of Accumulation

---

## AVAILABLE PREREQUISITES FOR LESSONS 1–4

All of M1, M2, M3 are completed. Specifically available:
- Limit definition, one-sided limits, limit laws, squeeze theorem, continuity, ε–δ
- Derivative as limit of difference quotient, f′(x), tangent line, power/product/quotient/chain rules
- Trigonometric derivatives, increasing/decreasing tests, concavity, curve sketching
- Notation: f′(x), dy/dx, limₓ→a f(x), ∫ₐᵇ f(x) dx (introduced fresh in M4)

Interaction rendering capabilities available for these lessons:
- Type A riemann mode: rectangles under the curve, Sₙ readout, error display (ideal for L2, L3, L4)
- Type E domainSplit: split a shaded region with a draggable boundary (ideal for L1)
- Type B shading: fill area under a curve up to a dynamic bound (not needed yet — available from L6 onward)

Within M4, each lesson may use concepts from M4 lessons that precede it:
- L2 may assume L1
- L3 may assume L1–L2
- L4 may assume L1–L3

---

## OUTPUT FORMAT — PER LESSON

```
LESSON [N]: [TITLE]

1. Position in Curriculum
   Module, Lesson number
   Prerequisite concepts, notation, theorems, and functions assumed

2. Core Mathematical Focus
   Exact concept · Exact functions used · Domain · Structural goal

3. Learner Realization Statement
   "The learner must realize that ______."
   (Must describe a conceptual shift, not a procedure.)

4. Interaction Slide
   Interaction Type (A / B / C / E)
   Primitive and what the learner controls
   What remains fixed
   Geometry / visual elements rendered
   Cognitive tension created
   Misconception challenged
   Why this type is minimal and sufficient
   Interaction config description (prose only — list each relevant field
   and its value or design rationale; no JSON)

5. Concept Slides (1–2)
   For each: purpose, bridge from exploration, exact mathematical
   statement introduced.

6. Assignment Slides (8–9 minimum)
   All multiple-choice (A, B, C, D). Must include:
   - At least one exploration-based question (what did you observe?)
   - At least one computation
   - At least one conceptual explanation question
   - At least one parameter variation question
   - At least one transfer question (different context, same principle)
   Do not insert concept slides between assignment slides.

7. Architectural Integrity Check
   Why this interaction type is correct
   Why each other type would violate primitive ownership
   Why visualization constraints are satisfied
```

---

## STRICT PROHIBITIONS

- Do not output JSON of any kind. Blueprints are prose documents only.
- Do not invent interaction types or mix primitives.
- Do not introduce notation or concepts beyond current prerequisites.
- Do not skip the Learner Realization Statement.
- Do not create visually overloaded interactions.
- Do not insert concept slides between assignment slides.
- Do not produce shallow or procedural realization statements.
- Do not generate Lessons 5–12. Stop after Lesson 4.

---

## END-OF-PART DELIVERABLE

After generating all 4 lesson blueprints, provide a **Handoff Summary** listing for each lesson:
- Title
- Interaction type used
- Key concept introduced
- Notation newly available for subsequent lessons

This summary will be pasted into Part 2's prompt as prerequisite context.
