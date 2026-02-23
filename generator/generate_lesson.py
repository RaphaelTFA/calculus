#!/usr/bin/env python3
"""
Calculus Lesson Generator
Edit config.py, then run:  python generate_lesson.py
"""

import json
import sys
from pathlib import Path

import config
from agent import LessonAgent


def load_prompt(file: str) -> str:
    path = Path(file)
    if not path.exists():
        sys.exit(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8").strip()


def main():
    system_prompt = load_prompt(config.SYSTEM_PROMPT_FILE)
    user_prompt = load_prompt(config.USER_PROMPT_FILE)
    out_path = Path(config.OUTPUT)

    print(f"\n── Lesson Generator ──────────────────────────────")
    print(f"  Model  : {config.MODEL}")
    print(f"  Prompt : {config.USER_PROMPT_FILE}")
    print(f"  Output : {out_path}\n")

    with LessonAgent(model=config.MODEL, temperature=config.TEMPERATURE) as agent:
        result = agent.generate_step(system_prompt, user_prompt)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"  Saved → {out_path}")
    print("\n── Done! ─────────────────────────────────────────\n")


if __name__ == "__main__":
    main()
