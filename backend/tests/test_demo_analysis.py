"""Демо и пайплайн используют одну функцию analyze_text; проверяем её ветки без сети."""

import pytest

from app.api.demo import _RateLimiter
from app.extraction import analysis as analysis_mod
from app.extraction.analysis import analyze_text, resolve_type_priority
from app.extraction.jev import JevDecision
from app.services.prompt_settings import default_prompt_config


def _decision(prob: float, **kw) -> JevDecision:
    base = dict(
        model="test",
        is_task_probability=prob,
        task_type="bug",
        task_type_confidence=0.9,
        priority="high",
        priority_confidence=0.9,
        complexity="simple",
        complexity_confidence=0.9,
        urgency_score=1.5,
        urgency_confidence=0.9,
        impact_score=1.0,
        impact_confidence=0.9,
        needs_review_probability=0.1,
        has_deadline_probability=0.2,
        task_count="one",
        latency_ms=10,
        cost_usd=None,
    )
    base.update(kw)
    return JevDecision(**base)


@pytest.mark.asyncio
async def test_prefilter_skip_never_calls_llm(monkeypatch):
    async def boom(*_a, **_k):
        raise AssertionError("LLM must not be called")

    monkeypatch.setattr(analysis_mod, "decide_task", boom)
    result = await analyze_text("Спасибо!", prompts=default_prompt_config())
    assert result.status in {"prefilter_skip", "no_signals"}
    assert result.passes_gate is False


@pytest.mark.asyncio
async def test_jev_decision_above_threshold_passes(monkeypatch):
    async def fake(_text, _ctx):
        return _decision(0.92)

    monkeypatch.setattr(analysis_mod, "decide_task", fake)
    result = await analyze_text("Срочно проверьте, не работает оплата на сайте", prompts=default_prompt_config())
    assert result.status == "classified"
    assert result.passes_gate is True
    assert result.classification(created=True)["is_task"] is True


@pytest.mark.asyncio
async def test_jev_decision_below_threshold_is_candidate(monkeypatch):
    async def fake(_text, _ctx):
        return _decision(0.6)

    monkeypatch.setattr(analysis_mod, "decide_task", fake)
    result = await analyze_text("Может, стоит проверить оплату на сайте?", prompts=default_prompt_config())
    assert result.passes_gate is False
    assert result.is_task is True
    assert result.skip_reason == "ai_below_threshold"


def test_resolve_type_priority_falls_back():
    assert resolve_type_priority(None, "weird", "urgent") == ("other", "medium")
    assert resolve_type_priority(_decision(0.9), "other", "low") == ("bug", "high")


def test_rate_limiter_blocks_after_limit():
    limiter = _RateLimiter()
    assert all(limiter.allow("ip:1", ((60, 3),)) for _ in range(3))
    assert limiter.allow("ip:1", ((60, 3),)) is False
    assert limiter.allow("ip:2", ((60, 3),)) is True
