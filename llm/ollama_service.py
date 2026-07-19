from dataclasses import dataclass
import os

from groq import Groq


@dataclass(frozen=True)
class OllamaConfig:
    model_name: str = "openai/gpt-oss-120b"
    api_key: str | None = None
    temperature: float = 1.0
    max_completion_tokens: int = 2048
    top_p: float = 1.0
    reasoning_effort: str = "medium"


class OllamaService:
    def __init__(self, config: OllamaConfig | None = None) -> None:
        self.config = config or OllamaConfig()
        api_key = self.config.api_key or os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=api_key) if api_key else None

    def generate(self, prompt: str) -> str:
        if self.client is None:
            raise RuntimeError("GROQ_API_KEY is not set. Export it before using the chat endpoint.")

        completion = self.client.chat.completions.create(
            model=self.config.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=self.config.temperature,
            max_completion_tokens=self.config.max_completion_tokens,
            top_p=self.config.top_p,
            reasoning_effort=self.config.reasoning_effort,
        )
        return completion.choices[0].message.content or ""