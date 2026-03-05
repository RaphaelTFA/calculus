from app.routers.auth import router as auth_router
from app.routers.stories import router as stories_router
from app.routers.steps import router as steps_router
from app.routers.progress import router as progress_router
from app.routers.categories import router as categories_router
from app.routers.shop import router as shop_router
from app.routers.quests import router as quests_router

__all__ = ["auth_router", "stories_router", "steps_router", "progress_router", "categories_router", "shop_router", "quests_router"]
