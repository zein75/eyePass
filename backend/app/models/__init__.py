# Импортируем все модели чтобы Alembic их обнаружил
from app.models.user import User
from app.models.person import Person
from app.models.face_embedding import FaceEmbedding
from app.models.zone import Zone
from app.models.camera import Camera
from app.models.access_rule import AccessRule
from app.models.access_event import AccessEvent

__all__ = ['User', 'Person', 'FaceEmbedding', 'Zone', 'Camera', 'AccessRule', 'AccessEvent']
