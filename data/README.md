# 📚 Calculus Data Store

Vùng lưu trữ dữ liệu độc lập, không phụ thuộc vào backend/Python.

## 📁 Cấu trúc

```
data/
├── categories.json      # Danh mục khóa học
├── achievements.json    # Hệ thống thành tựu
├── courses/             # Các khóa học (1 file = 1 khóa)
│   ├── gioi-han.json
│   ├── dao-ham.json
│   └── tich-phan.json
└── README.md
```

## 📋 Schema

### Course (courses/*.json)
```json
{
  "slug": "course-slug",
  "title": "Tên khóa học",
  "description": "Mô tả",
  "icon": "∫",
  "color": "from-blue-500 to-blue-700",
  "category": "giai-tich",
  "difficulty": "beginner|intermediate|advanced",
  "is_published": true,
  "is_featured": true,
  "order_index": 1,
  "chapters": [...]
}
```

### Chapter
```json
{
  "id": "chapter-id",
  "title": "Tên chương",
  "description": "Mô tả",
  "order_index": 0,
  "steps": [...]
}
```

### Step
```json
{
  "id": "step-id",
  "title": "Tên bài học",
  "description": "Mô tả",
  "xp_reward": 10,
  "order_index": 0,
  "slides": [...]
}
```

### Slide Blocks
```json
{
  "order_index": 0,
  "blocks": [
    {
      "id": "unique-id",
      "type": "text|math|quiz|image|video",
      "content": {...}
    }
  ]
}
```

## 🧱 Block Types

### Text Block
```json
{
  "type": "text",
  "content": {
    "heading": "Tiêu đề",
    "paragraphs": ["Đoạn 1", "Đoạn 2"]
  }
}
```

### Math Block
```json
{
  "type": "math",
  "content": {
    "latex": "\\lim_{x \\to 0} f(x) = L"
  }
}
```

### Quiz Block
```json
{
  "type": "quiz",
  "content": {
    "question": "Câu hỏi?",
    "options": [
      {"value": "a", "label": "Đáp án A"},
      {"value": "b", "label": "Đáp án B"}
    ],
    "correct": "a",
    "explanation": "Giải thích"
  }
}
```

## 🔧 Sử dụng

### Thêm khóa học mới
1. Tạo file `data/courses/ten-khoa-hoc.json`
2. Điền theo schema ở trên
3. Chạy lệnh sync từ admin hoặc backend

### Import vào database
```bash
cd backend
python scripts/db_manager.py sync-data
```

## 📝 Lưu ý

- File JSON phải valid (dùng JSON validator)
- ID phải unique trong phạm vi course
- `order_index` bắt đầu từ 0
- LaTeX dùng double backslash: `\\lim` thay vì `\lim`
