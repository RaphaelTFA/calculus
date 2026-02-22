export default function TypeAResolution() {
  const [resolution, setResolution] = React.useState(2);

  const canvasRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const knobRef = React.useRef(null);
  const isDragging = React.useRef(false);

  // =========================================================
  // CONSTANTS & SPECS
  // =========================================================
  const LESSON = React.useMemo(() => ({
    interactionType: "A",
    parameterSpec: {
      resolutionLevels: [
        2, 4, 6, 8, 10, 12, 14, 16,
        18, 20, 22, 24, 26, 28, 30, 32,
        34, 36, 38, 40, 42, 44, 46, 48,
        50, 52, 54, 56, 58, 60, 62, 64
      ]
    },
    systemSpec: {
      function: "x*x",
      derivative: "2*x",
      domain: [-3, 3],
      range: [-1, 8],
      anchor: 1
    },
    reflectionSpec: {
      triggers: [
        {
          condition: (state) => state.resolution >= 64,
          message: "The approximation error is now negligible. Convergence achieved."
        }
      ]
    }
  }), []);

  // =========================================================
  // MEMOIZED MATH FUNCTIONS (Performance Rule)
  // =========================================================
  const { f, df } = React.useMemo(() => ({
    f: new Function("x", `return ${LESSON.systemSpec.function}`),
    df: new Function("x", `return ${LESSON.systemSpec.derivative}`)
  }), [LESSON]);

  // Interaction object enriched with cached functions
  const interaction = React.useMemo(() => ({
    ...LESSON,
    systemSpec: { ...LESSON.systemSpec, _f: f, _df: df }
  }), [LESSON, f, df]);

  // =========================================================
  // PURE LOGIC FUNCTIONS
  // =========================================================
  function recompute(interaction, state) {
    const {
      function: fnExpr,
      derivative: dfExpr,
      domain,
      anchor
    } = interaction.systemSpec;

    const resolution = state.resolution;

    // Use cached functions or create new ones (fallback for strict purity if needed)
    const f = interaction.systemSpec._f || new Function("x", `return ${fnExpr}`);
    const df = interaction.systemSpec._df || new Function("x", `return ${dfExpr}`);

    const graph = [];
    const dxGraph = (domain[1] - domain[0]) / 300;

    for (let x = domain[0]; x <= domain[1]; x += dxGraph) {
      graph.push({ x, y: f(x) });
    }

    const h = (domain[1] - domain[0]) / resolution;
    const y0 = f(anchor);

    const approxSlope = (f(anchor + h) - f(anchor - h)) / (2 * h);
    const trueSlope = df(anchor);
    const error = Math.abs(approxSlope - trueSlope);

    return {
      newState: { resolution },
      systemState: {
        graph,
        anchor,
        y0,
        approxSlope,
        trueSlope,
        error,
        secant: {
          p1: { x: anchor - h, y: f(anchor - h) },
          p2: { x: anchor + h, y: f(anchor + h) }
        }
      }
    };
  }

  function render(systemState, interaction, ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { domain, range } = interaction.systemSpec;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const mapX = x => (x - domain[0]) / (domain[1] - domain[0]) * w;
    const mapY = y => h - (y - range[0]) / (range[1] - range[0]) * h;

    // Graph
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.beginPath();
    systemState.graph.forEach((pt, i) => {
      const px = mapX(pt.x);
      const py = mapY(pt.y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Secant
    ctx.strokeStyle = "rgba(52,152,219,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mapX(systemState.secant.p1.x), mapY(systemState.secant.p1.y));
    ctx.lineTo(mapX(systemState.secant.p2.x), mapY(systemState.secant.p2.y));
    ctx.stroke();

    // Tangent
    ctx.strokeStyle = "#e74c3c";
    ctx.beginPath();
    const x1 = systemState.anchor - 2;
    const x2 = systemState.anchor + 2;
    ctx.moveTo(
      mapX(x1),
      mapY(systemState.y0 + systemState.trueSlope * (x1 - systemState.anchor))
    );
    ctx.lineTo(
      mapX(x2),
      mapY(systemState.y0 + systemState.trueSlope * (x2 - systemState.anchor))
    );
    ctx.stroke();

    // Anchor
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.arc(
      mapX(systemState.anchor),
      mapY(systemState.y0),
      5, 0, Math.PI * 2
    );
    ctx.fill();
  }

  function evaluateReflection(interaction, state) {
    if (!interaction.reflectionSpec) return "";
    for (const t of interaction.reflectionSpec.triggers) {
      if (t.condition(state)) return t.message;
    }
    return "";
  }

  // =========================================================
  // STATE COMPUTATION
  // =========================================================
  const state = { resolution };
  const levels = LESSON.parameterSpec.resolutionLevels;
  const levelIndex = levels.indexOf(resolution);
  
  const computationResult = React.useMemo(() => {
    return recompute(interaction, state);
  }, [resolution, interaction]);

  // =========================================================
  // EFFECTS (CANVAS & DRAG)
  // =========================================================
  
  // Canvas Rendering
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    
    const doRender = () => {
      render(computationResult.systemState, interaction, ctx, canvas);
    };

    const handleResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      doRender();
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial setup

    return () => window.removeEventListener("resize", handleResize);
  }, [computationResult, interaction]);

  // Drag Control Logic
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;

      const track = trackRef.current;
      const knob = knobRef.current;
      if (!track || !knob) return;

      const rect = track.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      
      // Preserve exact clamping logic
      const clamped = Math.max(
        knob.clientWidth / 2,
        Math.min(rect.width - knob.clientWidth / 2, relativeX)
      );

      // Preserve exact ratio logic
      const ratio = (clamped - knob.clientWidth / 2) /
                    (rect.width - knob.clientWidth);

      const newIndex = Math.round(ratio * (levels.length - 1));

      if (levels[newIndex] !== resolution) {
        setResolution(levels[newIndex]);
      }
    };

    const handleMouseUp = () => {
      if(isDragging.current) {
        isDragging.current = false;
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resolution, levels]);

  const onKnobMouseDown = () => {
    isDragging.current = true;
    document.body.style.userSelect = "none";
  };

  // Knob Position Calculation
  // We use the same ratio logic for display
  const trackWidth = 240; // Fixed from CSS
  const knobWidth = 20;   // Fixed from CSS
  const maxX = trackWidth - knobWidth;
  const ratio = levelIndex / (levels.length - 1);
  const knobLeft = maxX * ratio;

  return (
    <>
      <style>{`
        :root{
          --bg:#ffffff;
          --graph:#666;
          --secant:rgba(52,152,219,0.8);
          --tangent:#e74c3c;
          --anchor:#2ecc71;
          --text:#111827;
          --panel:#f8fafc;
          --border:#e5e7eb;
        }

        *{box-sizing:border-box;margin:0;padding:0;}

        body,html{
          height:100%;
          width:100%;
          overflow:hidden;
          font-family:system-ui;
          background:var(--bg);
        }

        #resolution-control{
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        #resolution-track{
          position:relative;
          width:240px;
          height:8px;
          background:#e5e7eb;
          border-radius:4px;
        }

        #resolution-knob{
          position:absolute;
          top:-6px;
          width:20px;
          height:20px;
          background:#3498db;
          border-radius:50%;
          cursor:grab;
          transition:left 0.15s ease;
        }

        #resolution-knob:active{
          cursor:grabbing;
        }

        /* Reserved zones */
        #top-reserve{
          position:absolute;
          top:0;
          left:0;
          right:0;
          height:60px;
        }

        #bottom-reserve{
          position:absolute;
          bottom:0;
          left:0;
          right:0;
          height:80px;
        }

        /* Interaction zone */
        #stage{
          position:absolute;
          top:60px;
          bottom:80px;
          left:0;
          right:0;

          display:flex;
          align-items:center;
          justify-content:center;
        }

        #layout{
          width:100%;
          max-width:1100px;
          height:100%;
          display:flex;
          gap:40px;
          padding:20px;
        }

        #canvas-wrap{
          flex:0 0 650px;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        canvas{
          width:100%;
          height:100%;
          display:block;
        }

        #side-panel{
          flex:1;
          max-width:320px;
          display:flex;
          flex-direction:column;
          gap:20px;
          justify-content:center;
        }

        #reflection{
          min-height:60px;
          font-size:15px;
          color:var(--text);
          line-height:1.5;
        }

        #metrics{
          background:var(--panel);
          border:1px solid var(--border);
          padding:16px;
          border-radius:8px;
          font-size:14px;
          line-height:1.6;
        }
      `}</style>

      <div id="top-reserve"></div>

      <div id="stage">
        <div id="layout">

          <div id="canvas-wrap">
            <canvas ref={canvasRef} id="canvas"></canvas>
          </div>

          <div id="side-panel">
            <div id="reflection">
              {evaluateReflection(interaction, state)}
            </div>
            <div id="metrics">
              <strong>Resolution:</strong> {state.resolution}<br/>
              <strong>True slope:</strong> {computationResult.systemState.trueSlope.toFixed(4)}<br/>
              <strong>Approx slope:</strong> {computationResult.systemState.approxSlope.toFixed(4)}<br/>
              <strong>Error:</strong> {computationResult.systemState.error.toExponential(2)}
            </div>
            <div id="resolution-control">
              <div id="resolution-label">Resolution</div>
              <div id="resolution-track" ref={trackRef}>
                  <div 
                    id="resolution-knob" 
                    ref={knobRef}
                    onMouseDown={onKnobMouseDown}
                    style={{ left: `${knobLeft}px` }}
                  ></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div id="bottom-reserve"></div>
    </>
  );
}