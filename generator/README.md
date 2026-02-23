# Lesson Generator

Calls the [OpenRouter](https://openrouter.ai) API to automatically generate calculus lesson JSON files in the format expected by this project.

## Setup

```bash
cd generator
pip install -r requirements.txt
cp .env.example .env
# edit .env — set your OPENROUTER_API_KEY
```

## How to use

**Edit [config.py](config.py)** to set what you want to generate, then run one command:

```bash
python generate_lesson.py generate   # single step
python generate_lesson.py plan       # chapter outline
python generate_lesson.py batch      # all steps from plan file
```

---

## config.py reference

```python
# Which AI model to use
MODEL = "anthropic/claude-3.5-sonnet"
TEMPERATURE = 0.4

# Shared context
COURSE_TITLE = "Đạo hàm"
CHAPTER_TITLE = "Ứng dụng đạo hàm"
CHAPTER_DESCRIPTION = "Cực trị và khảo sát hàm số"

# For `generate` — single step
STEP = {
    "id": "cuc-tri",
    "title": "Cực trị của hàm số",
    "description": "Tìm điểm cực đại và cực tiểu",
    "order_index": 0,
    "xp_reward": 15,           # 10 | 15 | 20
    "difficulty": "intermediate",
    "extra_instructions": "",  # optional hint to the AI
}
STEP_OUTPUT = "../data/courses/dao-ham/chapters/ung-dung-dao-ham/steps/cuc-tri.json"

# For `plan` — chapter outline
PLAN_NUM_STEPS = 3
PLAN_OUTPUT = "plan.json"

# For `batch` — generate all from plan
BATCH_PLAN_FILE = "plan.json"
BATCH_OUTPUT_DIR = "../data/courses/dao-ham/chapters/ung-dung-dao-ham/steps/"
BATCH_DIFFICULTY = "intermediate"
```

---

## Workflow (recommended)

```
1. Edit config.py (set course/chapter/step info)
2. python generate_lesson.py plan    → creates plan.json
3. Edit plan.json if needed
4. python generate_lesson.py batch   → generates all step files
5. Review the generated JSON files
6. Run backend/sync_data.py to load into the database
```

---

## Choosing a model

Set `MODEL` in [config.py](config.py). Options:

| Model | Quality | Speed | Cost |
|---|---|---|---|
| `anthropic/claude-3.5-sonnet` | ★★★★★ | Medium | ~$3/M tokens |
| `anthropic/claude-3-haiku` | ★★★★ | Fast | ~$0.25/M tokens |
| `google/gemini-flash-1.5` | ★★★★ | Very fast | ~$0.075/M tokens |
| `openai/gpt-4o` | ★★★★★ | Medium | ~$5/M tokens |
| `meta-llama/llama-3.1-70b-instruct` | ★★★ | Fast | Free (limited) |

Browse all models at <https://openrouter.ai/models>.
