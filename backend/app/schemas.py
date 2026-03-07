from pydantic import BaseModel, Field, EmailStr
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
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: str = "male"
    skin_color: str = "#F3C9A0"
    equipped_items: dict = Field(default_factory=dict)
    xp: int
    coins: int = 0
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
    coins: int = 0
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
    coin_reward: int = 0
    is_earned: bool = False
    earned_at: Optional[datetime] = None
    requirement_type: Optional[str] = None
    requirement_value: Optional[int] = None

    class Config:
        from_attributes = True

# User Stats
class UserStatsResponse(BaseModel):
    total_xp: int
    coins: int = 0
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


class VerificationEmailRequest(BaseModel):
    email: EmailStr


# Shop
class ShopItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    icon: Optional[str]
    price: int
    item_type: str
    effect_value: int
    is_active: bool
    order_index: int

    class Config:
        from_attributes = True


class BuyItemResponse(BaseModel):
    success: bool
    item: ShopItemResponse
    coins_spent: int
    remaining_coins: int
    message: Optional[str] = None


class InventoryItemResponse(BaseModel):
    id: int
    item: ShopItemResponse
    quantity: int
    acquired_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True


# Quests
class QuestResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    quest_type: str
    requirement_type: str
    requirement_value: int
    coin_reward: int
    icon: Optional[str]

    class Config:
        from_attributes = True


class UserQuestResponse(BaseModel):
    id: int
    quest: QuestResponse
    progress: int
    is_complete: bool
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    coins_claimed: bool

    class Config:
        from_attributes = True


class ClaimQuestResponse(BaseModel):
    success: bool
    coins_awarded: int
    total_coins: int
    message: Optional[str] = None