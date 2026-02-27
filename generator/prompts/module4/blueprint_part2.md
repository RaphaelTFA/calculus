# MODULE 4 — TÍCH PHÂN — BLUEPRINT GENERATION (PART 2 of 3)
# Lessons 5–8: Integral Properties · Accumulation Function · FTC Part I · FTC Part II

---

## ROLE & TASK

You are a curriculum architect for an interaction-first Calculus learning engine. Generate complete lesson blueprints for **Lessons 5–8** of Module 4 (Tích phân).

You are generating nodes inside a dependency graph, not isolated lessons. Every decision must respect conceptual sequencing, notation consistency, and interaction constraints.

---

## TARGET SCOPE

Module: 4 — Tích phân
Lessons to generate in this run: **5 through 8 only**
Lesson titles, in order:
5. Integral Properties
6. Accumulation Function
7. FTC Part I
8. FTC Part II

Parts 1 (Lessons 1–4) and 3 (Lessons 9–12) are handled in separate runs.

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

**You must treat everything in the handoff as established fact.** Do not redefine, contradict, or re-derive any concept from Lessons 1–4.

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

## INTERACTION DESIGN GUIDANCE FOR LESSONS 5–8

This section maps each lesson to its recommended interaction type, mode, and key visual features. Use this as the primary design constraint when writing the Interaction Slide section of each blueprint.

**Lesson 5 — Integral Properties**
Recommended type: **E** (Structure) with `splitSpec.type: "domainSplit"`
Rationale: The learner drags a split point c across the interval [a, b] and sees that ∫ₐᵇ = ∫ₐᶜ + ∫ᶜᵇ regardless of where c is placed. Metric cards show the three quantities. The conserved object is the total integral. This directly visualizes interval additivity.
Mode/features used: standard Type E domainSplit. No new features needed.

**Lesson 6 — Accumulation Function**
Recommended type: **B** (Parameter) with `shading` enabled
Rationale: The learner drags parameter p (representing the variable upper limit x) and sees the shaded area under f(t) from a fixed left bound a to x = p grow and shrink. Simultaneously, a second curve plots F(x) = ∫ₐˣ f(t) dt as a function of x. The two curves: (1) f(x) fixed, (2) F(x) whose value at p corresponds to the shaded area.
Key config choices: use multi-curve mode with two curves. Set `shading.curveIndex: 0` (shade under f), `shading.from: 0` (or whatever a is), `shading.to: "p"`. The parameter p slides along the x-axis. Reflections should trigger when the learner moves p past a zero of f to see accumulation decrease.

**Lesson 7 — FTC Part I**
Recommended type: **B** (Parameter) with `shading` enabled
Rationale: The learner drags p and sees: (1) f(x) drawn as a curve, (2) the shaded area from a to p under f, and the key insight emerges: the *rate of change* of the area equals f(p). The reflection cards should highlight that when f(p) > 0, the area is increasing; when f(p) < 0, the area is decreasing. The second curve can show F(x), and the reflection text can note the slope of F at x = p equals f(p).
Key config choices: similar to L6 but reflections are re-designed to focus on the derivative relationship F′(x) = f(x). Use `shading.to: "p"`. Reflections should trigger at specific p values where f changes sign.

**Lesson 8 — FTC Part II**
Recommended type: **B** (Parameter) with `shading` enabled
Rationale: The learner slides the upper bound p = b and observes that the shaded area (the definite integral) equals F(b) − F(a) where F is a known antiderivative. Two curves: f(x) and F(x). The shaded region’s area is compared numerically to F(p) − F(a) in a readout.
Key config choices: use `shading.to: "p"`, with reflections that highlight the F(b)−F(a) evaluation once the learner reaches specific b values. This closes the loop: the area no longer requires a limit of Riemann sums — it can be evaluated via antiderivatives.

---

## DEPENDENCY MAP

| Module | Depends on |
|---|---|
| M2 | M1-L7 (interval shrinkage), M1-L8 (Δy/Δx) |
| M3 | M2 limit definition, limit laws, continuity |
| M4 | M3 derivative function, chain rule; M2 limit convergence |

**Vocabulary rule:** You may only use concepts, notation, and theorems introduced in earlier lessons (M1–M3 fully, plus M4 L1–L4 from Part 1). If a lesson would require something not yet available, redesign it.

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
5. Integral Properties ← GENERATE
6. Accumulation Function ← GENERATE
7. FTC Part I ← GENERATE
8. FTC Part II ← GENERATE
9. Antiderivatives
10. Substitution Rule
11. Net Change
12. Applications of Accumulation

---

## AVAILABLE PREREQUISITES FOR LESSONS 5–8

All of M1, M2, M3 are completed. Additionally, from M4 Part 1:
- L1: The area measurement problem — bounding curved regions with known shapes
- L2: Riemann sums — approximating area via rectangular partitions, left/right/midpoint sums
- L3: Partition refinement — increasing n yields convergence; the limit of Riemann sums
- L4: Definite integral — ∫ₐᵇ f(x) dx as the limit of Riemann sums; integral notation

Interaction rendering capabilities especially relevant for this part:
- Type B shading (to="p"): fills area under a curve from a fixed start to x = p. Critical for L6, L7, L8 — the accumulation function, FTC I, and FTC II all require the learner to see a shaded area that grows/shrinks as the upper bound moves.
- Type E domainSplit: split the interval to show ∫ₐᵇ = ∫ₐᶜ + ∫ᶜᵇ (ideal for L5).
- Type A riemann mode: not expected in this part, but available if needed.

Within this part, each lesson may use concepts from lessons that precede it:
- L6 may assume L5
- L7 may assume L5–L6
- L8 may assume L5–L7

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
- Do not regenerate Lessons 1–4. Do not generate Lessons 9–12. Only produce Lessons 5–8.

---

## END-OF-PART DELIVERABLE

After generating all 4 lesson blueprints, provide a **Handoff Summary** listing for each lesson (5–8):
- Title
- Interaction type used
- Key concept introduced
- Notation newly available for subsequent lessons

This summary will be pasted into Part 3's prompt as prerequisite context.
