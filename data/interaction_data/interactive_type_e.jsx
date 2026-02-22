import React, { useState, useEffect, useRef } from 'react';

/* =========================================================
   LESSON — Change this JSON per lesson
========================================================= */

const LESSON = {
  "interactionType": "E",

  "lessonMeta": {
    "title": "Additivity of the Definite Integral",

    "statement": "For any split point s in [a,b], the total area satisfies ∫_a^b f(x) dx = ∫_a^s f(x) dx + ∫_s^b f(x) dx.",

    "instruction": "Drag the slider to move the split point s and observe how the total area remains constant."
  },

  "parameterSpec": {
    "structure": {
      "min": 0,
      "max": 1,
      "step": 0.01,
      "initial": 0.4,
      "label": "Split position (s)"
    }
  },

  "systemSpec": {
    "baseValues": {},

    "conservedObject": {
      "type": "expression",
      "expression": "(4^3)/3",
      "variables": []
    }
  },

  "reflectionSpec": {
    "triggers": [
      {
        "type": "structureNear",
        "value": 0.5,
        "tolerance": 0.05,
        "message": "The area is being split into two equal parts."
      },
      {
        "type": "structureBelow",
        "value": 0.15,
        "message": "Most of the accumulated area lies to the right of the split."
      },
      {
        "type": "structureAbove",
        "value": 0.85,
        "message": "Most of the accumulated area now lies to the left of the split."
      }
    ]
  },

  "representationSpec": {
    "mode": "geometricSplit",

    "geometryBase": {
      "type": "areaUnderCurve",
      "function": "x*x",
      "domain": [0, 4]
    },

    "splitSpec": {
      "type": "domainSplit"
    },

    "viewBox": {
      "xMin": 0,
      "xMax": 4.5,
      "yMin": 0,
      "yMax": 18
    }
  }
};

/* =========================================================
   UTILITIES
========================================================= */

function evalExpr(expr, scope){
  const fn = new Function(...Object.keys(scope),
    `"use strict"; return (${expr});`
  );
  return fn(...Object.values(scope));
}

function integrate(f, a, b, n=200){
  const dx=(b-a)/n;
  let sum=0;
  for(let i=0;i<n;i++){
    const x=a+i*dx;
    sum+=f(x)*dx;
  }
  return sum;
}

/* =========================================================
   GEOMETRY BUILDER
========================================================= */

function buildBaseGeometry(spec, scope){

  switch(spec.type){

    case "rectangle":
      return {
        type:"rectangle",
        x:spec.origin[0],
        y:spec.origin[1],
        width:evalExpr(spec.width, scope),
        height:evalExpr(spec.height, scope)
      };

    case "areaUnderCurve":
      return {
        type:"areaUnderCurve",
        functionSpec:spec.function,
        domain:spec.domain
      };

    case "regionBetweenCurves":
      return {
        type:"regionBetweenCurves",
        f:spec.f,
        g:spec.g,
        domain:spec.domain
      };

    default:
      throw new Error("Unsupported geometry");
  }
}

function bisect(h, left, right, iterations=25){

  for(let i=0;i<iterations;i++){

    const mid = (left + right)/2;
    const yMid = h(mid);

    if(Math.abs(yMid) < 1e-10)
      return mid;

    if(h(left) * yMid < 0)
      right = mid;
    else
      left = mid;
  }

  return (left + right)/2;
}

function detectRoots(h, a, b, samples=400){

  const roots = [];
  const dx = (b - a) / samples;

  let prevX = a;
  let prevY = h(prevX);

  for(let i=1; i<=samples; i++){

    const x = a + i*dx;
    const y = h(x);

    if(Math.abs(prevY) < 1e-8){
      roots.push(prevX);
    }
    else if(prevY * y < 0){
      roots.push(bisect(h, prevX, x));
    }

    prevX = x;
    prevY = y;
  }

  return roots;
}


/* =========================================================
   SPLIT ENGINE
========================================================= */

function applySplit(splitSpec, base, structure, scope){

  switch(splitSpec.type){

    case "rectangleContribution":{
      const {u,v,du,dv}=scope;

      return [
        {
          type:"rectangle",
          x:base.x,
          y:base.y+v,
          width:u,
          height:dv,
          contribution:"u·dv"
        },
        {
          type:"rectangle",
          x:base.x+u,
          y:base.y,
          width:du,
          height:v,
          contribution:"v·du"
        }
      ];
    }

    case "domainSplit":{

      const [a,b]=base.domain;
      const split=a+structure*(b-a);

      return [
        {
          type:"areaUnderCurve",
          functionSpec:base.functionSpec,
          domain:[a,split]
        },
        {
          type:"areaUnderCurve",
          functionSpec:base.functionSpec,
          domain:[split,b]
        }
      ];
    }

    case "signPartition": {

      const f = new Function("x", `return ${base.f}`);
      const g = new Function("x", `return ${base.g}`);
      const h = x => f(x) - g(x);

      const [a, b] = base.domain;

      const roots = detectRoots(h, a, b);
      const points = [a, ...roots, b].sort((x,y)=>x-y);

      const parts = [];

      for (let i = 0; i < points.length - 1; i++) {

        const x0 = points[i];
        const x1 = points[i+1];

        const mid = (x0 + x1) / 2;
        const sign = h(mid);

        if (Math.abs(sign) < 1e-6) continue;

        parts.push({
          type:"regionBetweenCurves",
          f:base.f,
          g:base.g,
          domain:[x0, x1],
          sign: sign > 0 ? "positive" : "negative",
          intervalIndex: i
        });
      }

      return parts;
    }

    default:
      throw new Error("Unsupported split");
  }
}

/* =========================================================
   MEASURE
========================================================= */

function measure(geom){

  switch(geom.type){

    case "rectangle":
      return geom.width*geom.height;

    case "areaUnderCurve":{
      const f=new Function("x",`return ${geom.functionSpec}`);
      return integrate(f, geom.domain[0], geom.domain[1]);
    }

    case "regionBetweenCurves":{
      const f=new Function("x",`return ${geom.f}`);
      const g=new Function("x",`return ${geom.g}`);
      return integrate(x=>f(x)-g(x),
                       geom.domain[0],
                       geom.domain[1]);
    }

    default:
      return 0;
  }
}

/* =========================================================
   RECOMPUTE
========================================================= */

function recompute(lesson, state){

  const scope=lesson.systemSpec.baseValues||{};

  const TOTAL=evalExpr(
    lesson.systemSpec.conservedObject.expression,
    scope
  );

  const base=buildBaseGeometry(
    lesson.representationSpec.geometryBase,
    scope
  );

  const parts=applySplit(
    lesson.representationSpec.splitSpec,
    base,
    state.structure,
    scope
  );

  let activeIndex = null;

  if(lesson.representationSpec.splitSpec.type === "signPartition"){
    if(parts.length > 0){
      activeIndex = Math.min(
        parts.length - 1,
        Math.floor(state.structure * parts.length)
      );
    }
  }
  
  const derived=parts.reduce(
    (acc,p)=>acc+measure(p),0
  );
  const tolerance = 1e-2;
  if(Math.abs(derived-TOTAL) > tolerance){
    console.warn("Invariant violation");
  }

  return {base,parts,invariant:TOTAL,activeIndex};
}

/* =========================================================
   RENDER
========================================================= */

function render(system, state, canvas, ctx){

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const vb=LESSON.representationSpec.viewBox;

  const mapX=x=>
    (x-vb.xMin)/(vb.xMax-vb.xMin)*canvas.width;

  const mapY=y=>
    canvas.height-
    (y-vb.yMin)/(vb.yMax-vb.yMin)*canvas.height;

  function drawRectangle(r,color,alpha=1){
    ctx.globalAlpha = alpha;
    ctx.fillStyle=color;
    ctx.fillRect(
      mapX(r.x),
      mapY(r.y+r.height),
      mapX(r.x+r.width)-mapX(r.x),
      mapY(r.y)-mapY(r.y+r.height)
    );
    ctx.globalAlpha = 1;
  }

  function drawArea(area,color){
    const f=new Function("x",`return ${area.functionSpec}`);
    const [a,b]=area.domain;
    ctx.beginPath();
    ctx.moveTo(mapX(a),mapY(0));
    for(let x=a;x<=b;x+=0.02){
      ctx.lineTo(mapX(x),mapY(f(x)));
    }
    ctx.lineTo(mapX(b),mapY(0));
    ctx.closePath();
    ctx.fillStyle=color;
    ctx.fill();
  }
  function drawRegionBetween(region, color){

    const f = new Function("x", `return ${region.f}`);
    const g = new Function("x", `return ${region.g}`);
    const [a,b] = region.domain;

    ctx.beginPath();
    ctx.moveTo(mapX(a), mapY(g(a)));

    for(let x=a; x<=b; x+=0.02){
      ctx.lineTo(mapX(x), mapY(f(x)));
    }

    for(let x=b; x>=a; x-=0.02){
      ctx.lineTo(mapX(x), mapY(g(x)));
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  if(system.base.type==="rectangle"){
    drawRectangle(system.base,"#1e40af");
  }
  if(system.base.type==="areaUnderCurve"){
    drawArea(system.base, "rgba(255,255,255,0.05)");
  }

  if(system.base.type==="regionBetweenCurves"){
    drawRegionBetween(system.base, "rgba(255,255,255,0.05)");
  }

  system.parts.forEach((p,i)=>{
    if(p.type==="rectangle"){

      const alpha =
        p.contribution==="u·dv"
          ? 1 - state.structure
          : state.structure;

      drawRectangle(
        p,
        p.contribution==="u·dv"
          ? "#3b82f6"
          : "#0ea5e9",
        alpha
      );
    }
    if(p.type==="areaUnderCurve")
      if(LESSON.representationSpec.splitSpec.type === "domainSplit"){

      const balanced = Math.abs(state.structure - 0.5) < 0.05;

      drawArea(
        p,
        balanced ? "#2563eb" : (i? "#38bdf8":"#60a5fa")
      );

    } else {
      drawArea(p,i? "#38bdf8":"#60a5fa");
    }
    if(p.type==="regionBetweenCurves"){
      const isActive =
        system.activeIndex !== null &&
        p.intervalIndex === system.activeIndex;

      const alpha = isActive ? 1 : 0.25;

      ctx.globalAlpha = alpha;

      drawRegionBetween(
        p,
        p.sign==="positive" ? "#2563eb" : "#ef4444"
      );

      ctx.globalAlpha = 1;
    }
  });

  /* ===============================
   DOMAIN SPLIT LABELS
================================ */

  if(LESSON.representationSpec.splitSpec.type === "domainSplit" && system.base.type === "areaUnderCurve"){

    const [a,b] = system.base.domain;
    const split = a + state.structure*(b-a);

    ctx.fillStyle = "#111827";
    ctx.font = "14px system-ui";

    // Left integral label
    ctx.fillText(
      "∫ₐˢ f(x) dx",
      mapX((a+split)/2) - 40,
      mapY(LESSON.representationSpec.viewBox.yMax) - 20
    );

    // Right integral label
    ctx.fillText(
      "∫ₛᵇ f(x) dx",
      mapX((split+b)/2) - 40,
      mapY(LESSON.representationSpec.viewBox.yMax) - 20
    );
  }
  ctx.fillStyle="#111827";
}

/* =========================================================
   ENGINE STATE Logic (Adapted for React)
========================================================= */
function evaluateReflection(structure, state){

  if(!LESSON.reflectionSpec) return "";

  if(LESSON.representationSpec.splitSpec.type === "signPartition"){

    const system = recompute(LESSON,state);

    if(system.activeIndex != null){

      const active = system.parts[system.activeIndex];

      if(active.sign === "positive"){
        return "In this interval, f(x) > g(x), so the signed area is positive.";
      } else {
        return "In this interval, f(x) < g(x), so the signed area is negative.";
      }
    }
  }
  const triggers = LESSON.reflectionSpec.triggers;

  for(const t of triggers){

    if(t.type==="structureAbove" && structure > t.value)
      return t.message;

    if(t.type==="structureBelow" && structure < t.value)
      return t.message;

    if(t.type==="structureNear" &&
       Math.abs(structure - t.value) < (t.tolerance||0.05))
      return t.message;
  }

  return "";
}

export default function GeometricEngine() {
  const [structure, setStructure] = useState(LESSON.parameterSpec.structure.initial);
  const canvasRef = useRef(null);

  // Construct current state object matching the original engine's structure
  const state = { structure };

  // Calculate message purely based on current structure
  const message = evaluateReflection(structure, state);

  // Effect handles the canvas rendering side-effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const system = recompute(LESSON, state);
    render(system, state, canvas, ctx);
  }, [structure]); // Re-run when structure changes

  return (
    <div style={{ fontFamily: 'system-ui', color: '#111827', background: '#ffffff' }}>
      <div id="topBar" style={{ height: '60px' }}></div>

      <div id="canvasContainer" style={{
        height: '360px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}>
        <canvas
          ref={canvasRef}
          id="canvas"
          width="800"
          height="360"
          style={{
            border: '1px solid #d1d5db',
            background: '#ffffff',
            borderRadius: '12px'
          }}
        />
        <div id="popup" style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          maxWidth: '260px',
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #d1d5db',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          color: '#111827',
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          pointerEvents: 'none',
          transition: 'all 0.25s ease',
          opacity: message ? 1 : 0,
          transform: message ? 'translateY(0)' : 'translateY(-6px)'
        }}>
          {message}
        </div>
      </div>

      <div id="bottomBar" style={{
        height: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <input
          type="range"
          id="structureSlider"
          min="0"
          max="1"
          step="0.01"
          value={structure}
          onChange={(e) => setStructure(parseFloat(e.target.value))}
          style={{ width: '600px' }}
        />
      </div>
    </div>
  );
}