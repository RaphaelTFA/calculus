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
# Tạo virtual environment (chỉ lần đầu)
python -m venv .venv

# Kích hoạt virtual environment
source .venv/bin/activate

# Cài đặt dependencies
pip install -r backend/requirements.txt

# Chạy server
uvicorn app.main:app --reload --port 8000 --app-dir backend
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

### Backend
- **C++17** với cpp-httplib
- **SQLite3** database
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
│   ├── CMakeLists.txt
│   ├── include/
│   │   ├── config.hpp
│   │   ├── database/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── utils/
│   └── src/
│       ├── main.cpp
│       ├── server/
│       ├── database/
│       ├── controllers/
│       └── utils/
└── frontend/
    ├── index.html
    ├── css/
    │   ├── main.css
    │   ├── animations.css
    │   ├── slide-engine.css
    │   └── components.css
    └── js/
        ├── app.js
        ├── router.js
        ├── store.js
        ├── utils/
        ├── pages/
        └── slide-engine/
```

---

## 🚀 Getting Started

### Prerequisites
- C++17 compiler (GCC 9+ / Clang 10+)
- CMake 3.16+
- SQLite3
- (Optional) Node.js for frontend development server

### Backend Setup

```bash
cd calculus/backend

# Create build directory
mkdir build && cd build

# Configure
cmake ..

# Build
make -j$(nproc)

# Run migrations
./calculus --migrate

# Start server
./calculus
```

Server sẽ chạy tại `http://localhost:8080`

### Frontend Development

Bạn có thể serve frontend bằng bất kỳ static file server nào:

```bash
cd calculus/frontend

# Với Python
python3 -m http.server 3000

# Với Node.js (npx serve)
npx serve -p 3000

# Hoặc với PHP
php -S localhost:3000
```

Mở trình duyệt tại `http://localhost:3000`

### Demo Mode

Frontend có sẵn demo mode với dữ liệu mẫu. Xem file `js/demo-data.js` để tùy chỉnh.

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
- [cpp-httplib](https://github.com/yhirose/cpp-httplib) for C++ HTTP server

---

<p align="center">Made with ❤️ for math learners everywhere</p>
