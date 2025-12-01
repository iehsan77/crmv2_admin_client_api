from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.helpers.general_helper import form_body

class CommonModel(BaseModel):
    sort_by: Optional[int] = 0
    created_at: Optional[datetime] = datetime.now()
    created_by: Optional[int] = 0
    updated_at: Optional[datetime] = datetime.now()
    updated_by: Optional[int] = 0
    deleted_at: Optional[datetime] = None
    deleted: Optional[int] = 0
    deleteable: Optional[int] = 0

@form_body
class DefaultFormModel(CommonModel):
    id: Optional[int] = 0
    app_id: Optional[int] = 0
    module_id: Optional[int] = 0
    layout_id: Optional[int] = 0
    form: Optional[str] = "" 