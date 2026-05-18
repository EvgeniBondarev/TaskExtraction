from app.utils.telegram_ids import chat_id_matches, normalize_telegram_chat_id


def test_normalize_supergroup():
    cid = normalize_telegram_chat_id(-1002056938512)
    assert cid == -1002056938512


def test_chat_id_matches_supergroup_variants():
    monitored = {-1002056938512}
    assert chat_id_matches(-1002056938512, monitored) is True
