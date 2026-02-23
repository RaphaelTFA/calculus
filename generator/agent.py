"""
OpenRouter API client and agent logic for lesson generation.
"""

import json
import os
import time
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Default model — change via env var OPENROUTER_MODEL
DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")

# Site info shown in OpenRouter dashboard (optional)
SITE_URL = os.getenv("SITE_URL", "https://github.com/your-repo/calculus")
SITE_NAME = os.getenv("SITE_NAME", "Calculus Lesson Generator")


class OpenRouterClient:
    """Thin wrapper around the OpenRouter chat completions API."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError(
                "No OpenRouter API key found. "
                "Set OPENROUTER_API_KEY in your .env file or environment."
            )
        self.model = model or DEFAULT_MODEL
        self.client = httpx.Client(timeout=120.0)

    def chat(
        self,
        messages: list[dict],
        temperature: float = 0.4,
        max_tokens: int = 8192,
        retries: int = 3,
        retry_delay: float = 5.0,
    ) -> str:
        """Send a chat request and return the assistant message content."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": SITE_URL,
            "X-Title": SITE_NAME,
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        for attempt in range(1, retries + 1):
            try:
                response = self.client.post(
                    OPENROUTER_API_URL, headers=headers, json=payload
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
            except httpx.HTTPStatusError as e:
                print(f"[Attempt {attempt}] HTTP error: {e.response.status_code} — {e.response.text}")
                if attempt == retries:
                    raise
                time.sleep(retry_delay)
            except (KeyError, IndexError) as e:
                print(f"[Attempt {attempt}] Unexpected response structure: {e}")
                if attempt == retries:
                    raise
                time.sleep(retry_delay)

        raise RuntimeError("All retry attempts exhausted.")

    def close(self):
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


class LessonAgent:
    """Agent that generates lesson JSON using OpenRouter."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        temperature: float = 0.4,
        verbose: bool = True,
    ):
        self.client = OpenRouterClient(api_key=api_key, model=model)
        self.temperature = temperature
        self.verbose = verbose

    def _log(self, msg: str):
        if self.verbose:
            print(msg)

    def generate_step(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 100000,
    ) -> dict[str, Any]:
        """
        Call the API and parse the response as a step JSON object.
        Returns the parsed dict.
        """
        self._log(f"[LessonAgent] Calling {self.client.model} ...")

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        raw = self.client.chat(
            messages=messages,
            temperature=self.temperature,
            max_tokens=max_tokens,
        )

        # Strip potential markdown code fences if the model ignores instructions
        clean = self._strip_code_fence(raw)

        try:
            parsed = json.loads(clean)
        except json.JSONDecodeError as e:
            print(f"[LessonAgent] JSON parse error: {e}")
            print("--- RAW RESPONSE ---")
            print(raw[:2000])
            raise

        self._log("[LessonAgent] JSON parsed successfully.")
        return parsed

    def generate_batch_plan(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> list[dict[str, Any]]:
        """
        Generate a plan (list of step stubs) for a chapter.
        Returns a list of step plan dicts.
        """
        self._log(f"[LessonAgent] Generating chapter plan with {self.client.model} ...")

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        raw = self.client.chat(
            messages=messages,
            temperature=0.3,
            max_tokens=2048,
        )

        clean = self._strip_code_fence(raw)

        try:
            parsed = json.loads(clean)
        except json.JSONDecodeError as e:
            print(f"[LessonAgent] Plan JSON parse error: {e}")
            print("--- RAW RESPONSE ---")
            print(raw[:1000])
            raise

        if not isinstance(parsed, list):
            raise ValueError(f"Expected a JSON array for the plan, got {type(parsed)}")

        self._log(f"[LessonAgent] Plan contains {len(parsed)} steps.")
        return parsed

    @staticmethod
    def _strip_code_fence(text: str) -> str:
        """Remove markdown ```json ... ``` fences if present."""
        text = text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            # drop first line (```json or ```) and last line (```)
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            text = "\n".join(lines).strip()
        return text

    def close(self):
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
