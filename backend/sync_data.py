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
import logging

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / "data"

async def sync_data():
    """Sync all JSON data to database"""
    engine = create_async_engine(settings.database_url, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        # 1. Sync categories
        logger.debug("📁 Syncing categories...")
        categories_file = DATA_DIR / "categories.json"
        if categories_file.exists():
            with open(categories_file, 'r', encoding='utf-8') as f:
                categories_data = json.load(f)
            
            for cat in categories_data.get("categories", []):
                from sqlalchemy import text
                existing = await session.execute(
                    text("SELECT id FROM categories WHERE slug = :slug"),
                    {"slug": cat["slug"]}
                )
                if not existing.scalar():
                    category = Category(
                        name=cat["name"],
                        slug=cat["slug"],
                        icon=cat.get("icon", "📚")
                    )
                    session.add(category)
                    logger.debug(f"  ✅ Added category: {cat['name']}")
        
        await session.commit()
        
        # 2. Sync courses
        logger.debug("\n📚 Syncing courses...")
        courses_dir = DATA_DIR / "courses"
        if courses_dir.exists():
            # Handle single JSON files
            for course_file in courses_dir.glob("*.json"):
                with open(course_file, 'r', encoding='utf-8') as f:
                    course_data = json.load(f)
                await process_course(session, course_data)
            
            # Handle folder-based courses
            for course_folder in courses_dir.iterdir():
                if course_folder.is_dir():
                    course_file = course_folder / "course.json"
                    if course_file.exists():
                        with open(course_file, 'r', encoding='utf-8') as f:
                            course_data = json.load(f)
                        
                        # Load chapters
                        chapters_dir = course_folder / "chapters"
                        if chapters_dir.exists():
                            course_data["chapters"] = []
                            for chapter_folder in chapters_dir.iterdir():
                                if chapter_folder.is_dir():
                                    chapter_file = chapter_folder / "chapter.json"
                                    if chapter_file.exists():
                                        with open(chapter_file, 'r', encoding='utf-8') as f:
                                            chapter_data = json.load(f)
                                        
                                        # Load steps
                                        steps_dir = chapter_folder / "steps"
                                        if steps_dir.exists():
                                            chapter_data["steps"] = []
                                            for step_file in steps_dir.glob("*.json"):
                                                with open(step_file, 'r', encoding='utf-8') as f:
                                                    step_data = json.load(f)
                                                chapter_data["steps"].append(step_data)
                                            
                                            # Sort steps by order_index
                                            chapter_data["steps"].sort(key=lambda x: x.get("order_index", 0))
                                        
                                        course_data["chapters"].append(chapter_data)
                            
                            # Sort chapters by order_index
                            course_data["chapters"].sort(key=lambda x: x.get("order_index", 0))
                        
                        await process_course(session, course_data)
        
        await session.commit()
        logger.debug("\n✨ Data sync completed!")

async def process_course(session, course_data):
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
        logger.debug(f"  ⚠️ Course '{course_data['title']}' already exists, skipping...")
        return
    
    # Create story
    story = Story(
        title=course_data["title"],
        slug=course_data["slug"],
        description=course_data.get("description", ""),
        thumbnail_url=course_data.get("thumbnail_url"),
        illustration=course_data.get("illustration"),
        icon=course_data.get("icon", "📖"),
        color=course_data.get("color"),
        difficulty=course_data.get("difficulty", "beginner"),
        is_published=course_data.get("is_published", True),
        is_featured=course_data.get("is_featured", False),
        order_index=course_data.get("order_index", 0),
        category_id=category.id if category else None
    )
    session.add(story)
    await session.flush()  # Get story.id
    
    logger.debug(f"  ✅ Added course: {course_data['title']}")
    
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
        
        logger.debug(f"    📖 Chapter: {chapter_data['title']}")
        
        # Create steps
        for st_idx, step_data in enumerate(chapter_data.get("steps", [])):
            step = Step(
                title=step_data["title"],
                description=step_data.get("description", ""),
                order_index=st_idx,
                xp_reward=step_data.get("xp_reward", 10),
                chapter_id=chapter.id
            )
            session.add(step)
            await session.flush()
            logger.debug(f"      📝 Step: {step_data['title']}")
            
            # Create slides
            for sl_idx, slide_data in enumerate(step_data.get("slides", [])):
                from app.models import Slide
                slide = Slide(
                    step_id=step.id,
                    order_index=sl_idx,
                    blocks=slide_data.get("blocks", [])
                )
                session.add(slide)

if __name__ == "__main__":
    asyncio.run(sync_data())
