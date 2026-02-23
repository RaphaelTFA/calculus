from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import runpy
import asyncio
from app.config import settings
from app.database import init_db
from app.routers import auth_router, stories_router, steps_router, progress_router, categories_router, auth

# Reduce noisy Uvicorn logs and show only SQL logs
import logging
# Default root level: show only warnings/errors (suppress app prints)
logging.basicConfig(level=logging.WARNING, format="%(levelname)s:%(name)s:%(message)s")
# Ensure SQLAlchemy SQL statements are visible
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
logging.getLogger("sqlalchemy.engine.Engine").setLevel(logging.INFO)

# Module logger
logger = logging.getLogger(__name__)

# Path to data folder
DATA_DIR = Path(__file__).parent.parent.parent / "data"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await ensure_course_jsons()
    await seed_from_json()
    await seed_achievements()
    yield
    # Shutdown

app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(stories_router, prefix="/api/v1")
app.include_router(steps_router, prefix="/api/v1")
app.include_router(progress_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Calculus API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


async def ensure_course_jsons():
    """Run builder on any source folder not yet indexed.

    Courses are considered present if their slug appears as a value in
    `data/courses/_index.json`. Sources are looked for in both the top-level
    `data/` directory and under `data/courses/` (since some projects nest them).
    """
    from pathlib import Path
    data_dir = Path(__file__).parent.parent.parent / 'data'
    raw_courses_dir = data_dir / 'raw_courses'
    courses_dir = data_dir / 'courses'
    index_path = courses_dir / '_index.json'
    existing_slugs = set()
    if index_path.exists():
        try:
            existing_slugs = set(json.loads(index_path.read_text(encoding='utf-8')).values())
        except Exception:
            existing_slugs = set()

    sources = []
    # check top‑level data folders
    for entry in sorted(data_dir.iterdir()):
        if entry.is_dir() and (entry / 'course.json').is_file():
            sources.append(entry)
    # also look in data/courses subfolders (some sources live there)
    if courses_dir.exists():
        for entry in sorted(courses_dir.iterdir()):
            if entry.is_dir() and (entry / 'course.json').is_file():
                sources.append(entry)
    # additionally consider raw_courses directory which holds unprocessed material
    raw_root = data_dir / 'raw_courses'
    if raw_root.exists():
        for entry in sorted(raw_root.iterdir()):
            if entry.is_dir() and (entry / 'course.json').is_file():
                sources.append(entry)

    if not sources:
        logger.debug("No course source folders found to build")
        return

    def run_build():
        # import runner lazily to avoid circular import issues
        globs = runpy.run_path(str(Path(__file__).parent.parent.parent / 'tools' / 'build_course_from_chapters.py'))
        build_fn = globs.get('build_course_from_folder')
        if not build_fn:
            logger.debug("build_course_from_folder not available")
            return
        for src in sources:
            try:
                meta = load_json(str(src / 'course.json'))
                slug = meta.get('slug') or meta.get('title')
            except Exception:
                slug = None
            if slug and slug in existing_slugs:
                logger.debug(f"Skipping {src}, already indexed")
                continue
            out, salt = build_fn(str(src), str(courses_dir), encrypt=True)
            logger.info(f"Built course file: {out}")
    
    await asyncio.to_thread(run_build)


async def seed_from_json():
    """Seed database from JSON files in /data folder"""
    from app.database import async_session
    from app.models import Category, Story, Chapter, Step, Slide
    from sqlalchemy import select
    
    async with async_session() as db:
        # Check if data exists
        result = await db.execute(select(Story).limit(1))
        db_has_stories = result.scalar_one_or_none() is not None
        if db_has_stories:
            logger.debug("📊 Data already exists — ensuring media fields (thumbnail/illustration) are present")
        else:
            logger.debug("📊 Database empty — seeding data from JSON files")
        
        # 1. Load categories from JSON
        categories_file = DATA_DIR / "categories.json"
        categories_map = {}
        
        if categories_file.exists():
            with open(categories_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle both formats: {"categories": [...]} or [...]
            categories_data = data.get("categories", data) if isinstance(data, dict) else data
            
            for cat in categories_data:
                # Upsert category if it already exists
                existing_cat = await db.execute(select(Category).where(Category.slug == cat["slug"]))
                existing_cat = existing_cat.scalar_one_or_none()
                if existing_cat:
                    categories_map[cat["slug"]] = existing_cat
                    continue

                category = Category(
                    name=cat["name"],
                    slug=cat["slug"],
                    icon=cat.get("icon", "📚")
                )
                db.add(category)
                await db.flush()
                categories_map[cat["slug"]] = category
                logger.debug(f"  ✅ Category: {cat['name']}")
        
        # 2. Load courses from folder-based structure
        courses_dir = DATA_DIR / "courses"
        if courses_dir.exists():
            for course_folder in sorted(courses_dir.iterdir()):
                if not course_folder.is_dir():
                    continue
                course_file = course_folder / "course.json"
                if not course_file.exists():
                    continue

                with open(course_file, 'r', encoding='utf-8') as f:
                    course_data = json.load(f)

                # Load chapters from subfolders
                chapters_dir = course_folder / "chapters"
                course_data["chapters"] = []
                if chapters_dir.exists():
                    for chapter_folder in sorted(chapters_dir.iterdir()):
                        if not chapter_folder.is_dir():
                            continue
                        chapter_file = chapter_folder / "chapter.json"
                        if not chapter_file.exists():
                            continue
                        with open(chapter_file, 'r', encoding='utf-8') as f:
                            chapter_data = json.load(f)
                        steps_dir = chapter_folder / "steps"
                        chapter_data["steps"] = []
                        if steps_dir.exists():
                            for step_file in sorted(steps_dir.glob("*.json")):
                                with open(step_file, 'r', encoding='utf-8') as f:
                                    step_data = json.load(f)
                                chapter_data["steps"].append(step_data)
                            chapter_data["steps"].sort(key=lambda x: x.get("order_index", 0))
                        course_data["chapters"].append(chapter_data)
                    course_data["chapters"].sort(key=lambda x: x.get("order_index", 0))

                # Get category
                category_slug = course_data.get("category_slug", course_data.get("category", "giai-tich"))
                category = categories_map.get(category_slug)

                # Check if story exists
                existing_story_res = await db.execute(select(Story).where(Story.slug == course_data["slug"]))
                existing_story = existing_story_res.scalar_one_or_none()

                if existing_story:
                    # Ensure media fields are present / up-to-date
                    updated = False
                    if course_data.get("thumbnail_url") and existing_story.thumbnail_url != course_data.get("thumbnail_url"):
                        existing_story.thumbnail_url = course_data.get("thumbnail_url")
                        updated = True
                    if course_data.get("illustration") and existing_story.illustration != course_data.get("illustration"):
                        existing_story.illustration = course_data.get("illustration")
                        updated = True
                    if updated:
                        logger.debug(f"  ↺ Updated media for course: {course_data['slug']}")
                    else:
                        logger.debug(f"  ↺ Course exists: {course_data['slug']}")
                    continue

                # Create story (new)
                story = Story(
                    slug=course_data["slug"],
                    title=course_data["title"],
                    description=course_data.get("description", ""),
                    thumbnail_url=course_data.get("thumbnail_url"),
                    illustration=course_data.get("illustration"),
                    icon=course_data.get("icon", "📖"),
                    color=course_data.get("color", "from-blue-500 to-blue-700"),
                    difficulty=course_data.get("difficulty", "beginner"),
                    is_published=course_data.get("is_published", True),
                    is_featured=course_data.get("is_featured", False),
                    order_index=course_data.get("order_index", 0),
                    category_id=category.id if category else None
                )
                db.add(story)
                await db.flush()
                logger.debug(f"📚 Course: {course_data['title']}")

                # Create chapters
                for chapter_data in course_data.get("chapters", []):
                    chapter = Chapter(
                        story_id=story.id,
                        title=chapter_data["title"],
                        description=chapter_data.get("description", ""),
                        order_index=chapter_data.get("order_index", 0)
                    )
                    db.add(chapter)
                    await db.flush()
                    logger.debug(f"  📖 Chapter: {chapter_data['title']}")

                    # Create steps
                    for step_data in chapter_data.get("steps", []):
                        step = Step(
                            chapter_id=chapter.id,
                            title=step_data["title"],
                            xp_reward=step_data.get("xp_reward", 10),
                            order_index=step_data.get("order_index", 0)
                        )
                        db.add(step)
                        await db.flush()
                        logger.debug(f"    📝 Step: {step_data['title']}")

                        # Create slides
                        for slide_data in step_data.get("slides", []):
                            slide = Slide(
                                step_id=step.id,
                                order_index=slide_data.get("order_index", 0),
                                blocks=slide_data.get("blocks", [])
                            )
                            db.add(slide)
        
        await db.commit()
        logger.debug("✅ Data seeded from JSON files!")


async def seed_achievements():
    """Seed achievements data"""
    from app.database import async_session
    from app.models import Achievement
    from sqlalchemy import select
    
    async with async_session() as db:
        # Check if achievements exist
        result = await db.execute(select(Achievement).limit(1))
        if result.scalar_one_or_none():
            return
        
        achievements_data = [
            # XP milestones
            {"title": "Người mới bắt đầu", "description": "Đạt 100 XP đầu tiên", "icon": "🌱", "category": "xp", "rarity": "common", "xp_reward": 10, "requirement_type": "xp", "requirement_value": 100},
            {"title": "Sinh viên chăm chỉ", "description": "Đạt 500 XP", "icon": "📚", "category": "xp", "rarity": "common", "xp_reward": 25, "requirement_type": "xp", "requirement_value": 500},
            {"title": "Nhà toán học trẻ", "description": "Đạt 1000 XP", "icon": "🎓", "category": "xp", "rarity": "uncommon", "xp_reward": 50, "requirement_type": "xp", "requirement_value": 1000},
            {"title": "Bậc thầy giải tích", "description": "Đạt 5000 XP", "icon": "🏆", "category": "xp", "rarity": "rare", "xp_reward": 100, "requirement_type": "xp", "requirement_value": 5000},
            {"title": "Huyền thoại toán học", "description": "Đạt 10000 XP", "icon": "👑", "category": "xp", "rarity": "legendary", "xp_reward": 200, "requirement_type": "xp", "requirement_value": 10000},
            
            # Steps milestones
            {"title": "Bước đầu tiên", "description": "Hoàn thành bài học đầu tiên", "icon": "👣", "category": "progress", "rarity": "common", "xp_reward": 15, "requirement_type": "steps", "requirement_value": 1},
            {"title": "Đang tiến bộ", "description": "Hoàn thành 5 bài học", "icon": "🚶", "category": "progress", "rarity": "common", "xp_reward": 30, "requirement_type": "steps", "requirement_value": 5},
            {"title": "Học tập đều đặn", "description": "Hoàn thành 10 bài học", "icon": "🏃", "category": "progress", "rarity": "uncommon", "xp_reward": 50, "requirement_type": "steps", "requirement_value": 10},
            {"title": "Không gì ngăn cản", "description": "Hoàn thành 25 bài học", "icon": "🚀", "category": "progress", "rarity": "rare", "xp_reward": 75, "requirement_type": "steps", "requirement_value": 25},
            {"title": "Bền bỉ", "description": "Hoàn thành 50 bài học", "icon": "💪", "category": "progress", "rarity": "epic", "xp_reward": 100, "requirement_type": "steps", "requirement_value": 50},
            
            # Streak milestones
            {"title": "Khởi động", "description": "Streak 3 ngày liên tiếp", "icon": "🔥", "category": "streak", "rarity": "common", "xp_reward": 20, "requirement_type": "streak", "requirement_value": 3},
            {"title": "Tuần hoàn hảo", "description": "Streak 7 ngày liên tiếp", "icon": "⚡", "category": "streak", "rarity": "uncommon", "xp_reward": 50, "requirement_type": "streak", "requirement_value": 7},
            {"title": "Tháng kiên trì", "description": "Streak 30 ngày liên tiếp", "icon": "🌟", "category": "streak", "rarity": "rare", "xp_reward": 150, "requirement_type": "streak", "requirement_value": 30},
            {"title": "Kỷ luật thép", "description": "Streak 100 ngày liên tiếp", "icon": "💎", "category": "streak", "rarity": "legendary", "xp_reward": 500, "requirement_type": "streak", "requirement_value": 100},
            
            # Stories milestones
            {"title": "Hoàn thành khóa học", "description": "Hoàn thành 1 khóa học", "icon": "✅", "category": "stories", "rarity": "uncommon", "xp_reward": 100, "requirement_type": "stories", "requirement_value": 1},
            {"title": "Nhà sưu tập", "description": "Hoàn thành 3 khóa học", "icon": "🎯", "category": "stories", "rarity": "rare", "xp_reward": 200, "requirement_type": "stories", "requirement_value": 3},
            {"title": "Đa năng", "description": "Hoàn thành 5 khóa học", "icon": "🌈", "category": "stories", "rarity": "epic", "xp_reward": 300, "requirement_type": "stories", "requirement_value": 5},
        ]
        
        for ach_data in achievements_data:
            achievement = Achievement(**ach_data)
            db.add(achievement)
        
        await db.commit()
        logger.debug("✅ Achievements seeded!")
