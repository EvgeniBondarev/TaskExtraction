from app.schemas.tasks import ExtractionResult


def test_extraction_result_defaults():
    r = ExtractionResult(is_task=False)
    assert r.confidence == 0.0
    assert r.type == "other"


def test_extraction_result_task():
    r = ExtractionResult(
        is_task=True,
        type="bug",
        title="Нет поставщиков",
        description="При оформлении заказов",
        priority="high",
        confidence=0.9,
    )
    assert r.is_task is True
    assert r.confidence >= 0.7
