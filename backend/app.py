import json
import os
import sqlite3
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="GBA World API", version="0.2.0")


class Settings:
    """Application configuration pulled from environment variables."""

    def __init__(self) -> None:
        self.db_path = os.getenv("DB_PATH", "database/game.db")
        origins_raw = os.getenv("FRONTEND_ORIGINS", "*")
        self.frontend_origins = [origin.strip() for origin in origins_raw.split(",") if origin.strip()] or ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
allow_all_origins = settings.frontend_origins == ["*"]
allowed_origins = settings.frontend_origins if not allow_all_origins else ["*"]
BASE_DIR = Path(__file__).resolve().parents[1]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DatabaseGateway:
    """SQLite helper that manages a shared connection."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._connection: Optional[sqlite3.Connection] = None

    def connect(self) -> None:
        if self._connection:
            return
        db_path = Path(self._settings.db_path)
        if not db_path.is_absolute():
            db_path = BASE_DIR / db_path
        should_seed = not db_path.exists()
        connection = sqlite3.connect(db_path, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        if should_seed:
            self._apply_schema(connection)
        else:
            self._ensure_schema(connection)
        self._connection = connection

    def disconnect(self) -> None:
        if self._connection:
            self._connection.close()
            self._connection = None

    def _apply_schema(self, connection: sqlite3.Connection) -> None:
        schema_path = BASE_DIR / "database" / "schema.sql"
        with schema_path.open("r", encoding="utf-8") as handle:
            script = handle.read()
        connection.executescript(script)
        connection.commit()

    def _ensure_schema(self, connection: sqlite3.Connection) -> None:
        cursor = connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='slides'")
        exists = cursor.fetchone() is not None
        if not exists:
            self._apply_schema(connection)

    @property
    def conn(self) -> sqlite3.Connection:
        if not self._connection:
            raise RuntimeError("Database connection is not ready")
        return self._connection

    def fetch_slide(self, slide_id: str) -> Optional[Dict[str, Any]]:
        cursor = self.conn.execute(
            "SELECT slide_id, name, theme, tile_grid, spawn_col, spawn_row FROM slides WHERE slide_id = ?",
            (slide_id,),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        tile_grid = row["tile_grid"].splitlines()
        return {
            "slide_id": row["slide_id"],
            "name": row["name"],
            "theme": row["theme"],
            "tile_grid": tile_grid,
            "spawn_col": row["spawn_col"],
            "spawn_row": row["spawn_row"],
        }

    def fetch_transitions(self, slide_id: str) -> List[Dict[str, Any]]:
        cursor = self.conn.execute(
            """
            SELECT direction,
                   target_slide_id,
                   target_spawn_col,
                   target_spawn_row,
                   trigger_col,
                   trigger_row
            FROM slide_transitions
            WHERE slide_id = ?
            """,
            (slide_id,),
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    def fetch_interactables(self, slide_id: str) -> List[Dict[str, Any]]:
        cursor = self.conn.execute(
            "SELECT object_id, col, row, kind, properties FROM interactables WHERE slide_id = ?",
            (slide_id,),
        )
        rows = cursor.fetchall()
        interactables: List[Dict[str, Any]] = []
        for row in rows:
            raw_properties = row["properties"]
            properties: Optional[Dict[str, Any]] = None
            if raw_properties:
                try:
                    properties = json.loads(raw_properties)
                except json.JSONDecodeError:
                    properties = None
            item = dict(row)
            item["properties"] = properties
            interactables.append(item)
        return interactables


_gateway: Optional[DatabaseGateway] = None


def get_gateway(settings: Settings = Depends(get_settings)) -> DatabaseGateway:
    global _gateway
    if _gateway is None:
        gateway = DatabaseGateway(settings)
        gateway.connect()
        _gateway = gateway
    return _gateway


@app.on_event("shutdown")
def on_shutdown() -> None:
    global _gateway
    if _gateway is not None:
        _gateway.disconnect()
        _gateway = None


@app.get("/healthz")
def healthcheck() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/slides/{slide_id}")
def read_slide(slide_id: str, gateway: DatabaseGateway = Depends(get_gateway)) -> Dict[str, Any]:
    slide = gateway.fetch_slide(slide_id)
    if slide is None:
        raise HTTPException(status_code=404, detail="Slide not found")

    transitions = gateway.fetch_transitions(slide_id)
    interactables = gateway.fetch_interactables(slide_id)

    return {
        "slide": slide,
        "transitions": transitions,
        "interactables": interactables,
    }
