from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from app.database import get_db
from app.models import User, Enrollment, Story, Step, StepProgress, Chapter, Achievement, UserAchievement
from app.schemas import (
    DashboardResponse, StoryDetailResponse, ChapterResponse, StepResponse,
    UserStatsResponse, UserProgressResponse, AchievementResponse
)
from app.auth import get_current_user
from app.routers.stories import calculate_story_progress

router = APIRouter(prefix="/progress", tags=["progress"])

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
        
<<<<<<< HEAD
=======
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
