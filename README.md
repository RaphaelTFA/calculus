# 📐 Calculus - Interactive Math Learning Platform

<p align="center">
  <strong>Learn Math like playing a game! 🎮📚</strong>
</p>

<p align="center">
  An interactive EdTech platform inspired by Brilliant.org & Duolingo<br>
  designed specifically for Calculus learners.
</p>

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18
- **Python** >= 3.10

### 1. Setup Virtual Environment

```bash
cd /home/RaphaelTFA/Project/calculus

# Create venv (first time only)
python -m venv .venv

# Activate venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Install Python dependencies
pip install -r backend/requirements.txt
```

### 2. Start Backend (FastAPI)

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs

### 3. Start Frontend (React + Vite)

```bash
cd frontend
npm install  # first time only
npm run dev
```

- **App**: http://localhost:3000
- **Admin**: http://localhost:3000/admin (hidden)

---

## 📁 Project Structure

```
calculus/
├── backend/              # FastAPI Backend
│   ├── app/
│   │   ├── main.py       # Entry point, seeds data from JSON
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── database.py   # Async SQLite connection
│   │   ├── auth.py       # JWT authentication
│   │   └── routers/      # API endpoints
│   └── requirements.txt
│
├── frontend/             # React Frontend
│   ├── src/
│   │   ├── App.jsx       # Main routes
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable UI
│   │   ├── admin/        # Admin panel (hidden)
│   │   └── lib/          # Utils, API, store
│   └── package.json
│
├── data/                 # JSON Data Store (independent)
│   ├── categories.json   # Course categories
│   ├── achievements.json # Achievement definitions
│   ├── courses/          # Course content
│   │   ├── gioi-han.json
│   │   ├── dao-ham.json
│   │   └── tich-phan.json
│   └── README.md         # Data schema documentation
│
└── database/
    └── schema.sql        # Database schema reference
```

---

## 📊 Data Architecture

### Content Hierarchy
```
Category → Course (Story) → Chapter → Step → Slides → Blocks
```

### Block Types
| Type | Description |
|------|-------------|
| `text` | Heading + paragraphs with Markdown |
| `math` | LaTeX equations rendered with KaTeX |
| `quiz` | Multiple choice with explanation |
| `image` | Images with captions |
| `video` | Embedded videos |

### Sample Block Structure
```json
{
  "id": "math1",
  "type": "math",
  "content": {
    "latex": "\\lim_{x \\to a} f(x) = L"
  }
}
```

---

## ✨ Features

### 📖 Story-based Learning
- Clear **Story → Chapter → Step** structure
- Bite-sized 5-10 minute lessons
- Slide-based with diverse block types

### 🎯 Interactive Content
- **Text blocks** with Markdown & LaTeX
- **Math blocks** beautifully rendered with KaTeX
- **Quiz blocks** with instant feedback
- Progress tracking per step

### 🎮 Gamification
- **XP & Level system**
- **Daily streaks**
- **17 Achievements** across 4 categories
- **Progress tracking**

### 🔐 Admin Panel
Access at `/admin` (not shown in main UI):
- Dashboard with stats
- Course management
- Data sync (JSON → Database)
- Server status monitoring
- Settings

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TailwindCSS |
| State | Zustand + React Query |
| Backend | FastAPI + SQLAlchemy (async) |
| Database | SQLite |
| Auth | JWT tokens |
| Math | KaTeX |

---

## 📝 Available Courses

| Course | Topics | Difficulty |
|--------|--------|------------|
| **Giới hạn hàm số** | Định nghĩa, tính giới hạn, L'Hospital | Beginner |
| **Đạo hàm** | Công thức, quy tắc đạo hàm | Beginner |
| **Tích phân** | Nguyên hàm, phương pháp tính | Intermediate |

---

## 🔧 Development

### Reset Database
```bash
rm backend/calculus.db
# Restart backend - auto seeds from JSON
```

### Add New Course
1. Create `data/courses/your-course.json`
2. Follow schema in `data/README.md`
3. Restart backend to seed

### Ports
| Service | Port |
|---------|------|
| Backend API | 8000 |
| Frontend | 3000 |
| Admin | 3000/admin |

---

## 📄 License

MIT License - Educational project
