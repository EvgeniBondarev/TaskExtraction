import logging
import time
from dataclasses import dataclass

import httpx

from app.services.llm_settings import EffectiveLlmConfig

logger = logging.getLogger(__name__)


@dataclass
class ChatResult:
    content: str
    latency_ms: int


def _headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://taskextraction.local",
        "X-Title": "TaskExtraction",
    }


def _safe_http_error(response: httpx.Response) -> str:
    try:
        data = response.json()
        err = data.get("error")
        if isinstance(err, dict) and err.get("message"):
            return str(err["message"])[:400]
        if isinstance(err, str):
            return err[:400]
    except Exception:
        pass
    return f"HTTP {response.status_code}"


async def chat_completion(
    config: EffectiveLlmConfig,
    messages: list[dict[str, str]],
    *,
    max_tokens: int = 256,
    temperature: float = 0.1,
    json_mode: bool = False,
) -> ChatResult:
    payload: dict = {
        "model": config.model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    url = f"{config.base_url.rstrip('/')}/chat/completions"
    started = time.perf_counter()

    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(url, headers=_headers(config.api_key), json=payload)
        if response.is_error:
            detail = _safe_http_error(response)
            logger.warning(
                "OpenRouter error %s model=%s key_source=%s",
                response.status_code,
                config.model,
                config.source,
            )
            raise httpx.HTTPStatusError(
                detail, request=response.request, response=response
            )
        data = response.json()

    latency_ms = int((time.perf_counter() - started) * 1000)
    content = data["choices"][0]["message"]["content"]
    return ChatResult(content=content, latency_ms=latency_ms)
