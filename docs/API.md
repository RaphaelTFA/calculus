# Calculus Interactive Learning Platform - API Documentation

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication
All authenticated endpoints require the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication API

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "learner123",
  "display_name": "Happy Learner"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "learner123",
      "display_name": "Happy Learner",
      "role": "student",
      "created_at": "2026-02-04T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "learner123",
      "display_name": "Happy Learner",
      "avatar_url": "/avatars/default.png",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-02-11T10:30:00Z"
  }
}
```

### POST /auth/logout
Logout and invalidate token.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /auth/me
Get current user info.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "learner123",
    "display_name": "Happy Learner",
    "avatar_url": "/avatars/user1.png",
    "bio": "Learning calculus one step at a time!",
    "role": "student",
    "created_at": "2026-02-04T10:30:00Z"
  }
}
```

---

## 2. Stories API

### GET /stories
Get all published stories.

**Query Parameters:**
- `category` (optional): Filter by category
- `difficulty` (optional): Filter by difficulty level
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stories": [
      {
        "id": 1,
        "slug": "limits-and-continuity",
        "title": "Limits and Continuity",
        "description": "Master the foundation of calculus",
        "cover_image_url": "/covers/limits.jpg",
        "difficulty_level": "beginner",
        "estimated_hours": 8.5,
        "category": "calculus",
        "tags": ["limits", "continuity", "functions"],
        "chapters_count": 5,
        "user_progress": {
          "started": true,
          "progress_percent": 45.5,
          "completed": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "total_pages": 1
    }
  }
}
```

### GET /stories/:slug
Get a specific story with chapters.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "limits-and-continuity",
    "title": "Limits and Continuity",
    "description": "Master the foundation of calculus with interactive lessons",
    "cover_image_url": "/covers/limits.jpg",
    "difficulty_level": "beginner",
    "estimated_hours": 8.5,
    "category": "calculus",
    "tags": ["limits", "continuity", "functions"],
    "chapters": [
      {
        "id": 1,
        "slug": "introduction-to-limits",
        "title": "Introduction to Limits",
        "description": "What is a limit?",
        "sort_order": 1,
        "steps_count": 8,
        "is_locked": false,
        "user_progress": {
          "started": true,
          "progress_percent": 75.0,
          "completed": false
        }
      },
      {
        "id": 2,
        "slug": "limit-laws",
        "title": "Limit Laws",
        "description": "Rules for calculating limits",
        "sort_order": 2,
        "steps_count": 10,
        "is_locked": true,
        "unlock_condition": {
          "type": "complete_chapter",
          "chapter_id": 1
        }
      }
    ],
    "user_progress": {
      "started": true,
      "progress_percent": 45.5,
      "completed": false
    }
  }
}
```

---

## 3. Chapters API

### GET /chapters/:id
Get chapter with all steps.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "story_id": 1,
    "slug": "introduction-to-limits",
    "title": "Introduction to Limits",
    "description": "What is a limit?",
    "steps": [
      {
        "id": 1,
        "slug": "what-is-a-limit",
        "title": "What is a Limit?",
        "step_type": "lesson",
        "sort_order": 1,
        "xp_reward": 10,
        "estimated_minutes": 5,
        "is_locked": false,
        "user_progress": {
          "started": true,
          "completed": true,
          "score": 100,
          "xp_earned": 10
        }
      },
      {
        "id": 2,
        "slug": "limit-notation",
        "title": "Limit Notation",
        "step_type": "lesson",
        "sort_order": 2,
        "xp_reward": 10,
        "estimated_minutes": 7,
        "is_locked": false,
        "user_progress": {
          "started": true,
          "completed": false,
          "current_slide": 3
        }
      }
    ],
    "user_progress": {
      "started": true,
      "progress_percent": 62.5,
      "completed": false
    }
  }
}
```

---

## 4. Steps API

### GET /steps/:id
Get step with all slides.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "chapter_id": 1,
    "slug": "what-is-a-limit",
    "title": "What is a Limit?",
    "description": "Understanding the concept of limits",
    "step_type": "lesson",
    "xp_reward": 10,
    "estimated_minutes": 5,
    "slides_count": 6,
    "user_progress": {
      "started": true,
      "completed": false,
      "current_slide": 3,
      "time_spent_seconds": 180
    }
  }
}
```

### GET /steps/:id/slides
Get all slides for a step.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "slides": [
      {
        "id": 1,
        "slide_number": 1,
        "title": "Introduction",
        "transition_type": "fade",
        "background_color": "#ffffff",
        "blocks": [
          {
            "id": 1,
            "block_type": "text",
            "block_data": {
              "content": "# What is a Limit?\n\nIn mathematics, a **limit** describes the value that a function approaches as the input approaches some value.",
              "format": "markdown"
            },
            "position_x": 5,
            "position_y": 10,
            "width": 90,
            "animation_type": "fadeIn",
            "animation_delay": 0
          },
          {
            "id": 2,
            "block_type": "image",
            "block_data": {
              "src": "/images/limit-graph.png",
              "alt": "Graph showing limit concept",
              "caption": "A function approaching a limit"
            },
            "position_x": 20,
            "position_y": 50,
            "width": 60,
            "animation_type": "slideUp",
            "animation_delay": 500
          }
        ]
      },
      {
        "id": 2,
        "slide_number": 2,
        "title": "Mathematical Definition",
        "blocks": [
          {
            "id": 3,
            "block_type": "math",
            "block_data": {
              "latex": "\\lim_{x \\to a} f(x) = L",
              "display_mode": "block"
            },
            "position_x": 10,
            "position_y": 20,
            "width": 80,
            "animation_type": "fadeIn"
          },
          {
            "id": 4,
            "block_type": "text",
            "block_data": {
              "content": "This reads: \"The limit of f(x) as x approaches a equals L\"",
              "format": "plain"
            },
            "position_x": 10,
            "position_y": 50,
            "width": 80
          }
        ]
      }
    ]
  }
}
```

### POST /steps/:id/progress
Update progress for a step.

**Request Body:**
```json
{
  "current_slide": 4,
  "time_spent_seconds": 120
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "step_id": 1,
    "current_slide": 4,
    "time_spent_seconds": 300,
    "progress_percent": 66.67
  }
}
```

### POST /steps/:id/complete
Mark step as completed.

**Request Body:**
```json
{
  "score": 85.5,
  "time_spent_seconds": 420
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "step_completed": true,
    "score": 85.5,
    "xp_earned": 10,
    "streak_updated": true,
    "current_streak": 5,
    "achievements_unlocked": [
      {
        "id": 1,
        "slug": "first_step",
        "title": "First Step",
        "xp_reward": 10
      }
    ],
    "next_step": {
      "id": 2,
      "slug": "limit-notation",
      "title": "Limit Notation",
      "is_locked": false
    }
  }
}
```

---

## 5. Quiz/Exercise API

### POST /quiz/submit
Submit an answer to a quiz block.

**Request Body:**
```json
{
  "block_id": 10,
  "answer": {
    "selected_option": 2
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "correct_answer": {
      "selected_option": 2,
      "explanation": "When x approaches 2, f(x) = x² approaches 4."
    },
    "score": 1,
    "points_earned": 1
  }
}
```

### POST /quiz/submit-drag-drop
Submit a drag-drop exercise answer.

**Request Body:**
```json
{
  "block_id": 15,
  "answer": {
    "placements": {
      "zone_1": "item_a",
      "zone_2": "item_c",
      "zone_3": "item_b"
    }
  }
}
```

---

## 6. User Progress API

### GET /progress/dashboard
Get user's learning dashboard.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "streak": {
      "current": 7,
      "longest": 15,
      "last_activity": "2026-02-04"
    },
    "xp": {
      "total": 1250,
      "level": 5,
      "xp_to_next_level": 250,
      "this_week": 180
    },
    "stats": {
      "stories_completed": 2,
      "chapters_completed": 12,
      "steps_completed": 87,
      "total_time_hours": 15.5
    },
    "recent_activity": [
      {
        "type": "step_completed",
        "step_title": "Derivative Rules",
        "story_title": "Derivatives",
        "xp_earned": 15,
        "timestamp": "2026-02-04T09:30:00Z"
      }
    ],
    "continue_learning": {
      "story": {
        "id": 2,
        "title": "Derivatives",
        "progress_percent": 35
      },
      "next_step": {
        "id": 45,
        "title": "Chain Rule",
        "chapter_title": "Derivative Rules"
      }
    }
  }
}
```

### GET /progress/history
Get learning history with pagination.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `from_date` (optional): Filter from date
- `to_date` (optional): Filter to date

---

## 7. Gamification API

### GET /streak
Get current streak info.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "current_streak": 7,
    "longest_streak": 15,
    "last_activity_date": "2026-02-04",
    "streak_at_risk": false,
    "streak_freeze_available": 2,
    "streak_bonus_xp": 10
  }
}
```

### POST /streak/freeze
Use a streak freeze.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "streak_frozen": true,
    "streak_freeze_remaining": 1,
    "freeze_expires_at": "2026-02-05T23:59:59Z"
  }
}
```

### GET /achievements
Get all achievements with unlock status.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "unlocked": [
      {
        "id": 1,
        "slug": "first_step",
        "title": "First Step",
        "description": "Complete your first lesson step",
        "icon_url": "/icons/achievements/first-step.svg",
        "badge_color": "#4CAF50",
        "xp_reward": 10,
        "unlocked_at": "2026-01-28T14:00:00Z"
      }
    ],
    "locked": [
      {
        "id": 2,
        "slug": "week_warrior",
        "title": "Week Warrior",
        "description": "Maintain a 7-day streak",
        "icon_url": "/icons/achievements/week-warrior.svg",
        "badge_color": "#2196F3",
        "xp_reward": 50,
        "progress": {
          "current": 5,
          "required": 7,
          "percent": 71.4
        }
      }
    ],
    "stats": {
      "total": 10,
      "unlocked": 4,
      "percent": 40
    }
  }
}
```

### GET /leaderboard
Get weekly leaderboard.

**Query Parameters:**
- `type` (optional): 'global', 'friends' (default: 'global')
- `week` (optional): Week offset (0 = current, -1 = last week)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "week_start": "2026-02-03",
    "week_end": "2026-02-09",
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": 42,
          "username": "mathmaster",
          "display_name": "Math Master",
          "avatar_url": "/avatars/user42.png"
        },
        "xp_earned": 520,
        "steps_completed": 35
      },
      {
        "rank": 2,
        "user": {
          "id": 1,
          "username": "learner123",
          "display_name": "Happy Learner",
          "avatar_url": "/avatars/user1.png"
        },
        "xp_earned": 485,
        "steps_completed": 32,
        "is_current_user": true
      }
    ],
    "current_user_rank": 2
  }
}
```

---

## 8. Social/Friends API

### GET /friends
Get user's friend list.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "id": 5,
        "username": "calcfan",
        "display_name": "Calc Fan",
        "avatar_url": "/avatars/user5.png",
        "friendship_since": "2026-01-15T10:00:00Z",
        "streak": 12,
        "xp_this_week": 200,
        "is_online": true
      }
    ],
    "pending_requests": [
      {
        "id": 8,
        "username": "newlearner",
        "display_name": "New Learner",
        "avatar_url": "/avatars/user8.png",
        "requested_at": "2026-02-03T15:00:00Z"
      }
    ],
    "sent_requests": [
      {
        "id": 12,
        "username": "student99",
        "display_name": "Student 99",
        "sent_at": "2026-02-02T11:00:00Z"
      }
    ]
  }
}
```

### POST /friends/request
Send a friend request.

**Request Body:**
```json
{
  "user_id": 15
}
```

### POST /friends/accept
Accept a friend request.

**Request Body:**
```json
{
  "user_id": 8
}
```

### DELETE /friends/:id
Remove a friend.

### GET /friends/:id/progress
View a friend's learning progress.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 5,
      "username": "calcfan",
      "display_name": "Calc Fan",
      "avatar_url": "/avatars/user5.png"
    },
    "streak": {
      "current": 12,
      "longest": 25
    },
    "xp": {
      "total": 2500,
      "level": 8
    },
    "recent_activity": [
      {
        "type": "chapter_completed",
        "title": "Limit Laws",
        "story_title": "Limits and Continuity",
        "timestamp": "2026-02-04T08:00:00Z"
      }
    ],
    "achievements_count": 8
  }
}
```

---

## 9. Admin/Teacher API (Role: teacher, admin)

### POST /admin/stories
Create a new story.

### PUT /admin/stories/:id
Update a story.

### POST /admin/chapters
Create a new chapter.

### POST /admin/steps
Create a new step.

### POST /admin/slides
Create/update slides for a step.

**Request Body:**
```json
{
  "step_id": 1,
  "slides": [
    {
      "slide_number": 1,
      "title": "Introduction",
      "transition_type": "fade",
      "background_color": "#ffffff",
      "blocks": [
        {
          "block_type": "text",
          "block_data": {
            "content": "# Welcome to Limits",
            "format": "markdown"
          },
          "position_x": 10,
          "position_y": 10,
          "width": 80,
          "animation_type": "fadeIn"
        }
      ]
    }
  ]
}
```

---

## 10. User Profile API

### GET /users/:username
Get public user profile.

### PUT /users/profile
Update current user's profile.

**Request Body:**
```json
{
  "display_name": "Happy Learner",
  "bio": "Learning calculus!",
  "avatar_url": "/avatars/custom.png"
}
```

---

## Error Responses

All endpoints may return these error formats:

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "constraint": "email"
    }
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource"
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Story not found"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```
