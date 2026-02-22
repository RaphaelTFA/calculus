import React, { useState, useRef, useEffect } from 'react';

/* =========================================================
   TYPE C LESSON (MATCHES SUPER-SCHEMA)
========================================================= */

const LESSON = {
  interactionType: "C",
  parameterSpec: {
    time: { start: 0, end: 2 * Math.PI, step: 0.02 }
  },
  systemSpec: {
    initialState: { x: 0, y: -1},
    evolutionRule: {
      type: "expression",
      expression: "[cos(t), sin(t)]",
      variables: ["t"]
    }
  },
  representationSpec: {
    encoding: "motion",
    viewBox: {
      xMin: -1.2,
      xMax: 1.2,
      yMin: -1.2,
      yMax: 1.2
    }
  },
  reflectionSpec: {
    triggers: [
      {
        type: "timeReached",
        value: 2 * Math.PI - 0.02,
        message: "The motion has completed one full cycle."
      },
      {
        type: "timeReached",
        value: 3.14159,
        message: "Half a cycle: velocity reverses direction."
      }
    ]
  }
};

/* =========================================================
   EXPRESSION DSL
========================================================= */

function createEvaluator(model) {
  const allowed = {
    sin: Math.sin,
    cos: Math.cos,
    abs: Math.abs,
    sqrt: Math.sqrt,
    log: Math.log,
    exp: Math.exp,
    pow: Math.pow,
    sign: Math.sign
  };

  const expr = model.expression.replace(/\^/g, "**");

  return function (scope) {
    const fn = new Function(
      ...Object.keys(allowed),
      ...Object.keys(scope),
      `"use strict"; return (${expr});`
    );

    return fn(
      ...Object.values(allowed),
      ...Object.values(scope)
    );
  };
}

function evaluateReflections(interaction, state) {

  if(!interaction.reflectionSpec) return null;

  for(const trigger of interaction.reflectionSpec.triggers){

    if(trigger.type === "timeReached"){
      if(state.t >= trigger.value){
        return trigger.message;
      }
    }

  }

  return null;
}

/* =========================================================
   VALIDATION
========================================================= */

function validateTypeC(interaction) {
  if (interaction.interactionType !== "C") {
    throw new Error("Not Type C interaction");
  }

  const { start, end, step } = interaction.parameterSpec.time;

  if (start >= end) {
    throw new Error("Time start must be < end");
  }

  if (step <= 0) {
    throw new Error("Time step must be > 0");
  }
}

/* =========================================================
   PURE RECOMPUTE (ACCUMULATION SEMANTICS)
========================================================= */

function recompute(interaction, state){

  const evaluator = createEvaluator(interaction.systemSpec.evolutionRule);
  const { start, step } = interaction.parameterSpec.time;

  let position = {
    x: interaction.systemSpec.initialState.x,
    y: interaction.systemSpec.initialState.y
  };
  let trace = [];

  for(let tau = start; tau <= state.t; tau += step){

    const [vx, vy] = evaluator({
      t: tau,
      x: position.x,
      y: position.y
    });

    position.x += vx * step;
    position.y += vy * step;

    trace.push({ x: position.x, y: position.y });
  }

  return {
    newState: {
      t: state.t,
      position,
      trace
    },
    systemState: {
      geometry: [
        { type:"axes" },
        { type:"trace", data:trace },
        { type:"point", x:position.x, y:position.y }
      ]
    }
  };
}

/* =========================================================
   RENDER
========================================================= */

function render(systemState, representationSpec, ctx, canvas, state) {

  // 🔵 Paint solid background
  ctx.fillStyle = "#ffffff";  // or your desired bg
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const vb = representationSpec.viewBox;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  const mapX = x =>
    (x - vb.xMin) / (vb.xMax - vb.xMin) * width;

  const mapY = y =>
    height -
    (y - vb.yMin) / (vb.yMax - vb.yMin) * height;

  
  // Note: Passed state explicitly to resolve scope in module
  const message = evaluateReflections(LESSON, state);

  if(message){
    ctx.fillStyle = "#111";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
  }
  systemState.geometry.forEach(obj => {

    if (obj.type === "axes") {
      ctx.strokeStyle = "#e5e7eb";
      ctx.beginPath();
      ctx.moveTo(0, mapY(0));
      ctx.lineTo(width, mapY(0));
      ctx.stroke();
    }

    if (obj.type === "trace") {
      ctx.strokeStyle = "rgba(37,99,235,0.25)";
      ctx.beginPath();
      obj.data.forEach((pt, i) => {
        const px = mapX(pt.x);
        const py = mapY(pt.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    if (obj.type === "point") {
      ctx.fillStyle = "#2563eb";
      const px = mapX(obj.x);
      const py = mapY(obj.y);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }

  });
}

export default function TypeCTemporalPlayback() {
  const canvasRef = useRef(null);
  const reflectionRef = useRef(null);
  const requestRef = useRef(null);
  
  const [t, setT] = useState(LESSON.parameterSpec.time.start);

  const styles = {
    container: {
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      fontFamily: 'system-ui',
      background: 'var(--bg, #ffffff)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    },
    top: {
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    stage: {
      position: 'absolute',
      top: '60px',
      bottom: '80px',
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    interactionLayout: {
      width: '100%',
      maxWidth: '1100px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '40px'
    },
    canvasWrap: {
      flex: '0 0 600px',
      height: '80%'
    },
    canvas: {
      width: '100%',
      height: '100%',
      display: 'block'
    },
    reflection: {
      flex: 1,
      maxWidth: '320px',
      fontSize: '16px',
      lineHeight: '1.5',
      color: '#111827',
      display: 'flex',
      alignItems: 'center'
    },
    bottom: {
      height: '80px',
      borderTop: '1px solid #e5e7eb',
      marginTop: 'auto',
      flexShrink: 0
    }
  };

  useEffect(() => {
    validateTypeC(LESSON);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reflectionEl = reflectionRef.current;
    const timeSpec = LESSON.parameterSpec.time;
    
    // Engine state simulation (Type C owns only t)
    // Using a local variable for the animation loop to ensure frame integrity
    // independent of React's render cycle, while syncing to React state as required.
    let currentState = {
      t: timeSpec.start
    };

    function resize() {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      // Immediate re-render on resize to avoid flicker
      const result = recompute(LESSON, currentState);
      render(result.systemState, LESSON.representationSpec, ctx, canvas, currentState);
    }

    window.addEventListener("resize", resize);
    resize();

    function step() {
      if (currentState.t > timeSpec.end) return;

      const result = recompute(LESSON, currentState);
      const message = evaluateReflections(LESSON, currentState);
      
      if (reflectionEl) {
        reflectionEl.textContent = message || "";
      }

      render(
        result.systemState,
        LESSON.representationSpec,
        ctx,
        canvas,
        currentState
      );

      // Advance time locally for next frame
      currentState.t += timeSpec.step;
      
      // Update React state as required
      setT(prev => prev + timeSpec.step);

      requestRef.current = requestAnimationFrame(step);
    }

    requestRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.top}></div>

      <div style={styles.stage}>
        <div style={styles.interactionLayout}>

          <div style={styles.canvasWrap}>
            <canvas ref={canvasRef} style={styles.canvas}></canvas>
          </div>

          <div id="reflection" ref={reflectionRef} style={styles.reflection}></div>

        </div>
      </div>

      <div style={styles.bottom}></div>
    </div>
  );
}