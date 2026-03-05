from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100))
    avatar_url = Column(String(255))
    gender = Column(String(10), default="male")
    skin_color = Column(String(7), default="#F3C9A0")
    equipped_items = Column(JSON, default=dict)
    xp = Column(Integer, default=0)
    coins = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    enrollments = relationship("Enrollment", back_populates="user")
    progress = relationship("StepProgress", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")


class StreakWeek(Base):
    __tablename__ = "streak_weeks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD (Monday)
    days = Column(JSON, default=list)  # list of booleans for Mon..Sun
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # lightweight relationship
    user = relationship("User")


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True)
    icon = Column(String(10))
    
    stories = relationship("Story", back_populates="category")


class Story(Base):
    __tablename__ = "stories"
    
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    thumbnail_url = Column(String, nullable=True)
    illustration = Column(String, nullable=True)
    description = Column(Text)
    icon = Column(String(10))
    color = Column(String(100))
    category_id = Column(Integer, ForeignKey("categories.id"))
    difficulty = Column(String(20), default="beginner")
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    
    category = relationship("Category", back_populates="stories")
    chapters = relationship("Chapter", back_populates="story", order_by="Chapter.order_index")
    enrollments = relationship("Enrollment", back_populates="story")


class Chapter(Base):
    __tablename__ = "chapters"
    
    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    order_index = Column(Integer, default=0)
    
    story = relationship("Story", back_populates="chapters")
    steps = relationship("Step", back_populates="chapter", order_by="Step.order_index")


class Step(Base):
    __tablename__ = "steps"
    
    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    xp_reward = Column(Integer, default=10)
    coin_reward = Column(Integer, default=5)
    order_index = Column(Integer, default=0)
    
    chapter = relationship("Chapter", back_populates="steps")
    slides = relationship("Slide", back_populates="step", order_by="Slide.order_index")
    progress = relationship("StepProgress", back_populates="step")


class Slide(Base):
    __tablename__ = "slides"
    
    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("steps.id"), nullable=False)
    order_index = Column(Integer, default=0)
    blocks = Column(JSON, default=list)
    
    step = relationship("Step", back_populates="slides")


class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    enrolled_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="enrollments")
    story = relationship("Story", back_populates="enrollments")


class StepProgress(Base):
    __tablename__ = "step_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    step_id = Column(Integer, ForeignKey("steps.id"), nullable=False)
    is_completed = Column(Boolean, default=False)
    score = Column(Integer, default=0)
    time_spent_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime)
    
    user = relationship("User", back_populates="progress")
    step = relationship("Step", back_populates="progress")


class SlideProgress(Base):
    __tablename__ = "slide_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slide_id = Column(Integer, ForeignKey("slides.id"), nullable=False)
    xp_earned = Column(Integer, default=0)
    completed_at = Column(DateTime)

    # relationships kept minimal to avoid circular imports


class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(10))
    category = Column(String(50))
    rarity = Column(String(20), default="common")
    xp_reward = Column(Integer, default=0)
    coin_reward = Column(Integer, default=0)
    requirement_type = Column(String(50))  # 'xp', 'steps', 'streak', 'stories'
    requirement_value = Column(Integer, default=0)
    
    user_achievements = relationship("UserAchievement", back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")


class ShopItem(Base):
    __tablename__ = "shop_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(10))
    price = Column(Integer, nullable=False)
    item_type = Column(String(50), nullable=False)  # streak_freeze, xp_boost, hint_token, avatar_frame, course_unlock
    effect_value = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)

    inventory = relationship("UserInventory", back_populates="item")


class UserInventory(Base):
    __tablename__ = "user_inventory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("shop_items.id"), nullable=False)
    quantity = Column(Integer, default=1)
    acquired_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User")
    item = relationship("ShopItem", back_populates="inventory")


class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    quest_type = Column(String(20), nullable=False)  # "daily" | "weekly" | "milestone"
    requirement_type = Column(String(50), nullable=False)  # "lessons", "quizzes", "streak", "slides", "study_time", "shop_buy", "chapter", "course"
    requirement_value = Column(Integer, default=1)
    coin_reward = Column(Integer, default=20)
    icon = Column(String(10), default="📋")
    is_active = Column(Boolean, default=True)

    user_quests = relationship("UserQuest", back_populates="quest")


class UserQuest(Base):
    __tablename__ = "user_quests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quest_id = Column(Integer, ForeignKey("quests.id"), nullable=False)
    progress = Column(Integer, default=0)
    is_complete = Column(Boolean, default=False)
    assigned_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    coins_claimed = Column(Boolean, default=False)

    user = relationship("User")
    quest = relationship("Quest", back_populates="user_quests")
