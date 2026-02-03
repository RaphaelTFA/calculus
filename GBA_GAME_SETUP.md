# GBA Slide Explorer

This project pairs a Tailwind-powered web frontend with a FastAPI backend and an SQLite datastore to emulate a classic fixed-camera GBA exploration game.

## Prerequisites

- Python 3.11+
- SQLite 3 (the CLI ships with most Python installs)
- Node is not required; the frontend is static HTML/JS served as-is.

## Database: SQLite (SQL)

1. Ensure the `sqlite3` CLI is available (`python -m sqlite3 --version` or `sqlite3 --version`).
2. Apply the schema and seed data: `sqlite3 database/game.db < database/schema.sql` from the `calculus` directory. Re-run this command whenever `schema.sql` changes (for example, after pulling new path layouts).

The schema seeds three slides (`meadow`, `forest`, `cave`) connected via edge transitions. Slides are stored as 20x20 ASCII grids where `#` marks impassable tiles.

## Backend: FastAPI

1. Create and activate a Python virtual environment.
2. Install dependencies: `pip install -r backend/requirements.txt`.
3. Copy `backend/.env.example` to `backend/.env` and adjust database/CORS settings as needed.
4. Start the API: `uvicorn backend.app:app --reload --port 8000`.

The backend exposes:
- `GET /healthz`
- `GET /api/slides/{slide_id}` returning the slide, transitions, and interactables.

## Frontend

The frontend is located in `Frontend/index.html` and `Frontend/app.js`.

1. Serve the directory with any static file server, e.g. `python -m http.server 5173` from `Frontend`.
2. Visit `http://localhost:5173`. Ensure `FRONTEND_ORIGINS` in the backend `.env` includes this origin. To override the API endpoint without editing source, set `window.GAME_API_BASE` in a small script tag before loading `app.js`:

	```html
	<script>window.GAME_API_BASE = "http://localhost:8000";</script>
	<script type="module" src="./app.js"></script>
	```

### Controls

- Arrow keys move the character tile-by-tile.
- Moving beyond the map edges triggers slide transitions based on backend data.

## Customising the World

- Add new slides via `database/schema.sql` or direct SQL statements. Use `=` characters inside the 20×20 grid to mark golden path tiles; slide transitions only trigger when the player stands on that exact tile at the screen edge.
- Define adjacency in `slide_transitions` for seamless slide changes.
- Extend `interactables` to highlight special tiles.

## Next Steps

- Swap the Tailwind CDN for a local build if advanced styling is required.
- Introduce sprite sheets and animation frames in the frontend renderer.
- Expand FastAPI with POST endpoints for saving progress or dynamic updates.
