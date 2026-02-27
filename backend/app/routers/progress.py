from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from app.database import get_db
from app.models import User, Enrollment, Story, Step, StepProgress, Chapter, Achievement, UserAchievement
from app.schemas import (
    DashboardResponse, StoryDetailResponse, ChapterResponse, StepResponse,
    UserStatsResponse, UserProgressResponse, AchievementResponse
)
from app.schemas import LeaderboardResponse
from app.auth import get_current_user
from app.routers.stories import calculate_story_progress
import logging
from datetime import date, timedelta, datetime, time
from app.models import StreakWeek, SlideProgress
from app.schemas import StreakWeekRequest, StreakWeekResponse
from sqlalchemy import select

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    start: int = 1,
    limit: int = 30,
    around: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return leaderboard entries ordered by XP descending."""
    if start < 1:
        start = 1
    if limit < 1 or limit > 200:
        limit = 30

    # Total users count
    total_result = await db.execute(select(func.count(User.id)))
    total_count = total_result.scalar() or 0

    # If client requests leaderboard centered around current user, compute their rank
    current_user_rank = None
    if around:
        higher_result = await db.execute(
            select(func.count(User.id)).where(User.xp > (current_user.xp or 0))
        )
        higher_count = higher_result.scalar() or 0
        current_user_rank = int(higher_count) + 1

        # center the returned page around the user's rank
        half = max(0, limit // 2)
        start = max(1, current_user_rank - half)

    offset = start - 1
    result = await db.execute(
        select(User).order_by(User.xp.desc()).offset(offset).limit(limit)
    )
    users = result.scalars().all()

    entries = []
    for idx, u in enumerate(users):
        entries.append({
            'id': u.id,
            'rank': start + idx,
            'username': u.display_name or u.username,
            'xp': u.xp or 0
        })

    return LeaderboardResponse(entries=entries, current_user_rank=current_user_rank, total_count=total_count)

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all enrollments
    result = await db.execute(
        select(Enrollment)
        .where(Enrollment.user_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    enrollments = result.scalars().all()
    
    if not enrollments:
        level = current_user.xp // 100 + 1
        next_level_xp = level * 100
        return DashboardResponse(
            current_story=None,
            in_progress_stories=[],
            total_xp=current_user.xp,
            level=level,
            next_level_xp=next_level_xp
        )
    
    # Get all story IDs from enrollments
    story_ids = [e.story_id for e in enrollments]
    
    # Batch load all stories with chapters and steps in ONE query
    stories_result = await db.execute(
        select(Story)
        .options(
            selectinload(Story.chapters).selectinload(Chapter.steps).selectinload(Step.slides),
            joinedload(Story.category)
        )
        .where(Story.id.in_(story_ids))
    )
    stories_map = {s.id: s for s in stories_result.unique().scalars().all()}
    
    # Get completed steps for user (single query)
    progress_result = await db.execute(
        select(StepProgress.step_id).where(
            StepProgress.user_id == current_user.id,
            StepProgress.is_completed == True
        )
    )
    completed_steps = set(progress_result.scalars().all())
    
    current_story = None
    in_progress_stories = []
    
    for idx, enrollment in enumerate(enrollments):
        story = stories_map.get(enrollment.story_id)
        if not story:
            continue
            
        # Calculate progress in-memory (no extra queries!)
        total_steps = sum(len(ch.steps) for ch in story.chapters)
        story_step_ids = {step.id for ch in story.chapters for step in ch.steps}
        completed_count = len(completed_steps & story_step_ids)
        progress = int((completed_count / total_steps) * 100) if total_steps > 0 else 0
        
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
        
        logger.debug(f"[progress.get_dashboard] slug={story.slug} illustration={story.illustration!r} thumbnail_url={story.thumbnail_url!r}")

        # Count exercises (quiz blocks) from preloaded slides
        exercises_count = 0
        for ch in getattr(story, 'chapters', []) or []:
            for st in getattr(ch, 'steps', []) or []:
                for slide in getattr(st, 'slides', []) or []:
                    blocks = slide.blocks or []
                    if not isinstance(blocks, list):
                        continue
                    for b in blocks:
                        if not isinstance(b, dict):
                            continue
                        if b.get('type') == 'quiz' or b.get('block_type') == 'quiz':
                            exercises_count += 1

        story_response = StoryDetailResponse(
            id=story.id,
            slug=story.slug,
            title=story.title,
            thumbnail_url=story.thumbnail_url,
            illustration=story.illustration,
            description=story.description,
            icon=story.icon,
            color=story.color,
            category_name=story.category.name if story.category else None,
            chapter_count=len(chapters),
            exercises=exercises_count,
            progress=progress,
            is_enrolled=True,
            chapters=chapters
        )
        
        # First enrollment is the current story
        if idx == 0:
            current_story = story_response
        
        # Add to in_progress list if not 100% complete
        if progress < 100:
            in_progress_stories.append(story_response)
    
    level = current_user.xp // 100 + 1
    next_level_xp = level * 100
    
    return DashboardResponse(
        current_story=current_story,
        in_progress_stories=in_progress_stories,
        total_xp=current_user.xp,
        level=level,
        next_level_xp=next_level_xp
    )


@router.get('/streak-week', response_model=StreakWeekResponse)
async def get_streak_week(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
    week_start: str | None = None,
    tz_offset_minutes: int | None = None
):
    """Return the user's streak days for the requested week (YYYY-MM-DD Monday). If not present, return defaults."""
    # Determine week_start: if provided use it, otherwise compute current week's Monday
    # prefer explicit query param, otherwise try header 'x-user-tz-offset'
    if tz_offset_minutes is None and request is not None:
        try:
            hdr = request.headers.get('x-user-tz-offset') or request.headers.get('x-tz-offset')
            if hdr is not None:
                tz_offset_minutes = int(hdr)
        except Exception:
            tz_offset_minutes = None

    # compute user's local today using tz offset if provided
    if tz_offset_minutes is not None:
        today_local = (datetime.utcnow() + timedelta(minutes=tz_offset_minutes)).date()
    else:
        today_local = date.today()

    if not week_start:
        # Python weekday(): Monday==0
        monday = today_local - timedelta(days=today_local.weekday())
        week_start = monday.isoformat()

    result = await db.execute(
        select(StreakWeek).where(StreakWeek.user_id == current_user.id, StreakWeek.week_start == week_start)
    )
    entry = result.scalar_one_or_none()

    # helper to compute current streak by looking at this week and previous week(s)
    def compute_current_streak_from(week_days, week_start_date):
        # week_days: list[bool] for Mon..Sun
        # start from today if this is current week, or from last true day otherwise
        streak_count = 0
        # determine today's index relative to week_start_date using user-local today
        monday = today_local - timedelta(days=today_local.weekday())
        is_current_week = (monday.isoformat() == week_start_date)
        today_idx = (today_local.weekday()) if is_current_week else 6
        i = today_idx
        # count backwards within this week's days
        while i >= 0 and i < len(week_days) and week_days[i]:
            streak_count += 1
            i -= 1

        # if we reached before Monday (i < 0) and still want to continue streak,
        # check previous week(s) - simple single previous week lookup
        if i < 0:
            prev_monday = (date.fromisoformat(week_start_date) - timedelta(days=7)).isoformat()
            prev_res = db.execute(select(StreakWeek).where(StreakWeek.user_id == current_user.id, StreakWeek.week_start == prev_monday))
            prev_entry = (prev_res).scalar_one_or_none()
            if prev_entry and isinstance(prev_entry.days, list):
                j = 6
                while j >= 0 and prev_entry.days[j]:
                    streak_count += 1
                    j -= 1

        return streak_count, today_idx if is_current_week else None

    # Determine activity-derived days for the week (from StepProgress and SlideProgress)
    week_start_date = date.fromisoformat(week_start)
    start_dt = datetime.combine(week_start_date, time.min)
    end_dt = datetime.combine(week_start_date + timedelta(days=7), time.min)

    activity_days = [False] * 7
    try:
        sp_res = await db.execute(
            select(StepProgress.completed_at).where(
                StepProgress.user_id == current_user.id,
                StepProgress.is_completed == True,
                StepProgress.completed_at >= start_dt,
                StepProgress.completed_at < end_dt
            )
        )
        for dtval in sp_res.scalars().all():
            if not dtval:
                continue
            d = dtval.date()
            if week_start_date <= d < week_start_date + timedelta(days=7):
                activity_days[d.weekday()] = True

        sl_res = await db.execute(
            select(SlideProgress.completed_at).where(
                SlideProgress.user_id == current_user.id,
                SlideProgress.completed_at >= start_dt,
                SlideProgress.completed_at < end_dt
            )
        )
        for dtval in sl_res.scalars().all():
            if not dtval:
                continue
            d = dtval.date()
            if week_start_date <= d < week_start_date + timedelta(days=7):
                activity_days[d.weekday()] = True
    except Exception:
        activity_days = [False] * 7

    days_arr = [False] * 7
    if entry and isinstance(entry.days, list) and len(entry.days) == 7:
        # merge persisted days with activity-derived days (persisted OR activity)
        days_arr = [bool(entry.days[i]) or bool(activity_days[i]) for i in range(7)]
    else:
        # use activity-derived days if no persisted entry
        days_arr = activity_days

    # compute today's index (relative to Monday=0..Sunday=6) using user-local today
    today_idx = today_local.weekday()  # Monday==0

    # determine whether today is completed: prefer persisted days, fallback to last_activity_date
    today_completed = False
    if 0 <= today_idx < len(days_arr):
        today_completed = bool(days_arr[today_idx])
    # fallback: if user.last_activity_date in user-local date equals today, consider today completed
    if not today_completed and current_user.last_activity_date:
        try:
            lad = current_user.last_activity_date
            if tz_offset_minutes is not None:
                lad_local = lad + timedelta(minutes=tz_offset_minutes)
                if lad_local.date() == today_local:
                    today_completed = True
            else:
                if lad.date() == today_local:
                    today_completed = True
        except Exception:
            pass

    # compute current streak by counting consecutive trues up to today (and previous week)
    current_streak = 0
    # Count backwards in this week
    i = today_idx
    while i >= 0 and days_arr[i]:
        current_streak += 1
        i -= 1
    # if we went past Monday, check previous week (relative to user-local today)
    if i < 0:
        prev_monday = (today_local - timedelta(days=7 + today_local.weekday())).isoformat()
        prev_result = await db.execute(select(StreakWeek).where(StreakWeek.user_id == current_user.id, StreakWeek.week_start == prev_monday))
        prev_entry = prev_result.scalar_one_or_none()
        if prev_entry and isinstance(prev_entry.days, list):
            j = 6
            while j >= 0 and prev_entry.days[j]:
                current_streak += 1
                j -= 1

    # If persisted/activity days don't indicate a streak but user's scalar counters do, prefer the user's counter
    if (current_user.current_streak or 0) > current_streak:
        current_streak = current_user.current_streak or 0

    longest = current_user.longest_streak or 0

    return StreakWeekResponse(
        week_start=week_start,
        days=days_arr,
        current_streak=current_streak,
        longest_streak=longest,
        today_index=today_idx,
        today_completed=today_completed
    )


@router.post('/streak-week', response_model=StreakWeekResponse)
async def post_streak_week(
    payload: StreakWeekRequest,
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tz_offset_minutes: int | None = None
):
    """Create or update the streak days for a user for a given week."""
    week_start = payload.week_start
    # prefer explicit query param, otherwise try header
    if tz_offset_minutes is None and request is not None:
        try:
            hdr = request.headers.get('x-user-tz-offset') or request.headers.get('x-tz-offset')
            if hdr is not None:
                tz_offset_minutes = int(hdr)
        except Exception:
            tz_offset_minutes = None

    if not week_start:
        if tz_offset_minutes is not None:
            today_local = (datetime.utcnow() + timedelta(minutes=tz_offset_minutes)).date()
        else:
            today_local = date.today()
        monday = today_local - timedelta(days=today_local.weekday())
        week_start = monday.isoformat()

    days = payload.days or [False]*7

    result = await db.execute(
        select(StreakWeek).where(StreakWeek.user_id == current_user.id, StreakWeek.week_start == week_start)
    )
    entry = result.scalar_one_or_none()
    if entry:
        entry.days = days
    else:
        entry = StreakWeek(user_id=current_user.id, week_start=week_start, days=days)
        db.add(entry)

    # After updating, if this is the current week, recompute current and longest streak
    today = date.today()
    current_week_monday = (today - timedelta(days=today.weekday())).isoformat()
    if week_start == current_week_monday:
        # compute consecutive days up to today in this week
        today_idx = today.weekday()
        current = 0
        i = today_idx
        while i >= 0 and i < len(days) and days[i]:
            current += 1
            i -= 1

        # continue into previous week if needed
        if i < 0:
            prev_monday = (today - timedelta(days=7 + today.weekday())).isoformat()
            prev_result = await db.execute(select(StreakWeek).where(StreakWeek.user_id == current_user.id, StreakWeek.week_start == prev_monday))
            prev_entry = prev_result.scalar_one_or_none()
            if prev_entry and isinstance(prev_entry.days, list):
                j = 6
                while j >= 0 and prev_entry.days[j]:
                    current += 1
                    j -= 1

        # update user's streak counters
        current_user.current_streak = current
        if (current_user.longest_streak or 0) < current:
            current_user.longest_streak = current
        db.add(current_user)

    await db.commit()

    # prepare response payload
    today_idx = date.today().weekday()
    today_completed = bool(days[today_idx]) if 0 <= today_idx < len(days) else False
    longest = current_user.longest_streak or 0
    # compute current streak to return (mirror above)
    current = current_user.current_streak or 0

    return StreakWeekResponse(
        week_start=week_start,
        days=days,
        current_streak=current,
        longest_streak=longest,
        today_index=today_idx,
        today_completed=today_completed
    )


@router.get("/stats", response_model=UserProgressResponse)
async def get_user_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed user stats, achievements and recent activity"""
    
    # Completed steps count
    completed_steps_result = await db.execute(
        select(func.count(StepProgress.id)).where(
            StepProgress.user_id == current_user.id,
            StepProgress.is_completed == True
        )
    )
    completed_steps = completed_steps_result.scalar() or 0
    
    # Total time spent
    time_result = await db.execute(
        select(func.sum(StepProgress.time_spent_seconds)).where(
            StepProgress.user_id == current_user.id
        )
    )
    total_time_spent = time_result.scalar() or 0
    
    # Enrolled stories count
    enrolled_result = await db.execute(
        select(func.count(Enrollment.id)).where(
            Enrollment.user_id == current_user.id
        )
    )
    enrolled_stories = enrolled_result.scalar() or 0
    
    # Completed stories (100% progress)
    completed_stories = 0
    enrollments_result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    for enrollment in enrollments_result.scalars().all():
        progress = await calculate_story_progress(db, current_user.id, enrollment.story_id)
        if progress >= 100:
            completed_stories += 1
    
    # All achievements
    all_achievements_result = await db.execute(select(Achievement))
    all_achievements = all_achievements_result.scalars().all()
    
    # User's earned achievements
    earned_result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == current_user.id)
    )
    earned_achievements = {ua.achievement_id: ua.earned_at for ua in earned_result.scalars().all()}
    
    # Build achievements list
    achievements = []
    for ach in all_achievements:
        achievements.append(AchievementResponse(
            id=ach.id,
            title=ach.title,
            description=ach.description,
            icon=ach.icon,
            category=ach.category,
            rarity=ach.rarity,
            xp_reward=ach.xp_reward,
            is_earned=ach.id in earned_achievements,
            earned_at=earned_achievements.get(ach.id)
        ))
    
    # Recent activity (last 10 completed steps)
    recent_result = await db.execute(
        select(StepProgress)
        .options(selectinload(StepProgress.step))
        .where(
            StepProgress.user_id == current_user.id,
            StepProgress.is_completed == True
        )
        .order_by(StepProgress.completed_at.desc())
        .limit(10)
    )
    recent_progress = recent_result.scalars().all()
    
    recent_activity = []
    for p in recent_progress:
        recent_activity.append({
            "type": "step_completed",
            "step_id": p.step_id,
            "step_title": p.step.title if p.step else "Unknown",
            "xp_earned": p.step.xp_reward if p.step else 0,
            "completed_at": p.completed_at.isoformat() if p.completed_at else None
        })
    
    # Calculate level
    level = current_user.xp // 100 + 1
    xp_to_next = (level * 100) - current_user.xp
    
    stats = UserStatsResponse(
        total_xp=current_user.xp,
        level=level,
        xp_to_next_level=xp_to_next,
        current_streak=current_user.current_streak,
        longest_streak=current_user.longest_streak,
        completed_steps=completed_steps,
        completed_stories=completed_stories,
        enrolled_stories=enrolled_stories,
        total_time_spent=total_time_spent,
        achievements_earned=len(earned_achievements),
        total_achievements=len(all_achievements)
    )
    
    return UserProgressResponse(
        stats=stats,
        achievements=achievements,
        recent_activity=recent_activity
    )


@router.post("/check-achievements")
async def check_and_award_achievements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check and award any achievements the user has earned"""
    
    # Get all achievements not yet earned by user
    subquery = select(UserAchievement.achievement_id).where(
        UserAchievement.user_id == current_user.id
    )
    result = await db.execute(
        select(Achievement).where(Achievement.id.notin_(subquery))
    )
    unearned = result.scalars().all()
    
    # Get user stats for checking
    completed_steps_result = await db.execute(
        select(func.count(StepProgress.id)).where(
            StepProgress.user_id == current_user.id,
            StepProgress.is_completed == True
        )
    )
    completed_steps = completed_steps_result.scalar() or 0
    
    completed_stories = 0
    enrollments_result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    for enrollment in enrollments_result.scalars().all():
        progress = await calculate_story_progress(db, current_user.id, enrollment.story_id)
        if progress >= 100:
            completed_stories += 1
    
    # Check each unearned achievement
    newly_earned = []
    for ach in unearned:
        earned = False
        
        if ach.requirement_type == "xp" and current_user.xp >= ach.requirement_value:
            earned = True
        elif ach.requirement_type == "steps" and completed_steps >= ach.requirement_value:
            earned = True
        elif ach.requirement_type == "streak" and current_user.current_streak >= ach.requirement_value:
            earned = True
        elif ach.requirement_type == "stories" and completed_stories >= ach.requirement_value:
            earned = True
        
        if earned:
            user_ach = UserAchievement(
                user_id=current_user.id,
                achievement_id=ach.id
            )
            db.add(user_ach)
            current_user.xp += ach.xp_reward
            newly_earned.append({
                "id": ach.id,
                "title": ach.title,
                "icon": ach.icon,
                "xp_reward": ach.xp_reward
            })
    
    if newly_earned:
        await db.commit()
    
    return {
        "newly_earned": newly_earned,
        "total_xp": current_user.xp
    }
