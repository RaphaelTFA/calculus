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

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Sync Course Data (JSON → Database)

```bash
cd backend
python sync_data.py
```

Run this every time JSON course files are updated.

### 3. Start Backend (FastAPI)

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs

### 4. Start Frontend (React + Vite)

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
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── main.py           # Entry point
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── database.py       # Async SQLite connection
│   │   ├── auth.py           # JWT authentication
│   │   └── routers/          # API endpoints
│   ├── sync_data.py          # JSON → Database sync script
│   └── requirements.txt
│
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── App.jsx           # Main routes
│   │   ├── pages/            # Page components
│   │   ├── components/
│   │   │   ├── interactions/ # Interactive lesson engines
│   │   │   │   ├── InteractionTypeA.jsx  # Resolution/secant convergence
│   │   │   │   ├── InteractionTypeB.jsx  # Parameter control + live graph
│   │   │   │   ├── InteractionTypeC.jsx  # Temporal playback / animation
│   │   │   │   ├── InteractionTypeE.jsx  # Geometric split / structure slider
│   │   │   │   └── index.jsx             # Dispatcher
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── admin/            # Admin panel (hidden route)
│   │   └── lib/              # Utils, API client, Zustand store
│   └── package.json
│
├── data/                     # JSON Content Store
│   ├── categories.json
│   ├── achievements.json
│   ├── interaction_data/     # Reference interaction engine files
│   │   ├── instructions.txt          # Engine contract spec
│   │   ├── interactive_type_a.jsx
│   │   ├── interactive_type_b.jsx
│   │   ├── interactive_type_c.jsx
│   │   └── interactive_type_e.jsx
│   └── courses/
│       ├── gioi-han.json
│       ├── tich-phan.json
│       └── dao-ham/          # Folder-based course (chapter/step hierarchy)
│           ├── course.json
│           └── chapters/
│               ├── dinh-nghia-dao-ham/
│               ├── quy-tac-tinh-dao-ham/
│               └── ung-dung-dao-ham/
│
└── docs/
    ├── API.md
    ├── schema.sql
    └── SLIDE_FORMAT.md
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
| `text` | Heading + paragraphs |
| `math` | LaTeX equations rendered with KaTeX |
| `quiz` | Multiple choice with instant feedback |
| `image` | Images with captions |
| `video` | Embedded videos |
| `interaction` | Interactive math engine (Types A / B / C / E) |

### Sample Interaction Block
```json
{
  "id": "ia-example",
  "type": "interaction",
  "content": {
    "interactionType": "A",
    "lesson": { ... }
  }
}
```

---

## 🎛️ Interaction Engine

The platform includes four interactive lesson engines. Each owns exactly one primitive and all other values are derived.

| Type | Primitive | Description | Example Use |
|------|-----------|-------------|-------------|
| **A** | Resolution | Secant line converges to tangent as sampling density increases | Derivative definition, geometric meaning |
| **B** | Parameter | Live graph responds to a semantic parameter slider | Basic derivative formulas, sum/difference rules |
| **C** | Time | Animation plays deterministic evolution over time | Chain rule visualization |
| **E** | Structure (0→1) | Conserved geometric quantity is partitioned by a slider | Product rule (rectangle contribution), optimization (domain split) |

### Interaction JSON Example (Type B)
```json
{
  "interactionType": "B",
  "lesson": {
    "meta": { "parameterLabel": "Số mũ n" },
    "parameter": { "min": 1, "max": 5, "initial": 2 },
    "system": {
      "resolution": 200,
      "view": { "xMin": -2, "xMax": 2, "yMin": -6, "yMax": 6 },
      "model": "Math.pow(Math.abs(x), Math.round(p))"
    },
    "reflections": [
      {
        "id": "power-high",
        "triggerSpec": { "field": "currentValue", "op": ">=", "value": 4.5 },
        "text": "n = 5: f(x) = x⁵, đạo hàm f'(x) = 5x⁴"
      }
    ]
  }
}
```

---

## 📝 Available Courses

### Đạo hàm (Derivative) — 3 chapters, 9 lessons

| Chapter | Lesson | Interaction |
|---------|--------|-------------|
| Định nghĩa đạo hàm | Đạo hàm là gì? | Type A |
| Định nghĩa đạo hàm | Ý nghĩa hình học | Type A |
| Định nghĩa đạo hàm | Đạo hàm cơ bản | Type B |
| Quy tắc tính đạo hàm | Quy tắc tổng hiệu | Type B |
| Quy tắc tính đạo hàm | Quy tắc tích thương | Type E |
| Quy tắc tính đạo hàm | Đạo hàm hàm hợp | Type C |
| Ứng dụng đạo hàm | Tìm cực trị | Type B |
| Ứng dụng đạo hàm | Khảo sát hàm số | Type A |
| Ứng dụng đạo hàm | Bài toán tối ưu | Type E |

### Other Courses
| Course | Topics | Difficulty |
|--------|--------|------------|
| **Giới hạn hàm số** | Định nghĩa, tính giới hạn, L'Hôpital | Beginner |
| **Tích phân** | Nguyên hàm, phương pháp tính | Intermediate |

---

## ✨ Features

### 📖 Story-based Learning
- **Story → Chapter → Step** structure
- Slide-based lessons with diverse block types
- JSON-driven content — update files, run sync, done

### 🎯 Interactive Content
- 4 distinct interactive math engines with full JSON configuration
- Canvas-based rendering (no third-party chart libs)
- Drag-to-interact on canvas and sliders
- Reflection messages that appear based on the user's current parameter value

### 🎮 Gamification
- **XP & Level system**
- **Daily streaks**
- **17 Achievements** across 4 categories
- **Progress tracking per step**

### 🔐 Admin Panel
Access at `/admin`:
- Dashboard with stats
- Course management
- Data sync (JSON → Database)
- Server status monitoring

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TailwindCSS |
| State | Zustand |
| Backend | FastAPI + SQLAlchemy (async) |
| Database | SQLite |
| Auth | JWT tokens |
| Math rendering | KaTeX |
| Interaction rendering | HTML Canvas API |

---

## 🔧 Development

### Update Course Content
1. Edit files under `data/courses/`
2. Run `python backend/sync_data.py`
3. Refresh the browser — no restart needed

### Reset Database
```bash
# Windows
del backend\calculus.db
python backend\sync_data.py
```

### Add a New Interaction to a Lesson
Add an `interaction` block as the last slide in any step JSON:
```json
{
  "order_index": 2,
  "blocks": [
    {
      "id": "ia-my-lesson",
      "type": "interaction",
      "content": {
        "interactionType": "B",
        "lesson": { ... }
      }
    }
  ]
}
```

### Ports
| Service | Port |
|---------|------|
| Backend API | 8000 |
| Frontend | 3000 |
| Admin | 3000/admin |

---

## 📄 License

MIT License - Educational project
