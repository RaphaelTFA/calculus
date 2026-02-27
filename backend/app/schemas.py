from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Auth
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember: Optional[bool] = False

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    xp: int
    current_streak: int
    longest_streak: int
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

# Stories
class StepResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    xp_reward: int
    is_completed: bool = False
    is_current: bool = False
    
    class Config:
        from_attributes = True

class ChapterResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    steps: list[StepResponse] = []
    
    class Config:
        from_attributes = True

class StoryListResponse(BaseModel):
    id: int
    slug: str
    title: str
    thumbnail_url: Optional[str] = None
    illustration: Optional[str] = None
    description: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    category_name: Optional[str]
    chapter_count: int = 0
    exercises: int = 0
    progress: int = 0
    is_enrolled: bool = False
    is_completed: bool = False
    
    class Config:
        from_attributes = True

class StoryDetailResponse(StoryListResponse):
    chapters: list[ChapterResponse] = []

# Steps
class StepDetailResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    chapter_title: str
    story_slug: str
    xp_reward: int
    
    class Config:
        from_attributes = True

class SlideResponse(BaseModel):
    id: int
    order_index: int
    blocks: list
    
    class Config:
        from_attributes = True

# Progress
class DashboardResponse(BaseModel):
    current_story: Optional[StoryDetailResponse]
    in_progress_stories: list[StoryDetailResponse] = []
    total_xp: int
    level: int
    next_level_xp: int

class StepCompleteRequest(BaseModel):
    score: int = 100
    time_spent_seconds: int = 0


class SlideCompleteRequest(BaseModel):
    xp: int = 0
    time_spent_seconds: int = 0

# Achievements
class AchievementResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    icon: Optional[str]
    category: Optional[str]
    rarity: str
    xp_reward: int
    is_earned: bool = False
    earned_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# User Stats
class UserStatsResponse(BaseModel):
    total_xp: int
    level: int
    xp_to_next_level: int
    current_streak: int
    longest_streak: int
    completed_steps: int
    completed_stories: int
    enrolled_stories: int
    total_time_spent: int  # in seconds
    achievements_earned: int
    total_achievements: int

class UserProgressResponse(BaseModel):
    stats: UserStatsResponse
    achievements: list[AchievementResponse]
    recent_activity: list[dict]


class LeaderboardEntry(BaseModel):
    id: int
    rank: int
    username: str
    xp: int


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]
    current_user_rank: Optional[int] = None
    total_count: Optional[int] = None


class StreakWeekRequest(BaseModel):
    week_start: Optional[str] = None  # YYYY-MM-DD (optional, default to current week)
    days: list[bool]


class StreakWeekResponse(BaseModel):
    week_start: str
    days: list[bool]
    # computed fields
    current_streak: int = 0
    longest_streak: int = 0
    today_index: int = 0
    today_completed: bool = False

    class Config:
        from_attributes = True

# Generic
class SuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None

class APIResponse(BaseModel):
    data: Optional[dict | list] = None
    error: Optional[dict] = None

class UpdateProfile(BaseModel):
    display_name: Optional[str] = None
    
class ChangePassword(BaseModel):
    old_password: str
    new_password: str