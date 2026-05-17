from app.utils.telegram_link import build_telegram_message_link


def test_supergroup_link():
    link = build_telegram_message_link(-1002056938512, 2907)
    assert link == "https://t.me/c/2056938512/2907"
