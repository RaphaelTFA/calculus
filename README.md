# Calculus - Nền Tảng Học Toán Tương Tác

<p align="center">
  <strong>Học Toán như chơi game! 🎮📚</strong>
</p>

<p align="center">
  Nền tảng EdTech tương tác giống Brilliant.org, Duolingo, và Candy Crush Saga<br>
  được thiết kế đặc biệt cho người học Toán.
</p>

---

## 🚀 Hướng Dẫn Chạy Code

### Yêu cầu
- **Node.js** >= 18
- **Python** >= 3.10
- **pip** (Python package manager)

### 1. Clone & Setup

```bash
cd /home/RaphaelTFA/Project/calculus
```

### 2. Chạy Backend (FastAPI)

```bash
# Tạo virtual environment (chỉ lần đầu, linux)
python -m venv .venv

# Kích hoạt virtual environment (linux)
source .venv/bin/activate

# Cài đặt dependencies
pip install -r backend/requirements.txt

# Đổi sang thư mục backend
cd backend

# Chạy server
uvicorn backend/app.main:app --reload --port 8000
```

Backend sẽ chạy tại: **http://localhost:8000**

API docs: **http://localhost:8000/docs**

### 3. Chạy Frontend (React + Vite)

```bash
# Mở terminal mới
cd frontend

# Cài đặt dependencies (chỉ lần đầu)
npm install

# Chạy dev server
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:3000**

### 4. Truy cập ứng dụng

Mở trình duyệt và truy cập: **http://localhost:3000**

---

## ✨ Tính Năng

### 📖 Story-based Learning
- Cấu trúc **Story → Chapter → Step** rõ ràng
- Bài học ngắn gọn 5-10 phút
- Slide-based với đa dạng block types

### 🎯 Interactive Slides
- **Text blocks** với Markdown & LaTeX
- **Math blocks** render đẹp với KaTeX
- **Code blocks** với syntax highlighting
- **Quiz blocks**: Multiple choice, Text input, True/False
- **Drag & Drop** exercises
- **Interactive graphs** với controls

### 🎮 Gamification
- **XP & Level system**
- **Daily streaks** với streak freezes
- **Achievements** với nhiều rarity levels
- **Leaderboard** global, weekly, và friends
- **Progress tracking** chi tiết

### 👥 Social Features
- Hệ thống bạn bè
- So sánh tiến độ với bạn
- Xem profile người khác

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite 5**
- **TailwindCSS** cho styling
- **Zustand** cho state management
- **React Router DOM** cho routing
- **Lucide React** cho icons

### Backend
- **FastAPI** (Python)
- **SQLAlchemy** (async) + **SQLite**
- **Pydantic** cho validation
- **JWT** authentication
- **bcrypt** password hashing

---

## 📁 Cấu Trúc Project

```
calculus/
├── README.md
├── database/
│   └── schema.sql          # Database schema
├── docs/
│   ├── API.md              # API documentation
│   └── SLIDE_FORMAT.md     # Slide JSON format spec
├── backend/
│   ├── requirements.txt    # Python dependencies
│   └── app/
│       ├── __init__.py
│       ├── main.py         # FastAPI application
│       ├── config.py       # Configuration
│       ├── database.py     # Database setup
│       ├── models.py       # SQLAlchemy models
│       ├── schemas.py      # Pydantic schemas
│       ├── auth.py         # Authentication
│       └── routers/        # API route handlers
│           ├── auth.py
│           ├── progress.py
│           ├── steps.py
│           └── stories.py
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── components/     # Reusable components
        ├── pages/          # Page components
        └── lib/            # Utilities & store
```

---

## 🚀 Getting Started

### Prerequisites
- **Python** 3.10+
- **Node.js** 18+
- **pip** (Python package manager)
- **npm** (Node package manager)

---

## 📚 Documentation

- [API Documentation](docs/API.md) - REST API endpoints
- [Slide Format](docs/SLIDE_FORMAT.md) - JSON format cho slide blocks
- [Database Schema](database/schema.sql) - SQL schema với comments

---

## 🎨 Slide Block Types

| Type | Description |
|------|-------------|
| `text` | Text với heading và paragraphs |
| `math` | LaTeX equations |
| `image` | Images với caption |
| `code` | Code blocks với syntax highlighting |
| `video` | YouTube, Vimeo, hoặc file |
| `quiz` | Multiple choice, text input, true/false |
| `drag_drop` | Drag items vào drop zones |
| `fill_blank` | Điền vào chỗ trống |
| `ordering` | Sắp xếp thứ tự |
| `callout` | Info, warning, tip boxes |
| `reveal` | Spoiler/reveal content |
| `interactive_graph` | Interactive function graphs |
| `columns` | Two-column layout |
| `divider` | Section dividers |
| `spacer` | Vertical spacing |

---

## 🏗️ Roadmap

- [ ] Admin dashboard để quản lý nội dung
- [ ] Offline mode với service workers
- [ ] Mobile app (React Native / Flutter)
- [ ] AI-powered hints và explanations
- [ ] Spaced repetition cho review
- [ ] Video lessons integration
- [ ] Collaborative learning features

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 🙏 Acknowledgments

- Inspired by [Brilliant.org](https://brilliant.org), [Duolingo](https://duolingo.com), and [3Blue1Brown](https://3blue1brown.com)
- [KaTeX](https://katex.org) for beautiful math rendering
- [TailwindCSS](https://tailwindcss.com) for styling
- [FastAPI](https://fastapi.tiangolo.com) for Python backend framework

---

<p align="center">Made with ❤️ for math learners everywhere!</p>
