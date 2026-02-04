from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import auth_router, stories_router, steps_router, progress_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await seed_demo_data()
    await seed_achievements()
    yield
    # Shutdown

app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(stories_router, prefix="/api/v1")
app.include_router(steps_router, prefix="/api/v1")
app.include_router(progress_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Calculus API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


async def seed_demo_data():
    """Seed database with demo data if empty"""
    from app.database import async_session
    from app.models import Category, Story, Chapter, Step, Slide
    from sqlalchemy import select
    
    async with async_session() as db:
        # Check if data exists
        result = await db.execute(select(Story).limit(1))
        if result.scalar_one_or_none():
            return
        
        # Create category
        category = Category(name="Giải tích", slug="giai-tich", icon="∫")
        db.add(category)
        await db.flush()
        
        # Create story 1: Giới thiệu Giải tích
        story = Story(
            slug="gioi-thieu-giai-tich",
            title="Giới thiệu Giải tích",
            description="Khám phá thế giới giải tích từ những khái niệm cơ bản nhất. Từ giới hạn đến đạo hàm, bạn sẽ nắm vững nền tảng toán học quan trọng.",
            icon="∫",
            color="from-blue-500 to-indigo-600",
            category_id=category.id,
            difficulty="beginner",
            is_published=True,
            is_featured=True
        )
        db.add(story)
        await db.flush()
        
        # Create chapters and steps with rich content
        chapters_data = [
            {
                "title": "Chương 1: Giới hạn",
                "description": "Hiểu về khái niệm giới hạn - nền tảng của giải tích",
                "steps": [
                    {
                        "title": "Giới hạn là gì?", 
                        "xp": 15,
                        "slides": [
                            {
                                "blocks": [
                                    {"id": "intro1", "type": "text", "content": {
                                        "heading": "Chào mừng đến với Giải tích! 🎉",
                                        "paragraphs": [
                                            "Giải tích là một nhánh quan trọng của toán học, nghiên cứu về sự thay đổi liên tục.",
                                            "Trong bài học này, chúng ta sẽ tìm hiểu về **giới hạn** - khái niệm nền tảng nhất."
                                        ]
                                    }}
                                ]
                            },
                            {
                                "blocks": [
                                    {"id": "def1", "type": "text", "content": {
                                        "heading": "Định nghĩa Giới hạn",
                                        "paragraphs": [
                                            "Giới hạn của hàm số f(x) khi x tiến tới a là giá trị mà f(x) tiến đến khi x ngày càng gần a."
                                        ]
                                    }},
                                    {"id": "math1", "type": "math", "content": {
                                        "latex": "\\lim_{x \\to a} f(x) = L"
                                    }}
                                ]
                            },
                            {
                                "blocks": [
                                    {"id": "ex1", "type": "text", "content": {
                                        "heading": "Ví dụ minh họa",
                                        "paragraphs": ["Xét hàm số f(x) = x + 2. Tính giới hạn khi x → 3:"]
                                    }},
                                    {"id": "math2", "type": "math", "content": {
                                        "latex": "\\lim_{x \\to 3} (x + 2) = 3 + 2 = 5"
                                    }}
                                ]
                            },
                            {
                                "blocks": [
                                    {"id": "quiz1", "type": "quiz", "content": {
                                        "question": "Tính giới hạn: $\\lim_{x \\to 2} (3x - 1)$ = ?",
                                        "options": [
                                            {"value": "a", "label": "4"},
                                            {"value": "b", "label": "5"},
                                            {"value": "c", "label": "6"}
                                        ],
                                        "correct": "b",
                                        "explanation": "Thay x = 2 vào: 3(2) - 1 = 6 - 1 = 5"
                                    }}
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Tính giới hạn cơ bản", 
                        "xp": 20,
                        "slides": [
                            {
                                "blocks": [
                                    {"id": "rule1", "type": "text", "content": {
                                        "heading": "Quy tắc tính giới hạn",
                                        "paragraphs": [
                                            "Có một số quy tắc quan trọng giúp tính giới hạn:",
                                            "• Giới hạn của tổng = Tổng các giới hạn",
                                            "• Giới hạn của tích = Tích các giới hạn",
                                            "• Giới hạn của thương = Thương các giới hạn (nếu mẫu ≠ 0)"
                                        ]
                                    }}
                                ]
                            },
                            {
                                "blocks": [
                                    {"id": "form1", "type": "text", "content": {
                                        "heading": "Công thức quan trọng",
                                        "paragraphs": ["Ghi nhớ các công thức sau:"]
                                    }},
                                    {"id": "math3", "type": "math", "content": {
                                        "latex": "\\lim_{x \\to a} [f(x) + g(x)] = \\lim_{x \\to a} f(x) + \\lim_{x \\to a} g(x)"
                                    }},
                                    {"id": "math4", "type": "math", "content": {
                                        "latex": "\\lim_{x \\to a} [f(x) \\cdot g(x)] = \\lim_{x \\to a} f(x) \\cdot \\lim_{x \\to a} g(x)"
                                    }}
                                ]
                            },
                            {
                                "blocks": [
                                    {"id": "quiz2", "type": "quiz", "content": {
                                        "question": "Nếu $\\lim_{x \\to 1} f(x) = 3$ và $\\lim_{x \\to 1} g(x) = 2$, thì $\\lim_{x \\to 1} [f(x) + g(x)]$ = ?",
                                        "options": [
                                            {"value": "a", "label": "1"},
                                            {"value": "b", "label": "5"},
                                            {"value": "c", "label": "6"}
                                        ],
                                        "correct": "b",
                                        "explanation": "Giới hạn của tổng = Tổng các giới hạn: 3 + 2 = 5"
                                    }}
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Giới hạn một bên", 
                        "xp": 25,
                        "slides": [
                            {
                                "blocks": [
                                    {"id": "one1", "type": "text", "content": {
                                        "heading": "Giới hạn trái và phải",
                                        "paragraphs": [
                                            "Đôi khi chúng ta cần xét giới hạn từ một phía:",
                                            "• Giới hạn trái: x tiến đến a từ bên trái (x < a)",
                                            "• Giới hạn phải: x tiến đến a từ bên phải (x > a)"
                                        ]
                                    }},
                                    {"id": "math5", "type": "math", "content": {
                                        "latex": "\\lim_{x \\to a^-} f(x) \\quad \\text{(giới hạn trái)}"
                                    }},
                                    {"id": "math6", "type": "math", "content": {
                                        "latex": "\\lim_{x \\to a^+} f(x) \\quad \\text{(giới hạn phải)}"
                                    }}
                                ]
                            },
                            {
                                "blocks": [
                                    {"id": "quiz3", "type": "quiz", "content": {
                                        "question": "Giới hạn tồn tại khi nào?",
                                        "options": [
                                            {"value": "a", "label": "Khi giới hạn trái tồn tại"},
                                            {"value": "b", "label": "Khi giới hạn phải tồn tại"},
                                            {"value": "c", "label": "Khi giới hạn trái = giới hạn phải"}
                                        ],
                                        "correct": "c",
                                        "explanation": "Giới hạn chỉ tồn tại khi giới hạn trái và giới hạn phải bằng nhau!"
                                    }}
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Chương 2: Đạo hàm",
                "description": "Học về tốc độ thay đổi và đạo hàm",
                "steps": [
                    {
                        "title": "Đạo hàm là gì?", 
                        "xp": 20,
                        "slides": [
                            {
                                "blocks": [
                                    {"id": "der1", "type": "text", "content": {
                                        "heading": "Giới thiệu Đạo hàm 📈",
                                        "paragraphs": [
                                            "Đạo hàm đo lường **tốc độ thay đổi** của một hàm số.",
                                            "Nếu y = f(x) thì đạo hàm cho biết y thay đổi nhanh như thế nào khi x thay đổi."
                                        ]
                                    }}
                                ]
                            },
                            {
                                "blocks": [
                                    {"id": "def2", "type": "text", "content": {
                                        "heading": "Định nghĩa chính thức",
                                        "paragraphs": ["Đạo hàm của f(x) được định nghĩa là:"]
                                    }},
                                    {"id": "math7", "type": "math", "content": {
                                        "latex": "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}"
                                    }}
                                ]
                            },
                            {
                                "blocks": [
                                    {"id": "quiz4", "type": "quiz", "content": {
                                        "question": "Đạo hàm cho biết điều gì về hàm số?",
                                        "options": [
                                            {"value": "a", "label": "Giá trị lớn nhất"},
                                            {"value": "b", "label": "Tốc độ thay đổi"},
                                            {"value": "c", "label": "Điểm cắt trục x"}
                                        ],
                                        "correct": "b",
                                        "explanation": "Đạo hàm chính là tốc độ thay đổi của hàm số!"
                                    }}
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Công thức đạo hàm cơ bản", 
                        "xp": 25,
                        "slides": [
                            {
                                "blocks": [
                                    {"id": "form2", "type": "text", "content": {
                                        "heading": "Bảng đạo hàm cơ bản",
                                        "paragraphs": ["Ghi nhớ các công thức sau:"]
                                    }},
                                    {"id": "math8", "type": "math", "content": {
                                        "latex": "(x^n)' = n \\cdot x^{n-1}"
                                    }},
                                    {"id": "math9", "type": "math", "content": {
                                        "latex": "(\\sin x)' = \\cos x"
                                    }},
                                    {"id": "math10", "type": "math", "content": {
                                        "latex": "(\\cos x)' = -\\sin x"
                                    }},
                                    {"id": "math11", "type": "math", "content": {
                                        "latex": "(e^x)' = e^x"
                                    }}
                                ]
                            },
                            {
                                "blocks": [
                                    {"id": "quiz5", "type": "quiz", "content": {
                                        "question": "Tính đạo hàm: $(x^3)' = ?$",
                                        "options": [
                                            {"value": "a", "label": "$3x^2$"},
                                            {"value": "b", "label": "$x^2$"},
                                            {"value": "c", "label": "$3x^3$"}
                                        ],
                                        "correct": "a",
                                        "explanation": "Áp dụng công thức: $(x^n)' = nx^{n-1}$, ta có $(x^3)' = 3x^2$"
                                    }}
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Quy tắc đạo hàm", 
                        "xp": 30,
                        "slides": [
                            {
                                "blocks": [
                                    {"id": "rule2", "type": "text", "content": {
                                        "heading": "Quy tắc tính đạo hàm",
                                        "paragraphs": [
                                            "Khi tính đạo hàm của biểu thức phức tạp, dùng các quy tắc sau:"
                                        ]
                                    }},
                                    {"id": "math12", "type": "math", "content": {
                                        "latex": "[f(x) + g(x)]' = f'(x) + g'(x)"
                                    }},
                                    {"id": "math13", "type": "math", "content": {
                                        "latex": "[f(x) \\cdot g(x)]' = f'(x) \\cdot g(x) + f(x) \\cdot g'(x)"
                                    }}
                                ]
                            },
                            {
                                "blocks": [
                                    {"id": "quiz6", "type": "quiz", "content": {
                                        "question": "Tính $(2x^2 + 3x)' = ?$",
                                        "options": [
                                            {"value": "a", "label": "$4x + 3$"},
                                            {"value": "b", "label": "$2x + 3$"},
                                            {"value": "c", "label": "$4x^2 + 3$"}
                                        ],
                                        "correct": "a",
                                        "explanation": "$(2x^2)' = 4x$ và $(3x)' = 3$, nên tổng là $4x + 3$"
                                    }}
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
        
        for c_idx, chapter_data in enumerate(chapters_data):
            chapter = Chapter(
                story_id=story.id,
                title=chapter_data["title"],
                description=chapter_data.get("description"),
                order_index=c_idx
            )
            db.add(chapter)
            await db.flush()
            
            for s_idx, step_data in enumerate(chapter_data["steps"]):
                step = Step(
                    chapter_id=chapter.id,
                    title=step_data["title"],
                    xp_reward=step_data["xp"],
                    order_index=s_idx
                )
                db.add(step)
                await db.flush()
                
                # Add slides
                for sl_idx, slide_data in enumerate(step_data["slides"]):
                    slide = Slide(
                        step_id=step.id,
                        order_index=sl_idx,
                        blocks=slide_data["blocks"]
                    )
                    db.add(slide)
        
        # Add second story: Đại số tuyến tính
        story2 = Story(
            slug="dai-so-tuyen-tinh",
            title="Đại số Tuyến tính",
            description="Ma trận, vector và không gian vector. Nền tảng cho machine learning và khoa học dữ liệu.",
            icon="📐",
            color="from-purple-500 to-pink-600",
            category_id=category.id,
            difficulty="intermediate",
            is_published=True,
            is_featured=True
        )
        db.add(story2)
        await db.flush()
        
        # Quick chapters for story2
        ch2 = Chapter(story_id=story2.id, title="Vector và Ma trận", order_index=0)
        db.add(ch2)
        await db.flush()
        
        step2 = Step(chapter_id=ch2.id, title="Vector là gì?", xp_reward=15, order_index=0)
        db.add(step2)
        await db.flush()
        
        slide2 = Slide(step_id=step2.id, order_index=0, blocks=[
            {"id": "vec1", "type": "text", "content": {"heading": "Giới thiệu Vector", "paragraphs": ["Vector là một đại lượng có cả độ lớn và hướng."]}}
        ])
        db.add(slide2)
        
        await db.commit()
        print("✅ Demo data seeded với nội dung phong phú!")


async def seed_achievements():
    """Seed achievements data"""
    from app.database import async_session
    from app.models import Achievement
    from sqlalchemy import select
    
    async with async_session() as db:
        # Check if achievements exist
        result = await db.execute(select(Achievement).limit(1))
        if result.scalar_one_or_none():
            return
        
        achievements_data = [
            # XP milestones
            {"title": "Người mới bắt đầu", "description": "Đạt 100 XP đầu tiên", "icon": "🌱", "category": "xp", "rarity": "common", "xp_reward": 10, "requirement_type": "xp", "requirement_value": 100},
            {"title": "Sinh viên chăm chỉ", "description": "Đạt 500 XP", "icon": "📚", "category": "xp", "rarity": "common", "xp_reward": 25, "requirement_type": "xp", "requirement_value": 500},
            {"title": "Nhà toán học trẻ", "description": "Đạt 1000 XP", "icon": "🎓", "category": "xp", "rarity": "uncommon", "xp_reward": 50, "requirement_type": "xp", "requirement_value": 1000},
            {"title": "Bậc thầy giải tích", "description": "Đạt 5000 XP", "icon": "🏆", "category": "xp", "rarity": "rare", "xp_reward": 100, "requirement_type": "xp", "requirement_value": 5000},
            {"title": "Huyền thoại toán học", "description": "Đạt 10000 XP", "icon": "👑", "category": "xp", "rarity": "legendary", "xp_reward": 200, "requirement_type": "xp", "requirement_value": 10000},
            
            # Steps milestones
            {"title": "Bước đầu tiên", "description": "Hoàn thành bài học đầu tiên", "icon": "👣", "category": "progress", "rarity": "common", "xp_reward": 15, "requirement_type": "steps", "requirement_value": 1},
            {"title": "Đang tiến bộ", "description": "Hoàn thành 5 bài học", "icon": "🚶", "category": "progress", "rarity": "common", "xp_reward": 30, "requirement_type": "steps", "requirement_value": 5},
            {"title": "Học tập đều đặn", "description": "Hoàn thành 10 bài học", "icon": "🏃", "category": "progress", "rarity": "uncommon", "xp_reward": 50, "requirement_type": "steps", "requirement_value": 10},
            {"title": "Không gì ngăn cản", "description": "Hoàn thành 25 bài học", "icon": "🚀", "category": "progress", "rarity": "rare", "xp_reward": 75, "requirement_type": "steps", "requirement_value": 25},
            {"title": "Bền bỉ", "description": "Hoàn thành 50 bài học", "icon": "💪", "category": "progress", "rarity": "epic", "xp_reward": 100, "requirement_type": "steps", "requirement_value": 50},
            
            # Streak milestones
            {"title": "Khởi động", "description": "Streak 3 ngày liên tiếp", "icon": "🔥", "category": "streak", "rarity": "common", "xp_reward": 20, "requirement_type": "streak", "requirement_value": 3},
            {"title": "Tuần hoàn hảo", "description": "Streak 7 ngày liên tiếp", "icon": "⚡", "category": "streak", "rarity": "uncommon", "xp_reward": 50, "requirement_type": "streak", "requirement_value": 7},
            {"title": "Tháng kiên trì", "description": "Streak 30 ngày liên tiếp", "icon": "🌟", "category": "streak", "rarity": "rare", "xp_reward": 150, "requirement_type": "streak", "requirement_value": 30},
            {"title": "Kỷ luật thép", "description": "Streak 100 ngày liên tiếp", "icon": "💎", "category": "streak", "rarity": "legendary", "xp_reward": 500, "requirement_type": "streak", "requirement_value": 100},
            
            # Stories milestones
            {"title": "Hoàn thành khóa học", "description": "Hoàn thành 1 khóa học", "icon": "✅", "category": "stories", "rarity": "uncommon", "xp_reward": 100, "requirement_type": "stories", "requirement_value": 1},
            {"title": "Nhà sưu tập", "description": "Hoàn thành 3 khóa học", "icon": "🎯", "category": "stories", "rarity": "rare", "xp_reward": 200, "requirement_type": "stories", "requirement_value": 3},
            {"title": "Đa năng", "description": "Hoàn thành 5 khóa học", "icon": "🌈", "category": "stories", "rarity": "epic", "xp_reward": 300, "requirement_type": "stories", "requirement_value": 5},
        ]
        
        for ach_data in achievements_data:
            achievement = Achievement(**ach_data)
            db.add(achievement)
        
        await db.commit()
        print("✅ Achievements seeded!")
