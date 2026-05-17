__all__ = ["process_message"]


def __getattr__(name: str):
    if name == "process_message":
        from app.extraction.pipeline import process_message

        return process_message
    raise AttributeError(name)
