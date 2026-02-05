from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
from app.config import settings
from app.database import init_db
from app.routers import auth_router, stories_router, steps_router, progress_router, auth

# Path to data folder
DATA_DIR = Path(__file__).parent.parent.parent / "data"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
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
app.include_router(auth.router, prefix="/auth", tags=["auth"])

@app.get("/")
async def root():
    return {"message": "Calculus API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


async def seed_from_json():
    """Seed database from JSON files in /data folder"""
    from app.database import async_session
    from app.models import Category, Story, Chapter, Step, Slide
    from sqlalchemy import select
    
    async with async_session() as db:
        # Check if data exists
        result = await db.execute(select(Story).limit(1))
        if result.scalar_one_or_none():
            print("📊 Data already exists, skipping seed")
            return
        
        # 1. Load categories from JSON
        categories_file = DATA_DIR / "categories.json"
        categories_map = {}
        
        if categories_file.exists():
            with open(categories_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle both formats: {"categories": [...]} or [...]
            categories_data = data.get("categories", data) if isinstance(data, dict) else data
            
            for cat in categories_data:
                category = Category(
                    name=cat["name"],
                    slug=cat["slug"],
                    icon=cat.get("icon", "📚")
                )
                db.add(category)
                await db.flush()
                categories_map[cat["slug"]] = category
                print(f"  ✅ Category: {cat['name']}")
        
        # 2. Load courses from JSON files
        courses_dir = DATA_DIR / "courses"
        if courses_dir.exists():
            for course_file in sorted(courses_dir.glob("*.json")):
                with open(course_file, 'r', encoding='utf-8') as f:
                    course_data = json.load(f)
                
                # Get category
                category_slug = course_data.get("category", "giai-tich")
                category = categories_map.get(category_slug)
                
                # Create story
                story = Story(
                    slug=course_data["slug"],
                    title=course_data["title"],
                    description=course_data.get("description", ""),
                    icon=course_data.get("icon", "📖"),
                    color=course_data.get("color", "from-blue-500 to-blue-700"),
                    difficulty=course_data.get("difficulty", "beginner"),
                    is_published=course_data.get("is_published", True),
                    is_featured=course_data.get("is_featured", False),
                    category_id=category.id if category else None
                )
                db.add(story)
                await db.flush()
                print(f"📚 Course: {course_data['title']}")
                
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
                    print(f"  📖 Chapter: {chapter_data['title']}")
                    
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
                        print(f"    📝 Step: {step_data['title']}")
                        
                        # Create slides
                        for slide_data in step_data.get("slides", []):
                            slide = Slide(
                                step_id=step.id,
                                order_index=slide_data.get("order_index", 0),
                                blocks=slide_data.get("blocks", [])
                            )
                            db.add(slide)
        
        await db.commit()
        print("✅ Data seeded from JSON files!")


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
        print("✅ Achievements seeded!")
