from pydantic import BaseModel, ConfigDict
from typing import Optional

class TechnologyBase(BaseModel):
    name: str
    category: str
    icon: Optional[str] = None

class TechnologyCreate(TechnologyBase):
    pass

class TechnologyOut(TechnologyBase):
    id: str
    slug: str

    model_config = ConfigDict(from_attributes=True)
