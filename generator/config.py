# =============================================================================
# LESSON GENERATOR CONFIG
# 1. Put your prompt in a file under prompts/module*/
# 2. Set SYSTEM_PROMPT_FILE and USER_PROMPT_FILE below
# 3. Set OUTPUT to where the generated JSON should be saved
# 4. Run:  python generate_lesson.py
# =============================================================================


# ── Model ─────────────────────────────────────────────────────────────────────
# Browse options at https://openrouter.ai/models
# Examples:
#   "anthropic/claude-3.5-sonnet"        (best quality)
#   "anthropic/claude-3-haiku"           (fast, cheap)
#   "google/gemini-flash-1.5"            (very cheap)
#   "openai/gpt-4o"
#   "meta-llama/llama-3.1-70b-instruct"  (free tier available)
MODEL = "anthropic/claude-3.5-sonnet"

# Creativity: 0.0 = deterministic, 1.0 = very creative
TEMPERATURE = 0.4


# ── Prompts ───────────────────────────────────────────────────────────────────
# System prompt: rules/schema the AI must follow (shared across all lessons)
SYSTEM_PROMPT_FILE = "prompts/system.md"

# User prompt: your specific instructions for this one lesson
USER_PROMPT_FILE = "prompts/module1/lesson.md"


# ── Output ────────────────────────────────────────────────────────────────────
# Where to save the generated step .json file
OUTPUT = "../data/courses/gioi-han/chapters/khai-niem-gioi-han/steps/gioi-han-la-gi.json"
