from app.utils.telegram_attachments import extract_urls_from_message


class _Entity:
    def __init__(self, offset, length, url=None):
        self.offset = offset
        self.length = length
        self.url = url


class _Msg:
    def __init__(self, text, entities=None):
        self.message = text
        self.text = text
        self.entities = entities or []


def test_extract_urls_from_plain_text():
    msg = _Msg("Смотри https://example.com/doc.pdf и https://foo.bar")
    urls = extract_urls_from_message(msg)
    assert "https://example.com/doc.pdf" in urls
    assert "https://foo.bar" in urls


def test_extract_urls_dedupes():
    msg = _Msg("https://a.com https://a.com")
    urls = extract_urls_from_message(msg)
    assert urls.count("https://a.com") == 1
