const TILE_SIZE = 16;
const PATH_TILE = "=";
const inferredBase = window.location.port === "8000" ? "" : "http://localhost:8000";
const rawBase = window.GAME_API_BASE ?? inferredBase;
const API_BASE = rawBase.replace(/\/$/, "");
const CANVAS_DIMENSION = 20 * TILE_SIZE;

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const slideNameEl = document.getElementById("slide-name");
const playerCoordsEl = document.getElementById("player-coords");
const debugLogEl = document.getElementById("debug-log");

const state = {
  slideId: "meadow",
  slide: null,
  transitions: new Map(),
  interactables: [],
  player: { col: 0, row: 0 },
  canMove: true,
};

function log(message) {
  const entry = document.createElement("div");
  entry.textContent = `${new Date().toLocaleTimeString()} ${message}`;
  debugLogEl.prepend(entry);
  while (debugLogEl.children.length > 50) {
    debugLogEl.removeChild(debugLogEl.lastChild);
  }
}

async function loadSlide(slideId, spawnOverride) {
  try {
    const response = await fetch(`${API_BASE}/api/slides/${slideId}`);
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    const payload = await response.json();
    state.slideId = slideId;
    state.slide = payload.slide;
    state.transitions = new Map(payload.transitions.map((t) => [t.direction, t]));
    state.interactables = payload.interactables;

    const spawnCol = spawnOverride?.col ?? payload.slide.spawn_col ?? 0;
    const spawnRow = spawnOverride?.row ?? payload.slide.spawn_row ?? 0;
    state.player.col = spawnCol;
    state.player.row = spawnRow;

    slideNameEl.textContent = `${payload.slide.name} (${payload.slide.theme})`;
    updatePlayerCoords();
    log(`Loaded slide '${slideId}'`);
  } catch (error) {
    log(`Failed to load slide '${slideId}': ${error.message}`);
  }
}

function updatePlayerCoords() {
  playerCoordsEl.textContent = `(${state.player.col}, ${state.player.row})`;
}

function drawTiles() {
  if (!state.slide) {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, CANVAS_DIMENSION, CANVAS_DIMENSION);
    return;
  }

  const palette = {
    default: "#1e293b",
    grass: "#10b981",
    forest: "#047857",
    cave: "#6b7280",
  };

  const floorColor = palette[state.slide.theme] ?? palette.default;
  ctx.fillStyle = floorColor;
  ctx.fillRect(0, 0, CANVAS_DIMENSION, CANVAS_DIMENSION);

  const grid = state.slide.tile_grid ?? [];
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      const tile = grid[row][col];
      if (tile === "#") {
        ctx.fillStyle = "#475569";
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (tile === PATH_TILE) {
        ctx.fillStyle = "#facc15";
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  ctx.fillStyle = "#facc15";
  state.interactables.forEach((obj) => {
    ctx.fillRect(obj.col * TILE_SIZE, obj.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  });
}

function drawPlayer() {
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(state.player.col * TILE_SIZE, state.player.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function render() {
  drawTiles();
  drawPlayer();
  requestAnimationFrame(render);
}

function isWalkable(col, row) {
  const grid = state.slide?.tile_grid;
  if (!grid || row < 0 || col < 0 || row >= grid.length || col >= grid[row].length) {
    return false;
  }
  return grid[row][col] !== "#";
}

function directionFromDelta(deltaCol, deltaRow) {
  if (deltaCol === 1) return "east";
  if (deltaCol === -1) return "west";
  if (deltaRow === 1) return "south";
  if (deltaRow === -1) return "north";
  return null;
}

async function movePlayer(deltaCol, deltaRow) {
  if (!state.canMove || !state.slide) return;

  const currentCol = state.player.col;
  const currentRow = state.player.row;
  const nextCol = currentCol + deltaCol;
  const nextRow = currentRow + deltaRow;

  const gridSize = state.slide.tile_grid?.length ?? 20;
  const outOfBounds = nextCol < 0 || nextCol >= gridSize || nextRow < 0 || nextRow >= gridSize;

  if (outOfBounds) {
    const direction = directionFromDelta(deltaCol, deltaRow);
    const transition = direction ? state.transitions.get(direction) : null;
    if (transition) {
      const requiresMatch = typeof transition.trigger_col === "number" && typeof transition.trigger_row === "number";
      if (requiresMatch && (currentCol !== transition.trigger_col || currentRow !== transition.trigger_row)) {
        log("No path forward");
        return;
      }
      log(`Transitioning ${direction} to ${transition.target_slide_id}`);
      await loadSlide(transition.target_slide_id, {
        col: transition.target_spawn_col,
        row: transition.target_spawn_row,
      });
    }
    return;
  }

  if (!isWalkable(nextCol, nextRow)) {
    log("Blocked tile");
    return;
  }

  state.player.col = nextCol;
  state.player.row = nextRow;
  updatePlayerCoords();
}

function handleKeydown(event) {
  switch (event.key) {
    case "ArrowUp":
      movePlayer(0, -1);
      break;
    case "ArrowDown":
      movePlayer(0, 1);
      break;
    case "ArrowLeft":
      movePlayer(-1, 0);
      break;
    case "ArrowRight":
      movePlayer(1, 0);
      break;
    default:
      break;
  }
}

window.addEventListener("keydown", handleKeydown);

canvas.width = CANVAS_DIMENSION;
canvas.height = CANVAS_DIMENSION;

loadSlide(state.slideId).then(() => {
  render();
});
