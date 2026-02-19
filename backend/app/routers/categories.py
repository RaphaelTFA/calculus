from fastapi import APIRouter, HTTPException
from pathlib import Path
import json

router = APIRouter(prefix="/categories", tags=["categories"])

DATA_DIR = Path(__file__).parent.parent.parent / "data"

@router.get("")
async def get_categories():
    """Return the raw contents of calculus/data/categories.json (keeps backward compatibility)."""
    categories_file = DATA_DIR / "categories.json"
    if not categories_file.exists():
        raise HTTPException(status_code=404, detail="categories.json not found")
    with open(categories_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data
