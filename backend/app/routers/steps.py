from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from app.database import get_db
from app.models import Step, Slide, StepProgress, Chapter, Story, User
from app.schemas import StepDetailResponse, SlideResponse, StepCompleteRequest
from app.auth import get_current_user

router = APIRouter(prefix="/steps", tags=["steps"])

@router.get("/{step_id}", response_model=StepDetailResponse)
async def get_step(step_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Step)
        .options(selectinload(Step.chapter).selectinload(Chapter.story))
        .where(Step.id == step_id)
    )
    step = result.scalar_one_or_none()
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    return StepDetailResponse(
        id=step.id,
        title=step.title,
        description=step.description,
        chapter_title=step.chapter.title,
        story_slug=step.chapter.story.slug,
        xp_reward=step.xp_reward
    )

@router.get("/{step_id}/slides", response_model=list[SlideResponse])
async def get_slides(step_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Slide)
        .where(Slide.step_id == step_id)
        .order_by(Slide.order_index)
    )
    slides = result.scalars().all()
    
    return [SlideResponse.model_validate(s) for s in slides]

@router.post("/{step_id}/complete")
async def complete_step(
    step_id: int,
    data: StepCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get step
    result = await db.execute(select(Step).where(Step.id == step_id))
    step = result.scalar_one_or_none()
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    # Check/create progress
    progress_result = await db.execute(
        select(StepProgress).where(
            StepProgress.user_id == current_user.id,
            StepProgress.step_id == step_id
        )
    )
    progress = progress_result.scalar_one_or_none()
    
    xp_earned = 0
    
    if not progress:
        progress = StepProgress(
            user_id=current_user.id,
            step_id=step_id,
            is_completed=True,
            score=data.score,
            time_spent_seconds=data.time_spent_seconds,
            completed_at=datetime.utcnow()
        )
        db.add(progress)
        xp_earned = step.xp_reward
        current_user.xp += xp_earned
    elif not progress.is_completed:
        progress.is_completed = True
        progress.score = data.score
        progress.time_spent_seconds = data.time_spent_seconds
        progress.completed_at = datetime.utcnow()
        xp_earned = step.xp_reward
        current_user.xp += xp_earned
    
    await db.commit()
    
    return {
        "success": True,
        "xp_earned": xp_earned,
        "total_xp": current_user.xp
    }
