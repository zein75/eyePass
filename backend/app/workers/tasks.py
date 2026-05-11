from app.workers.celery_app import celery_app
from app.workers.camera_worker import process_camera_stream


@celery_app.task(name='workers.ping')
def ping() -> str:
    """Health-check задача."""
    return 'pong'

