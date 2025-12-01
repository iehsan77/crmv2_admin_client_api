from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class Address(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None


class Note(BaseModel):
    note: str
    created_at: datetime
    created_by: str


class Interaction(BaseModel):
    type: str  # e.g., "email", "call", "meeting"
    subject: Optional[str] = None
    summary: Optional[str] = None
    timestamp: datetime
    agent: str


class CreateCustomer(BaseModel):
    id: Optional[int] = 0
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]

    phone: Optional[str] = None
    # company: Optional[str] = None
    # job_title: Optional[str] = None
    # address: Optional[Address] = None
    # tags: Optional[List[str]] = []
    # status: Optional[str] = None  # e.g., "active", "inactive", "prospect"
    # source: Optional[str] = None
    # notes: Optional[List[Note]] = []
    # interactions: Optional[List[Interaction]] = []
    # created_at: Optional[datetime] = None
    # updated_at: Optional[datetime] = None

    # class Config:
    #     allow_population_by_field_name = True
    #     json_encoders = {
    #         datetime: lambda v: v.isoformat(),
    #     }


class UpdateCustomer(BaseModel):
    id: Optional[int] = 0
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]

    phone: Optional[str] = None
