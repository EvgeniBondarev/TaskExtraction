import pytest

from app.extraction.heuristics import combined_confidence, score_message
from app.extraction.prefilter import analyze_prefilter, should_skip_llm


@pytest.mark.parametrize(
    "text,expected_skip",
    [
        ("", True),
        ("ок", True),
        ("Все, спасибо", True),
        ("привет", True),
        ("а", True),
        ("При оформлении заказов не появилось поставщиков", False),
        ("Пожалуйста, верните стрелки поставщиков", False),
    ],
)
def test_should_skip_llm(text, expected_skip):
    skip, _ = should_skip_llm(text)
    assert skip == expected_skip


def test_single_word_action_not_skipped():
    pre = analyze_prefilter("исправь")
    assert pre.skip is False
    assert pre.should_call_llm is True


def test_heuristic_score_action():
    h = score_message("Сделай API до пятницы")
    assert h.has_action_verb
    assert h.score >= 0.4


def test_combined_confidence():
    assert combined_confidence(0.4, 0.9) >= 0.72
