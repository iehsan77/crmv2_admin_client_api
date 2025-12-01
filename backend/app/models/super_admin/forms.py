from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime
from bson import ObjectId

from app.helpers.general_helper import form_body

class CommonModel(BaseModel):
    sort_by: Optional[int] = 0
    created_at: Optional[datetime] = datetime.now()
    created_by: Optional[int] = 0
    updated_at: Optional[datetime] = datetime.now()
    updated_by: Optional[int] = 0
    deleted_at: Optional[datetime] = datetime.now()
    deleted: Optional[int] = 0
    deleteable: Optional[int] = 0

@form_body
class AttributeModel(BaseModel):
    id: str
    title: str
    attribute: str
    value: Union[str, int, bool, None]
    helperText: Optional[str]
    field_type: Optional[str]
    form_data_field_id: Optional[Union[str, None]]
    is_common: bool

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

@form_body
class FieldModel(BaseModel):
    id: str
    title: str
    uxType: str
    icon: str
    type: str
    name: str
    section_id: Optional[str]
    attributes: List[AttributeModel]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

@form_body
class SectionModel(BaseModel):
    id: str
    title: str
    column: int
    fields: List[FieldModel] = []

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
