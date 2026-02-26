from app.routers.auth import router as auth_router
from app.routers.stories import router as stories_router
from app.routers.steps import router as steps_router
from app.routers.progress import router as progress_router
from app.routers.categories import router as categories_router
from app.routers.leaderboard import router as leaderboard_router

__all__ = ["auth_router", "stories_router", "steps_router", "progress_router", "categories_router", "leaderboard_router"]
