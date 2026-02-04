-- ============================================
-- CALCULUS INTERACTIVE LEARNING PLATFORM
-- Database Schema (PostgreSQL/SQLite compatible)
-- ============================================

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200),
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'student' -- 'student', 'teacher', 'admin'
);

CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 2. CONTENT STRUCTURE: Story > Chapter > Step
-- ============================================

CREATE TABLE stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(500),
    difficulty_level VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
    estimated_hours DECIMAL(5,2),
    category VARCHAR(100),
    tags TEXT, -- JSON array of tags
    is_published BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL,
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    unlock_condition TEXT, -- JSON: {"type": "complete_chapter", "chapter_id": 1}
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE(story_id, slug)
);

CREATE TABLE steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    step_type VARCHAR(50) DEFAULT 'lesson', -- 'lesson', 'quiz', 'practice', 'challenge'
    sort_order INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 10,
    estimated_minutes INTEGER DEFAULT 5,
    unlock_condition TEXT, -- JSON: {"type": "complete_step", "step_id": 1}
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    UNIQUE(chapter_id, slug)
);

-- ============================================
-- 3. SLIDE SYSTEM (Presentation Engine)
-- ============================================

CREATE TABLE slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    step_id INTEGER NOT NULL,
    slide_number INTEGER NOT NULL,
    title VARCHAR(255),
    slide_data TEXT NOT NULL, -- JSON containing all slide content & blocks
    transition_type VARCHAR(50) DEFAULT 'fade', -- 'fade', 'slide', 'zoom'
    background_color VARCHAR(20) DEFAULT '#ffffff',
    background_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE,
    UNIQUE(step_id, slide_number)
);

-- Slide blocks stored separately for easier querying
CREATE TABLE slide_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slide_id INTEGER NOT NULL,
    block_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'code', 'math', 'quiz', 'drag_drop', 'input', 'video'
    block_data TEXT NOT NULL, -- JSON with block-specific content
    position_x DECIMAL(5,2) DEFAULT 0,
    position_y DECIMAL(5,2) DEFAULT 0,
    width DECIMAL(5,2) DEFAULT 100,
    height DECIMAL(5,2),
    sort_order INTEGER DEFAULT 0,
    animation_type VARCHAR(50), -- 'fadeIn', 'slideUp', 'bounce', etc.
    animation_delay INTEGER DEFAULT 0, -- milliseconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE
);

-- Quiz/Exercise answers storage
CREATE TABLE quiz_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER NOT NULL,
    answer_data TEXT NOT NULL, -- JSON: correct answers, explanations
    points INTEGER DEFAULT 1,
    FOREIGN KEY (block_id) REFERENCES slide_blocks(id) ON DELETE CASCADE
);

-- ============================================
-- 4. USER PROGRESS TRACKING
-- ============================================

CREATE TABLE user_story_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    story_id INTEGER NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    progress_percent DECIMAL(5,2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE(user_id, story_id)
);

CREATE TABLE user_chapter_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    progress_percent DECIMAL(5,2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    UNIQUE(user_id, chapter_id)
);

CREATE TABLE user_step_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    step_id INTEGER NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    current_slide INTEGER DEFAULT 1,
    score DECIMAL(5,2),
    attempts INTEGER DEFAULT 1,
    time_spent_seconds INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE,
    UNIQUE(user_id, step_id)
);

-- Track individual quiz/exercise answers
CREATE TABLE user_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    block_id INTEGER NOT NULL,
    answer_data TEXT NOT NULL, -- JSON: user's submitted answer
    is_correct BOOLEAN,
    score DECIMAL(5,2),
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (block_id) REFERENCES slide_blocks(id) ON DELETE CASCADE
);

-- ============================================
-- 5. GAMIFICATION: Streaks, XP, Achievements
-- ============================================

CREATE TABLE user_streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    streak_freeze_count INTEGER DEFAULT 0, -- Free streak freezes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_xp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    xp_this_week INTEGER DEFAULT 0,
    xp_this_month INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE xp_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'step_complete', 'streak_bonus', 'achievement', 'challenge'
    source_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    badge_color VARCHAR(20),
    xp_reward INTEGER DEFAULT 0,
    achievement_type VARCHAR(50), -- 'streak', 'completion', 'skill', 'social'
    requirement_data TEXT, -- JSON: {"type": "streak_days", "value": 7}
    is_hidden BOOLEAN DEFAULT FALSE, -- Secret achievements
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_id INTEGER NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE(user_id, achievement_id)
);

-- ============================================
-- 6. SOCIAL: Friends & Leaderboard
-- ============================================

CREATE TABLE friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, friend_id)
);

CREATE TABLE leaderboard_weekly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start DATE NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    steps_completed INTEGER DEFAULT 0,
    rank INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, week_start)
);

-- ============================================
-- 7. DAILY ACTIVITY LOG
-- ============================================

CREATE TABLE daily_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_date DATE NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    steps_completed INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, activity_date)
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);

CREATE INDEX idx_stories_slug ON stories(slug);
CREATE INDEX idx_stories_category ON stories(category);
CREATE INDEX idx_chapters_story ON chapters(story_id);
CREATE INDEX idx_steps_chapter ON steps(chapter_id);
CREATE INDEX idx_slides_step ON slides(step_id);
CREATE INDEX idx_blocks_slide ON slide_blocks(slide_id);

CREATE INDEX idx_progress_user_story ON user_story_progress(user_id, story_id);
CREATE INDEX idx_progress_user_chapter ON user_chapter_progress(user_id, chapter_id);
CREATE INDEX idx_progress_user_step ON user_step_progress(user_id, step_id);

CREATE INDEX idx_xp_user ON user_xp(user_id);
CREATE INDEX idx_streaks_user ON user_streaks(user_id);
CREATE INDEX idx_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_friendships_user ON friendships(user_id, status);
CREATE INDEX idx_leaderboard_week ON leaderboard_weekly(week_start, xp_earned DESC);
CREATE INDEX idx_daily_activity ON daily_activity(user_id, activity_date);

-- ============================================
-- 9. SAMPLE ACHIEVEMENTS DATA
-- ============================================

INSERT INTO achievements (slug, title, description, icon_url, badge_color, xp_reward, achievement_type, requirement_data, sort_order) VALUES
('first_step', 'First Step', 'Complete your first lesson step', '/icons/achievements/first-step.svg', '#4CAF50', 10, 'completion', '{"type": "steps_completed", "value": 1}', 1),
('week_warrior', 'Week Warrior', 'Maintain a 7-day streak', '/icons/achievements/week-warrior.svg', '#2196F3', 50, 'streak', '{"type": "streak_days", "value": 7}', 2),
('month_master', 'Month Master', 'Maintain a 30-day streak', '/icons/achievements/month-master.svg', '#9C27B0', 200, 'streak', '{"type": "streak_days", "value": 30}', 3),
('chapter_champion', 'Chapter Champion', 'Complete your first chapter', '/icons/achievements/chapter-champion.svg', '#FF9800', 30, 'completion', '{"type": "chapters_completed", "value": 1}', 4),
('story_sage', 'Story Sage', 'Complete your first story', '/icons/achievements/story-sage.svg', '#E91E63', 100, 'completion', '{"type": "stories_completed", "value": 1}', 5),
('social_butterfly', 'Social Butterfly', 'Add 5 friends', '/icons/achievements/social.svg', '#00BCD4', 25, 'social', '{"type": "friends_count", "value": 5}', 6),
('perfectionist', 'Perfectionist', 'Score 100% on 10 quizzes', '/icons/achievements/perfect.svg', '#FFD700', 75, 'skill', '{"type": "perfect_quizzes", "value": 10}', 7),
('speed_learner', 'Speed Learner', 'Complete 5 steps in one day', '/icons/achievements/speed.svg', '#F44336', 40, 'skill', '{"type": "steps_per_day", "value": 5}', 8),
('xp_hunter', 'XP Hunter', 'Earn 1000 XP total', '/icons/achievements/xp-hunter.svg', '#673AB7', 50, 'completion', '{"type": "total_xp", "value": 1000}', 9),
('top_ten', 'Top 10', 'Reach top 10 on weekly leaderboard', '/icons/achievements/top-ten.svg', '#FF5722', 100, 'social', '{"type": "leaderboard_rank", "value": 10}', 10);
