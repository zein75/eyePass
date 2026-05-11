from celery import Celery

from app.config import settings

celery_app = Celery(
    'eyepass',
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=['app.workers.tasks', 'app.workers.camera_worker'],
)

celery_app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    broker_connection_retry_on_startup=True,
)
