from app.models.entities import MessageAttachment, Task
from app.schemas.attachments import AttachmentOut, attachment_to_out


def collect_task_attachments(task: Task) -> list[AttachmentOut]:
    seen: set = set()
    items: list[AttachmentOut] = []

    def add_from_message(message) -> None:
        if not message:
            return
        for att in getattr(message, "attachments", None) or []:
            if att.id in seen:
                continue
            seen.add(att.id)
            items.append(attachment_to_out(att))

    if task.source_message:
        add_from_message(task.source_message)
    for comment in task.comments or []:
        add_from_message(comment.message)

    items.sort(key=lambda a: (a.created_at, a.sort_order))
    return items
