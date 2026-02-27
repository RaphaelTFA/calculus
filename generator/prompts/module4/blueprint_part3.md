# MODULE 4 — TÍCH PHÂN — BLUEPRINT GENERATION (PART 3 of 3)
# Lessons 9–12: Antiderivatives · Substitution Rule · Net Change · Applications of Accumulation

---

## ROLE & TASK

You are a curriculum architect for an interaction-first Calculus learning engine. Generate complete lesson blueprints for **Lessons 9–12** of Module 4 (Tích phân).

You are generating nodes inside a dependency graph, not isolated lessons. Every decision must respect conceptual sequencing, notation consistency, and interaction constraints.

---

## TARGET SCOPE

Module: 4 — Tích phân
Lessons to generate in this run: **9 through 12 only**
Lesson titles, in order:
9. Antiderivatives
10. Substitution Rule
11. Net Change
12. Applications of Accumulation

Parts 1 (Lessons 1–4) and 2 (Lessons 5–8) were generated in previous runs.

---

## PART 1 HANDOFF — LESSONS 1–4 ALREADY GENERATED

Paste the Handoff Summary from Part 1 below before running this prompt.

> **[INSERT PART 1 HANDOFF SUMMARY HERE]**
>
> Expected format per lesson:
> - Title
> - Interaction type used
> - Key concept introduced
> - Notation newly available for subsequent lessons

---

## PART 2 HANDOFF — LESSONS 5–8 ALREADY GENERATED

Paste the Handoff Summary from Part 2 below before running this prompt.

> **[INSERT PART 2 HANDOFF SUMMARY HERE]**
>
> Expected format per lesson:
> - Title
> - Interaction type used
> - Key concept introduced
> - Notation newly available for subsequent lessons

**You must treat everything in both handoffs as established fact.** Do not redefine, contradict, or re-derive any concept from Lessons 1–8.

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

## INTERACTION DESIGN GUIDANCE FOR LESSONS 9–12

This section maps each lesson to its recommended interaction type, mode, and key visual features. Use this as the primary design constraint when writing the Interaction Slide section of each blueprint.

**Lesson 9 — Antiderivatives**
Recommended type: **B** (Parameter) — curves only, no shading needed
Rationale: The learner drags p (representing the constant C) and sees the antiderivative F(x) + C shift vertically. Two curves: f(x) fixed (the integrand), and F(x) + p (the antiderivative family). As p changes, the learner discovers that all vertical shifts of F share the same derivative. Reflections highlight that F′(x) = f(x) regardless of C.
Key config choices: multi-curve mode. Curve 1: f(x) fixed. Curve 2: F(x) + p, depends on parameter. No shading needed here — the focus is on the family of curves, not area.

**Lesson 10 — Substitution Rule**
Recommended type: **B** (Parameter) with `shading` enabled
Rationale: The learner sees two views of the “same” integral — before and after substitution. The parameter p controls a inner-function scaling factor. Two curves: the original composite function f(g(x))·g′(x), and the simplified f(u) after substitution. Shading shows the area is preserved under the change of variable. Reflections note that the shaded area remains constant as p varies, demonstrating that substitution is an equality, not an approximation.
Key config choices: `shading.to: "p"` or fixed shading over the domain. The critical insight is area preservation. Choose a concrete example like ∫ 2x·cos(x²) dx = ∫ cos(u) du.

**Lesson 11 — Net Change**
Recommended type: **E** (Structure) with `splitSpec.type: "signPartition"`
Rationale: The learner drags the structure slider to highlight successive sign-alternating regions under a rate function f(x) that crosses the x-axis. Metric cards show positive area, negative area, and the net (signed) total. The conserved object is the net integral. `geometryBase.type: "regionBetweenCurves"` with f and g(x) = 0.
Key config choices: use a function like f(x) = sin(x) on [0, 2π] or a polynomial that crosses zero. The sign partition automatically detects roots and colors regions by sign. Reflections should trigger when the learner highlights a negative region.

**Lesson 12 — Applications of Accumulation**
Recommended type: **C** (Time)
Rationale: This is the capstone. The learner watches a quantity accumulate over time: e.g., water filling a tank at a time-varying rate, or total distance traveled by a moving object. The time scrubber lets them play/pause/rewind. The y-trace shows accumulated quantity. Reflections trigger at moments where the rate changes (e.g., rate goes negative — the accumulated quantity decreases). This synthesizes everything: the integral as accumulation, FTC, net change.
Key config choices: `encoding: "positionTime"`. The evolution expression integrates a rate function over time. Reflections at key time points highlight net change concepts.

---

## DEPENDENCY MAP

| Module | Depends on |
|---|---|
| M2 | M1-L7 (interval shrinkage), M1-L8 (Δy/Δx) |
| M3 | M2 limit definition, limit laws, continuity |
| M4 | M3 derivative function, chain rule; M2 limit convergence |

**Vocabulary rule:** You may only use concepts, notation, and theorems introduced in earlier lessons (M1–M3 fully, plus M4 L1–L8 from Parts 1–2). If a lesson would require something not yet available, redesign it.

---

## COURSE MACRO-STRUCTURE (full context)

**Module 1 — Motion, Speed, Velocity, Change**
Position Over Time · Constant vs. Changing Speed · Distance vs. Displacement · Average Speed Over an Interval · Signed Velocity · Average Velocity as Slope · Shrinking the Interval · Rates of Change Beyond Motion

**Module 2 — Limits**
Numerical Limit Exploration · One-Sided Limits · When Limits Fail · Limits Graphically · Algebraic Simplification · Limit Laws · Squeeze Theorem · Continuity · Limits at Infinity · ε–δ Definition

**Module 3 — Derivatives**
Instantaneous Velocity via Limit · Tangent Line Interpretation · Derivative Function f′ · Non-Differentiability · Power Rule · Product Rule · Quotient Rule · Chain Rule · Trigonometric Derivatives · Increasing/Decreasing · Concavity & Second Derivative · Curve Sketching Synthesis

**Module 4 — Integrals** ← CURRENT
1. Area Measurement Problem ✅ (Part 1)
2. Riemann Sums ✅ (Part 1)
3. Partition Refinement ✅ (Part 1)
4. Definite Integral ✅ (Part 1)
5. Integral Properties ✅ (Part 2)
6. Accumulation Function ✅ (Part 2)
7. FTC Part I ✅ (Part 2)
8. FTC Part II ✅ (Part 2)
9. Antiderivatives ← GENERATE
10. Substitution Rule ← GENERATE
11. Net Change ← GENERATE
12. Applications of Accumulation ← GENERATE

---

## AVAILABLE PREREQUISITES FOR LESSONS 9–12

All of M1, M2, M3 are completed. From M4 Parts 1–2:
- L1: Area measurement problem — bounding curved regions with known shapes
- L2: Riemann sums — approximating area via rectangular partitions
- L3: Partition refinement — increasing n yields convergence
- L4: Definite integral — ∫ₐᵇ f(x) dx as limit of Riemann sums; integral notation
- L5: Integral properties — linearity, additivity over intervals, order properties, constant bounds
- L6: Accumulation function — F(x) = ∫ₐˣ f(t) dt as a function of its upper limit
- L7: FTC Part I — F′(x) = f(x); differentiation undoes integration
- L8: FTC Part II — ∫ₐᵇ f(x) dx = F(b) − F(a); evaluation theorem

Interaction rendering capabilities especially relevant for this part:
- Type B multi-curve + shading: for L9 (antiderivative family: f fixed, F+C shifts with p) and L10 (substitution: area preserved under variable change).
- Type E signPartition: for L11 (net change: highlight positive vs. negative area regions under a rate function that crosses zero).
- Type C time animation: for L12 (capstone: accumulated quantity evolves in real time).

Within this part, each lesson may use concepts from lessons that precede it:
- L10 may assume L9
- L11 may assume L9–L10
- L12 may assume L9–L11

---

## SPECIAL SEQUENCING NOTE FOR PART 3

Lesson 9 (Antiderivatives) comes *after* the FTC has been established. This is deliberate. The learner has already seen that ∫ₐᵇ f(x) dx = F(b) − F(a) and that F′(x) = f(x). Lesson 9 now formalizes the reverse question: given f, find all F. The +C family emerges from the FTC context, not from unmotivated guessing.

Lesson 10 (Substitution) requires the chain rule from M3-L8. It is the integral counterpart of the chain rule — this must be made explicit.

Lesson 12 is the capstone. It must synthesize accumulation, FTC, and net change into applied contexts. No new theoretical machinery — only transfer.

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
- Do not regenerate Lessons 1–8. Only produce Lessons 9–12.

---

## END-OF-MODULE DELIVERABLE

After generating all 4 lesson blueprints, provide a **Module 4 Complete Summary** listing for all 12 lessons (referencing Parts 1–2 handoffs for L1–L8):
- Lesson number and title
- Interaction type
- Key concept
- Dependency chain (which prior M4 lessons it directly requires)

This serves as the final dependency audit for Module 4.
