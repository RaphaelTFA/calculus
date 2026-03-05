"""
Data Sync Script - Import JSON data to SQLite database
This script reads from /data/ folder and syncs to database
"""

import json
import asyncio
import runpy
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

import sys
sys.path.insert(0, str(Path(__file__).parent))
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

from app.models import Base, Category, Story, Chapter, Step
from app.config import settings
import logging

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / "data"

async def ensure_course_jsons():
    """Run builder on any source folder not yet indexed.

    Courses are considered present if their slug appears as a value in
    `data/courses/_index.json`. Sources are looked for under `data/raw_courses/`.
    """
    data_dir = DATA_DIR
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
    # check top-level data folders
    for entry in sorted(data_dir.iterdir()):
        if entry.is_dir() and (entry / 'course.json').is_file():
            sources.append(entry)
    # also look in data/courses subfolders
    if courses_dir.exists():
        for entry in sorted(courses_dir.iterdir()):
            if entry.is_dir() and (entry / 'course.json').is_file():
                sources.append(entry)
    # additionally consider raw_courses directory
    if raw_courses_dir.exists():
        for entry in sorted(raw_courses_dir.iterdir()):
            if entry.is_dir() and (entry / 'course.json').is_file():
                sources.append(entry)

    if not sources:
        logger.debug("No course source folders found to build")
        return

    def run_build():
        globs = runpy.run_path(str(Path(__file__).parent.parent / 'tools' / 'build_course_from_chapters.py'))
        build_fn = globs.get('build_course_from_folder')
        if not build_fn:
            logger.debug("build_course_from_folder not available")
            return
        for src in sources:
            try:
                with open(src / 'course.json', 'r', encoding='utf-8') as f:
                    meta = json.load(f)
                slug = meta.get('slug') or meta.get('title')
            except Exception:
                slug = None
            if slug and slug in existing_slugs:
                logger.debug(f"Skipping {src}, already indexed")
                continue
            out, salt = build_fn(str(src), str(courses_dir), encrypt=True)
            logger.info(f"Built course file: {out}")

    await asyncio.to_thread(run_build)


async def sync_data():
    """Sync all JSON data to database"""
    engine = create_async_engine(settings.database_url, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await ensure_course_jsons()

    async with async_session() as session:
        # 0. Clean all existing course data so deleted folders are removed from DB
        from sqlalchemy import text
        logger.debug("🧹 Cleaning existing course data...")
        await session.execute(text("DELETE FROM slides"))
        await session.execute(text("DELETE FROM steps"))
        await session.execute(text("DELETE FROM chapters"))
        await session.execute(text("DELETE FROM stories"))
        await session.commit()
        logger.debug("  ✅ Old data cleared")

        # 1. Sync categories
        logger.debug("📁 Syncing categories...")
        categories_file = DATA_DIR / "categories.json"
        if categories_file.exists():
            with open(categories_file, 'r', encoding='utf-8') as f:
                categories_data = json.load(f)
            
            for cat in categories_data.get("categories", []):
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
        
        # 2. Sync courses from raw_courses folder
        logger.debug("\n📚 Syncing courses...")
        courses_dir = DATA_DIR / "raw_courses"
        if courses_dir.exists():
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
    from sqlalchemy import select, delete
    from app.models import Slide

    # Get category
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
        logger.debug(f"  🔄 Course '{course_data['title']}' exists — syncing slides...")
        story = existing_story

        # Load all chapters for this story, ordered
        from sqlalchemy.orm import selectinload
        result = await session.execute(
            select(Chapter)
            .where(Chapter.story_id == story.id)
            .order_by(Chapter.order_index)
        )
        db_chapters = result.scalars().all()

        json_chapters = sorted(course_data.get("chapters", []), key=lambda x: x.get("order_index", 0))

        for ch_idx, chapter_data in enumerate(json_chapters):
            if ch_idx >= len(db_chapters):
                break
            db_chapter = db_chapters[ch_idx]

            # Load steps for this chapter, ordered
            result = await session.execute(
                select(Step)
                .where(Step.chapter_id == db_chapter.id)
                .order_by(Step.order_index)
            )
            db_steps = result.scalars().all()

            json_steps = sorted(chapter_data.get("steps", []), key=lambda x: x.get("order_index", 0))

            for st_idx, step_data in enumerate(json_steps):
                if st_idx >= len(db_steps):
                    break
                db_step = db_steps[st_idx]

                # Delete all existing slides for this step and re-insert from JSON
                await session.execute(
                    delete(Slide).where(Slide.step_id == db_step.id)
                )
                for sl_idx, slide_data in enumerate(step_data.get("slides", [])):
                    slide = Slide(
                        step_id=db_step.id,
                        order_index=sl_idx,
                        blocks=slide_data.get("blocks", [])
                    )
                    session.add(slide)
                logger.debug(f"      🔁 Resynced slides for step: {step_data['title']}")

        return

    # Create new story
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
    await session.flush()

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
