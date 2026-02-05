"""
Data Sync Script - Import JSON data to SQLite database
This script reads from /data/ folder and syncs to database
"""

import json
import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

import sys
sys.path.insert(0, str(Path(__file__).parent))

from app.models import Base, Category, Story, Chapter, Step
from app.config import settings

DATA_DIR = Path(__file__).parent.parent / "data"

async def sync_data():
    """Sync all JSON data to database"""
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        # 1. Sync categories
        print("📁 Syncing categories...")
        categories_file = DATA_DIR / "categories.json"
        if categories_file.exists():
            with open(categories_file, 'r', encoding='utf-8') as f:
                categories_data = json.load(f)
            
            for cat in categories_data:
                existing = await session.execute(
                    "SELECT id FROM categories WHERE slug = :slug",
                    {"slug": cat["slug"]}
                )
                if not existing.scalar():
                    category = Category(
                        name=cat["name"],
                        slug=cat["slug"],
                        icon=cat.get("icon", "📚")
                    )
                    session.add(category)
                    print(f"  ✅ Added category: {cat['name']}")
        
        await session.commit()
        
        # 2. Sync courses
        print("\n📚 Syncing courses...")
        courses_dir = DATA_DIR / "courses"
        if courses_dir.exists():
            for course_file in courses_dir.glob("*.json"):
                with open(course_file, 'r', encoding='utf-8') as f:
                    course_data = json.load(f)
                
                # Get category
                from sqlalchemy import select
                result = await session.execute(
                    select(Category).where(Category.slug == course_data.get("category_slug", "giai-tich"))
                )
                category = result.scalar_one_or_none()
                
                # Check if course exists
                result = await session.execute(
                    select(Story).where(Story.slug == course_data["slug"])
                )
                existing_story = result.scalar_one_or_none()
                
                if existing_story:
                    print(f"  ⚠️ Course '{course_data['title']}' already exists, skipping...")
                    continue
                
                # Create story
                story = Story(
                    title=course_data["title"],
                    slug=course_data["slug"],
                    description=course_data.get("description", ""),
                    icon=course_data.get("icon", "📖"),
                    difficulty=course_data.get("difficulty", "beginner"),
                    estimated_hours=course_data.get("estimated_hours", 2.0),
                    is_published=course_data.get("is_published", True),
                    is_featured=course_data.get("is_featured", False),
                    order_index=course_data.get("order_index", 0),
                    category_id=category.id if category else None
                )
                session.add(story)
                await session.flush()  # Get story.id
                
                print(f"  ✅ Added course: {course_data['title']}")
                
                # Create chapters
                for ch_idx, chapter_data in enumerate(course_data.get("chapters", [])):
                    chapter = Chapter(
                        title=chapter_data["title"],
                        description=chapter_data.get("description", ""),
                        order_index=ch_idx,
                        story_id=story.id
                    )
                    session.add(chapter)
                    await session.flush()
                    
                    print(f"    📖 Chapter: {chapter_data['title']}")
                    
                    # Create steps
                    for st_idx, step_data in enumerate(chapter_data.get("steps", [])):
                        # Convert slides to JSON string
                        slides_json = json.dumps(step_data.get("slides", []), ensure_ascii=False)
                        
                        step = Step(
                            title=step_data["title"],
                            slug=step_data.get("slug", f"step-{st_idx+1}"),
                            order_index=st_idx,
                            xp_reward=step_data.get("xp_reward", 10),
                            content=slides_json,
                            chapter_id=chapter.id
                        )
                        session.add(step)
                        print(f"      📝 Step: {step_data['title']}")
        
        await session.commit()
        print("\n✨ Data sync completed!")

if __name__ == "__main__":
    asyncio.run(sync_data())
