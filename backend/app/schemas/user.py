from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    program: Optional[str] = None
    grad_year: Optional[int] = None
    university_id: Optional[str] = None

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(UserBase):
    id: str
    role: str
    is_verified: bool
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime
    university_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    program: Optional[str] = None
    grad_year: Optional[int] = None
    avatar_url: Optional[str] = None
