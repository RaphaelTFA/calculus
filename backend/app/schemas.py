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
    description: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    category_name: Optional[str]
    chapter_count: int = 0
    progress: int = 0
    is_enrolled: bool = False
    
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
    total_xp: int
    level: int
    next_level_xp: int

class StepCompleteRequest(BaseModel):
    score: int = 100
    time_spent_seconds: int = 0

# Generic
class SuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None

class APIResponse(BaseModel):
    data: Optional[dict | list] = None
    error: Optional[dict] = None
