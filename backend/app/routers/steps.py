from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, date, timedelta
from app.database import get_db
from app.models import Step, Slide, StepProgress, Chapter, Story, User, Enrollment, SlideProgress, StreakWeek
from app.schemas import StepDetailResponse, SlideResponse, StepCompleteRequest, SlideCompleteRequest
from app.auth import get_current_user

router = APIRouter(prefix="/steps", tags=["steps"])


def update_streak(user: User, tz_offset_minutes: int | None = None) -> dict:
    """Update user's streak based on activity dates.
    Returns dict with streak info."""
    # compute user-local today using tz offset (minutes) if provided, otherwise server local date
    if tz_offset_minutes is not None:
        now = datetime.utcnow() + timedelta(minutes=tz_offset_minutes)
        today = now.date()
    else:
        today = date.today()

    last_activity = None
    if user.last_activity_date:
        try:
            # store last_activity_date in UTC; convert to user-local date for comparison
            lad = user.last_activity_date
            if tz_offset_minutes is not None:
                lad_local = lad + timedelta(minutes=tz_offset_minutes)
                last_activity = lad_local.date()
            else:
                last_activity = lad.date()
        except Exception:
            last_activity = user.last_activity_date.date()
    
    streak_increased = False
    streak_reset = False
    
    if last_activity is None:
        # First activity ever
        user.current_streak = 1
        streak_increased = True
    elif last_activity == today:
        # Already active today, no change
        pass
    elif last_activity == today - timedelta(days=1):
        # Active yesterday, continue streak
        user.current_streak += 1
        streak_increased = True
    else:
        # Missed at least one day, reset streak
        user.current_streak = 1
        streak_reset = True
    
    # Update longest streak if needed
    if user.current_streak > user.longest_streak:
        user.longest_streak = user.current_streak
    
    # Update last activity date (store in UTC)
    user.last_activity_date = datetime.utcnow()
    
    return {
        "current_streak": user.current_streak,
        "longest_streak": user.longest_streak,
        "streak_increased": streak_increased,
        "streak_reset": streak_reset
    }

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
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get step (include chapter/story so we can validate enrollment)
    result = await db.execute(
        select(Step)
        .options(selectinload(Step.chapter).selectinload(Chapter.story))
        .where(Step.id == step_id)
    )
    step = result.scalar_one_or_none()
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    # Require enrollment in the parent story before allowing completion
    enroll_res = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.story_id == step.chapter.story_id
        )
    )
    if enroll_res.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="You must enroll in the course to study this lesson")

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
    # Update streak (in-memory fields)
    # read tz offset header if present (minutes offset from UTC)
    tz_offset = None
    try:
        hdr = request.headers.get('x-user-tz-offset') or request.headers.get('x-tz-offset')
        if hdr is not None:
            tz_offset = int(hdr)
    except Exception:
        tz_offset = None

    streak_info = update_streak(current_user, tz_offset)

    # Persist today's completion into StreakWeek for the current week using user-local date
    try:
        if tz_offset is not None:
            now = datetime.utcnow() + timedelta(minutes=tz_offset)
            today_local = now.date()
        else:
            today_local = date.today()

        monday = today_local - timedelta(days=today_local.weekday())
        week_start = monday.isoformat()
        today_idx = today_local.weekday()

        sw_res = await db.execute(select(StreakWeek).where(StreakWeek.user_id == current_user.id, StreakWeek.week_start == week_start))
        sw_entry = sw_res.scalar_one_or_none()
        if sw_entry:
            days = sw_entry.days or [False]*7
            if 0 <= today_idx < 7:
                days[today_idx] = True
            sw_entry.days = days
        else:
            days = [False]*7
            if 0 <= today_idx < 7:
                days[today_idx] = True
            sw_entry = StreakWeek(user_id=current_user.id, week_start=week_start, days=days)
            db.add(sw_entry)
    except Exception:
        # don't break step completion on streak persistence errors
        pass

    await db.commit()
    
    return {
        "success": True,
        "xp_earned": xp_earned,
        "total_xp": current_user.xp,
        "streak": streak_info
    }


@router.post("/{step_id}/slides/{slide_id}/complete")
async def complete_slide(
    step_id: int,
    slide_id: int,
    data: SlideCompleteRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify step and slide
    result = await db.execute(
        select(Step)
        .options(selectinload(Step.chapter).selectinload(Chapter.story))
        .where(Step.id == step_id)
    )
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    slide_res = await db.execute(select(Slide).where(Slide.id == slide_id, Slide.step_id == step_id))
    slide = slide_res.scalar_one_or_none()
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")

    # Require enrollment
    enroll_res = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.story_id == step.chapter.story_id
        )
    )
    if enroll_res.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="You must enroll in the course to study this lesson")

    # Check if already completed
    sp_res = await db.execute(
        select(SlideProgress).where(
            SlideProgress.user_id == current_user.id,
            SlideProgress.slide_id == slide_id
        )
    )
    sp = sp_res.scalar_one_or_none()

    xp_earned = 0
    if sp is None:
        sp = SlideProgress(
            user_id=current_user.id,
            slide_id=slide_id,
            xp_earned=data.xp,
            completed_at=datetime.utcnow()
        )
        db.add(sp)
        xp_earned = data.xp or 0
        current_user.xp += xp_earned
        # Update streak (in-memory) and persist to streak_weeks
        tz_offset = None
        try:
            hdr = request.headers.get('x-user-tz-offset') or request.headers.get('x-tz-offset')
            if hdr is not None:
                tz_offset = int(hdr)
        except Exception:
            tz_offset = None

        streak_info = update_streak(current_user, tz_offset)
        try:
            if tz_offset is not None:
                now = datetime.utcnow() + timedelta(minutes=tz_offset)
                today_local = now.date()
            else:
                today_local = date.today()
            monday = today_local - timedelta(days=today_local.weekday())
            week_start = monday.isoformat()
            today_idx = today_local.weekday()
            sw_res = await db.execute(select(StreakWeek).where(StreakWeek.user_id == current_user.id, StreakWeek.week_start == week_start))
            sw_entry = sw_res.scalar_one_or_none()
            if sw_entry:
                days = sw_entry.days or [False]*7
                if 0 <= today_idx < 7:
                    days[today_idx] = True
                sw_entry.days = days
            else:
                days = [False]*7
                if 0 <= today_idx < 7:
                    days[today_idx] = True
                sw_entry = StreakWeek(user_id=current_user.id, week_start=week_start, days=days)
                db.add(sw_entry)
        except Exception:
            pass
        await db.commit()
    else:
        # already completed — idempotent
        xp_earned = 0

    return {
        "success": True,
        "xp_earned": xp_earned,
        "total_xp": current_user.xp
    }
