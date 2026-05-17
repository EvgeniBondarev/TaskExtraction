from pydantic import BaseModel, Field


class ClassifierResult(BaseModel):
    is_task: bool = False
    confidence: float = 0.0
    reason: str = ""


class TaskFieldsResult(BaseModel):
    title: str = ""
    description: str = ""
    type: str = "other"
    priority: str = "medium"
