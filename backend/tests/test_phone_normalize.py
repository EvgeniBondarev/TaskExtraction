from app.services.telegram_auth import _normalize_phone


def test_normalize_ru_8_prefix():
    assert _normalize_phone("8 (999) 123-45-67") == "+79991234567"


def test_normalize_ru_7_prefix():
    assert _normalize_phone("79991234567") == "+79991234567"


def test_normalize_plus():
    assert _normalize_phone("+79991234567") == "+79991234567"


def test_normalize_belarus():
    assert _normalize_phone("+375 29 978-55-92") == "+375299785592"
