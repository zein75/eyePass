from pydantic import BaseModel
from typing import Literal


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class UserOut(BaseModel):
    id: str
    username: str
    role: Literal['admin', 'operator']

    model_config = {'from_attributes': True}
