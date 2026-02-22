export default function TypeBParameterControl() {
    // --------------------------------------------------------
    // STATIC CONFIGURATION
    // --------------------------------------------------------
    const LESSON_CONFIG = {
        meta: {
            parameterLabel: "System Tension"
        },
        parameter: {
            min: -5,
            max: 5,
            initial: 5
        },
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
    };

    // --------------------------------------------------------
    // STATE & REFS
    // --------------------------------------------------------
    const [currentValue, setCurrentValue] = React.useState(LESSON_CONFIG.parameter.initial);
    const [triggeredReflections, setTriggeredReflections] = React.useState(new Set());
    const [cards, setCards] = React.useState([]);

    const canvasRef = React.useRef(null);
    const containerRef = React.useRef(null);
    
    // Stable reference to current value for resize handler
    const valueRef = React.useRef(currentValue);
    React.useEffect(() => {
        valueRef.current = currentValue;
    }, [currentValue]);

    // --------------------------------------------------------
    // PURE RECOMPUTE BOUNDARY
    // --------------------------------------------------------
    function recomputeSystem(p) {
        const { resolution, view, model } = LESSON_CONFIG.system;
        const points = [];
        const dx = (view.xMax - view.xMin) / (resolution - 1);

        // Create evaluation context
        const formula = new Function('x', 'p', `return ${model}`);

        for (let i = 0; i < resolution; i++) {
            const x = view.xMin + (i * dx);
            let y = 0;
            try {
                y = formula(x, p);
            } catch (e) {
                y = 0;
            }
            points.push({ x, y });
        }

        return {
            points,
            bounds: view
        };
    }

    // --------------------------------------------------------
    // RENDER ISOLATION
    // --------------------------------------------------------
    function render(systemData) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const { points, bounds } = systemData;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const w = canvas.width / window.devicePixelRatio;
        const h = canvas.height / window.devicePixelRatio;

        // Mapping functions
        const mapX = (val) => (val - bounds.xMin) / (bounds.xMax - bounds.xMin) * w;
        const mapY = (val) => h - (val - bounds.yMin) / (bounds.yMax - bounds.yMin) * h;

        // Draw Axes
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, mapY(0)); ctx.lineTo(w, mapY(0));
        ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), h);
        ctx.stroke();

        // Draw Model
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();

        points.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(mapX(pt.x), mapY(pt.y));
            else ctx.lineTo(mapX(pt.x), mapY(pt.y));
        });

        ctx.stroke();
        ctx.restore();
    }

    // --------------------------------------------------------
    // EFFECTS
    // --------------------------------------------------------
    
    // Main Process: Render & Resize
    React.useEffect(() => {
        const handleResize = () => {
            const container = canvasRef.current?.parentElement;
            if (container && canvasRef.current) {
                canvasRef.current.width = container.clientWidth * window.devicePixelRatio;
                canvasRef.current.height = container.clientHeight * window.devicePixelRatio;
                
                // Use ref to access latest value without re-binding listener
                const systemState = recomputeSystem(valueRef.current);
                render(systemState);
            }
        };

        window.addEventListener('resize', handleResize);
        
        // Initial setup
        handleResize(); 

        return () => window.removeEventListener('resize', handleResize);
    }, []); // Run once on mount

    // Update render when value changes
    React.useEffect(() => {
        const systemState = recomputeSystem(currentValue);
        render(systemState);
    }, [currentValue]);

    // Reflection Logic
    React.useEffect(() => {
        const newCards = [];
        const nextTriggered = new Set(triggeredReflections);
        let updated = false;

        LESSON_CONFIG.reflections.forEach(ref => {
            if (!triggeredReflections.has(ref.id)) {
                const stateSim = { currentValue };
                if (ref.trigger(stateSim)) {
                    nextTriggered.add(ref.id);
                    newCards.push({ id: ref.id, text: ref.text, visible: false });
                    updated = true;
                }
            }
        });

        if (updated) {
            setTriggeredReflections(nextTriggered);
            setCards(prev => [...newCards.reverse(), ...prev]);
        }
    }, [currentValue, triggeredReflections]);

    // Card Animation Logic
    React.useEffect(() => {
        if (cards.some(c => !c.visible)) {
            requestAnimationFrame(() => {
                setCards(prev => prev.map(c => c.visible ? c : { ...c, visible: true }));
            });
        }
    }, [cards]);

    // --------------------------------------------------------
    // STYLES & LAYOUT
    // --------------------------------------------------------
    const styles = `
        :root {
            --bg-color: #ffffff;
            --primary-color: #2c3e50;
            --accent-color: #3498db;
            --text-color: #333;
            --ui-bg: #f8f9fa;
            --border-color: #ddd;
        }

        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        .engine-container {
            width: 100%;
            height: 100%;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            position: relative;
        }

        #top-reserve {
            height: 60px;
            width: 100%;
            position: absolute;
            top: 0;
            z-index: 10;
        }

        #bottom-reserve {
            height: 80px;
            width: 100%;
            position: absolute;
            bottom: 0;
            z-index: 10;
        }

        #main-stage {
            position: absolute;
            top: 60px;
            bottom: 80px;
            left: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        #interaction-layout {
            flex: 1;
            width: 100%;
            max-width: 1100px;
            display: flex;
            align-items: stretch;
            justify-content: center;
            gap: 40px;
        }

        #viz-container {
            flex: 0 0 700px;
            width: 100%;
            max-width: 800px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        canvas {
            width: 100%;
            height: 100%;
            max-height: 500px;
            touch-action: none;
        }

        #reflection-area {
            flex: 1;
            max-width: 320px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow-y: auto;
        }

        .reflection-card {
            background: rgba(255, 255, 255, 0.95);
            padding: 15px;
            border-left: 4px solid var(--accent-color);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-radius: 4px;
            font-size: 0.95rem;
            line-height: 1.4;
            opacity: 0;
            transform: translateX(20px);
            transition: all 0.5s ease-out;
            pointer-events: auto;
        }

        .reflection-card.visible {
            opacity: 1;
            transform: translateX(0);
        }

        #ui-panel {
            width: 100%;
            max-width: 600px;
            padding: 20px;
            background: var(--ui-bg);
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            margin-top: 20px;
            border: 1px solid var(--border-color);
            z-index: 20;
        }

        .control-row {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        #param-slider {
            flex: 1;
            cursor: pointer;
            accent-color: var(--accent-color);
        }

        #param-label {
            font-weight: 600;
            min-width: 120px;
        }

        @media (max-width: 900px) {
            #interaction-layout {
                flex-direction: column;
                align-items: center;
                gap: 20px;
            }
            
            #viz-container {
                flex: 0 0 auto;
                width: 100%;
                height: 300px;
            }

            #reflection-area {
                position: relative;
                top: 0;
                right: 0;
                width: 100%;
                max-width: 600px;
                margin-top: 15px;
            }
        }
    `;

    return (
        <div className="engine-container">
            <style>{styles}</style>
            
            <div id="top-reserve"></div>

            <div id="main-stage">
                <div id="interaction-layout">
                    <div id="viz-container" ref={containerRef}>
                        <canvas id="engine-canvas" ref={canvasRef}></canvas>
                    </div>

                    <div id="reflection-area">
                        {cards.map(card => (
                            <div 
                                key={card.id} 
                                className={`reflection-card ${card.visible ? 'visible' : ''}`}
                            >
                                {card.text}
                            </div>
                        ))}
                    </div>
                </div>

                <div id="ui-panel">
                    <div className="control-row">
                        <label id="param-label" htmlFor="param-slider">
                            {LESSON_CONFIG.meta.parameterLabel}
                        </label>
                        <input 
                            type="range" 
                            id="param-slider" 
                            step="0.001"
                            min={LESSON_CONFIG.parameter.min}
                            max={LESSON_CONFIG.parameter.max}
                            value={currentValue}
                            onChange={(e) => setCurrentValue(parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            <div id="bottom-reserve"></div>
        </div>
    );
}