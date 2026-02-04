from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, Enrollment, Story, StepProgress, Chapter
from app.schemas import DashboardResponse, StoryDetailResponse, ChapterResponse, StepResponse
from app.auth import get_current_user
from app.routers.stories import calculate_story_progress

router = APIRouter(prefix="/progress", tags=["progress"])

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get most recent enrollment
    result = await db.execute(
        select(Enrollment)
        .where(Enrollment.user_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
        .limit(1)
    )
    enrollment = result.scalar_one_or_none()
    
    current_story = None
    
    if enrollment:
        story_result = await db.execute(
            select(Story)
            .options(selectinload(Story.chapters).selectinload(Chapter.steps))
            .where(Story.id == enrollment.story_id)
        )
        story = story_result.scalar_one_or_none()
        
        if story:
            progress = await calculate_story_progress(db, current_user.id, story.id)
            
            # Get completed steps
            progress_result = await db.execute(
                select(StepProgress.step_id).where(
                    StepProgress.user_id == current_user.id,
                    StepProgress.is_completed == True
                )
            )
            completed_steps = set(progress_result.scalars().all())
            
            chapters = []
            found_current = False
            
            for chapter in story.chapters:
                steps = []
                for step in chapter.steps:
                    is_completed = step.id in completed_steps
                    is_current = not is_completed and not found_current
                    
                    if is_current:
                        found_current = True
                    
                    steps.append(StepResponse(
                        id=step.id,
                        title=step.title,
                        description=step.description,
                        xp_reward=step.xp_reward,
                        is_completed=is_completed,
                        is_current=is_current
                    ))
                
                chapters.append(ChapterResponse(
                    id=chapter.id,
                    title=chapter.title,
                    description=chapter.description,
                    steps=steps
                ))
            
            current_story = StoryDetailResponse(
                id=story.id,
                slug=story.slug,
                title=story.title,
                description=story.description,
                icon=story.icon,
                color=story.color,
                category_name=story.category.name if story.category else None,
                chapter_count=len(chapters),
                progress=progress,
                is_enrolled=True,
                chapters=chapters
            )
    
    level = current_user.xp // 100 + 1
    next_level_xp = level * 100
    
    return DashboardResponse(
        current_story=current_story,
        total_xp=current_user.xp,
        level=level,
        next_level_xp=next_level_xp
    )
