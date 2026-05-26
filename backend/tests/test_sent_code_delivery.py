from types import SimpleNamespace

from app.services.telegram_auth import _sent_code_delivery


class SentCodeTypeApp:
    pass


class SentCodeTypeSms:
    pass


def test_delivery_app():
    sent = SimpleNamespace(type=SentCodeTypeApp())
    delivery, hint = _sent_code_delivery(sent)
    assert delivery == "app"
    assert "Telegram" in hint


def test_delivery_sms():
    sent = SimpleNamespace(type=SentCodeTypeSms())
    delivery, _ = _sent_code_delivery(sent)
    assert delivery == "sms"
