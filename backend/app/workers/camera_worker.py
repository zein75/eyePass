"""
Celery RTSP camera worker.

РџРѕС‚РѕРє РґР°РЅРЅС‹С…:
  OpenCV в†’ РєР°РґСЂ в†’ face_service /recognize в†’ embedding
  в†’ pgvector similarity search в†’ person_id + confidence
  в†’ access_rules check в†’ decision (allow/deny/unknown)
  в†’ INSERT access_events + snapshot
  в†’ Redis PUBLISH 'eyepass:events'
"""
import io
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import cv2
import psycopg2
import redis
import requests

from app.config import settings
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

_redis = redis.from_url(settings.redis_url, decode_responses=True)

_sync_db_url = settings.database_url.replace('postgresql+asyncpg://', 'postgresql://')

_runtime_settings_cache: dict[str, object] = {
    'loaded_at': 0.0,
    'face_threshold': settings.face_similarity_threshold,
    'frame_interval_ms': settings.frame_interval_ms,
    'webhook_enabled': False,
    'webhook_url': '',
}


def _get_db():
    return psycopg2.connect(_sync_db_url)


def _get_runtime_settings(cur) -> dict[str, object]:
    now = time.monotonic()
    if now - float(_runtime_settings_cache['loaded_at']) < 30:
        return _runtime_settings_cache

    cur.execute(
        """
        SELECT key, value
        FROM system_settings
        WHERE key = ANY(%s)
        """,
        (['face_threshold', 'frame_interval_ms', 'webhook_enabled', 'webhook_url'],),
    )
    values = {key: value for key, value in cur.fetchall()}

    _runtime_settings_cache.update(
        {
            'loaded_at': now,
            'face_threshold': float(values.get('face_threshold', settings.face_similarity_threshold)),
            'frame_interval_ms': int(values.get('frame_interval_ms', settings.frame_interval_ms)),
            'webhook_enabled': values.get('webhook_enabled', 'false').lower() == 'true',
            'webhook_url': values.get('webhook_url', ''),
        }
    )
    return _runtime_settings_cache


def _should_stop(camera_id: str) -> bool:
    return _redis.get(f'camera:{camera_id}:stop') == '1'


def _find_person(cur, embedding: list[float]) -> tuple[str | None, float]:
    """РќР°Р№С‚Рё Р±Р»РёР¶Р°Р№С€РµРµ Р»РёС†Рѕ С‡РµСЂРµР· pgvector cosine similarity."""
    vec_str = '[' + ','.join(str(x) for x in embedding) + ']'
    cur.execute(
        """
        SELECT fe.person_id::text,
               1 - (fe.embedding <=> %s::vector) AS confidence
        FROM face_embeddings fe
        JOIN persons p ON p.id = fe.person_id
        WHERE p.is_active = true
        ORDER BY fe.embedding <=> %s::vector
        LIMIT 1
        """,
        (vec_str, vec_str),
    )
    row = cur.fetchone()
    if not row:
        return None, 0.0
    return row[0], float(row[1])


def _check_access(cur, person_id: str, zone_id: str) -> bool:
    """РџСЂРѕРІРµСЂРёС‚СЊ access_rules РґР»СЏ person + zone РІ С‚РµРєСѓС‰РµРµ РІСЂРµРјСЏ."""
    now_utc = datetime.now(timezone.utc)
    cur.execute(
        """
        SELECT id FROM access_rules
        WHERE person_id = %s::uuid
          AND zone_id = %s::uuid
          AND is_active = true
          AND %s::time BETWEEN time_from AND time_to
          AND EXTRACT(DOW FROM %s::timestamptz) = ANY(days_of_week)
        LIMIT 1
        """,
        (person_id, zone_id, now_utc.strftime('%H:%M:%S'), now_utc),
    )
    return cur.fetchone() is not None


def _save_snapshot(event_id: str, frame) -> str | None:
    """РЎРѕС…СЂР°РЅРёС‚СЊ РєР°РґСЂ РЅР° РґРёСЃРє, РІРµСЂРЅСѓС‚СЊ URL."""
    try:
        snap_dir = Path(settings.snapshot_dir) / 'events'
        snap_dir.mkdir(parents=True, exist_ok=True)
        path = snap_dir / f'{event_id}.jpg'
        cv2.imwrite(str(path), frame)
        return f'/snapshots/events/{event_id}.jpg'
    except Exception as e:
        logger.warning('Snapshot save failed: %s', e)
        return None


def _get_camera(cur, camera_id: str) -> dict | None:
    cur.execute(
        'SELECT id::text, name, rtsp_url, zone_id::text FROM cameras WHERE id = %s::uuid',
        (camera_id,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'name': row[1], 'rtsp_url': row[2], 'zone_id': row[3]}


def _insert_event(cur, camera: dict, person_id: str | None, decision: str,
                  confidence: float | None, snapshot_url: str | None) -> dict:
    event_id = str(uuid.uuid4())
    cur.execute(
        """
        INSERT INTO access_events
            (id, person_id, camera_id, zone_id, decision, confidence, snapshot_url)
        VALUES (%s::uuid, %s::uuid, %s::uuid, %s::uuid, %s, %s, %s)
        RETURNING id::text, created_at
        """,
        (
            event_id,
            person_id,
            camera['id'],
            camera['zone_id'],
            decision,
            confidence,
            snapshot_url,
        ),
    )
    row = cur.fetchone()
    return {
        'id': row[0],
        'person_id': person_id,
        'camera_id': camera['id'],
        'camera_name': camera['name'],
        'zone_id': camera['zone_id'],
        'decision': decision,
        'confidence': confidence,
        'snapshot_url': snapshot_url,
        'created_at': row[1].isoformat() if row[1] else None,
    }


def _send_webhook(event: dict, runtime_settings: dict[str, object]) -> None:
    if not runtime_settings.get('webhook_enabled'):
        return
    url = str(runtime_settings.get('webhook_url') or '').strip()
    if not url:
        return

    payload = {
        'event_id': event['id'],
        'person_id': event.get('person_id'),
        'person_name': event.get('person_name'),
        'zone_id': event.get('zone_id'),
        'zone_name': event.get('zone_name'),
        'camera_id': event.get('camera_id'),
        'camera_name': event.get('camera_name'),
        'decision': event.get('decision'),
        'confidence': event.get('confidence'),
        'timestamp': event.get('created_at'),
        'snapshot_url': event.get('snapshot_url'),
    }

    for attempt in range(1, settings.webhook_max_retries + 1):
        try:
            resp = requests.post(url, json=payload, timeout=settings.webhook_timeout_seconds)
            if 200 <= resp.status_code < 300:
                return
            logger.warning('Webhook failed: status=%s attempt=%s', resp.status_code, attempt)
        except Exception as e:
            logger.warning('Webhook error: %s attempt=%s', e, attempt)
        time.sleep(min(attempt, 5))


def _get_person_name(cur, person_id: str) -> str | None:
    cur.execute('SELECT full_name FROM persons WHERE id = %s::uuid', (person_id,))
    row = cur.fetchone()
    return row[0] if row else None


@celery_app.task(bind=True, name='workers.camera_stream', max_retries=3)
def process_camera_stream(self, camera_id: str):
    """Р”РѕР»РіРѕР¶РёРІСѓС‰Р°СЏ Celery-Р·Р°РґР°С‡Р°: С‡РёС‚Р°РµС‚ RTSP, СЂР°СЃРїРѕР·РЅР°С‘С‚ Р»РёС†Р°, РїРёС€РµС‚ СЃРѕР±С‹С‚РёСЏ."""
    logger.info('Camera %s: starting', camera_id)

    conn = _get_db()
    conn.autocommit = False

    with conn.cursor() as cur:
        camera = _get_camera(cur, camera_id)

    if not camera:
        logger.error('Camera %s not found in DB', camera_id)
        return

    if not camera['zone_id']:
        logger.error('Camera %s has no zone assigned', camera_id)
        return

    cap = cv2.VideoCapture(camera['rtsp_url'])
    if not cap.isOpened():
        logger.error('Camera %s: cannot open RTSP stream %s', camera_id, camera['rtsp_url'])
        _redis.set(f'camera:{camera_id}:error', 'Cannot open RTSP stream', ex=3600)
        _mark_stopped(camera_id, conn)
        return

    with conn.cursor() as cur:
        runtime_settings = _get_runtime_settings(cur)
    frame_interval = int(runtime_settings['frame_interval_ms']) / 1000.0
    logger.info('Camera %s: stream opened, interval=%.2fs', camera_id, frame_interval)

    try:
        while not _should_stop(camera_id):
            with conn.cursor() as cur:
                runtime_settings = _get_runtime_settings(cur)
            frame_interval = int(runtime_settings['frame_interval_ms']) / 1000.0

            ret, frame = cap.read()
            if not ret:
                logger.warning('Camera %s: frame read failed, retrying...', camera_id)
                time.sleep(2)
                cap.release()
                cap = cv2.VideoCapture(camera['rtsp_url'])
                continue

            try:
                _, img_encoded = cv2.imencode('.jpg', frame)
                resp = requests.post(
                    f'{settings.face_service_url}/recognize',
                    files={'file': ('frame.jpg', img_encoded.tobytes(), 'image/jpeg')},
                    timeout=10,
                )
                result = resp.json()
            except Exception as e:
                logger.warning('Camera %s: face_service error: %s', camera_id, e)
                time.sleep(frame_interval)
                continue

            if not result.get('found'):
                time.sleep(frame_interval)
                continue

            embedding = result['embedding']

            with conn.cursor() as cur:
                person_id, confidence = _find_person(cur, embedding)

            if person_id is None or confidence < float(runtime_settings['face_threshold']):
                event_id = str(uuid.uuid4())
                snapshot_url = _save_snapshot(event_id, frame)
                with conn.cursor() as cur:
                    event = _insert_event(cur, camera, None, 'unknown', confidence or 0.0, snapshot_url)
                    event['person_name'] = None
                    event['zone_name'] = _get_zone_name(cur, camera['zone_id'])
                conn.commit()
                _redis.publish('eyepass:events', json.dumps(event))
                _send_webhook(event, runtime_settings)
                time.sleep(frame_interval)
                continue

            with conn.cursor() as cur:
                has_access = _check_access(cur, person_id, camera['zone_id'])
                decision = 'allow' if has_access else 'deny'
                snapshot_url = _save_snapshot(str(uuid.uuid4()), frame)
                event = _insert_event(cur, camera, person_id, decision, confidence, snapshot_url)
                event['person_name'] = _get_person_name(cur, person_id)
                event['zone_name'] = _get_zone_name(cur, camera['zone_id'])
            conn.commit()

            logger.info(
                'Camera %s: %s вЂ” person=%s confidence=%.2f',
                camera_id, decision, person_id, confidence,
            )
            _redis.publish('eyepass:events', json.dumps(event))
            _send_webhook(event, runtime_settings)
            time.sleep(frame_interval)

    except Exception as e:
        logger.exception('Camera %s: unexpected error: %s', camera_id, e)
    finally:
        cap.release()
        _mark_stopped(camera_id, conn)
        conn.close()
        logger.info('Camera %s: stopped', camera_id)


def _get_zone_name(cur, zone_id: str) -> str | None:
    cur.execute('SELECT name FROM zones WHERE id = %s::uuid', (zone_id,))
    row = cur.fetchone()
    return row[0] if row else None


def _mark_stopped(camera_id: str, conn):
    """РЎРЅСЏС‚СЊ С„Р»Р°Рі is_running Сѓ РєР°РјРµСЂС‹."""
    try:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE cameras SET is_running = false WHERE id = %s::uuid',
                (camera_id,),
            )
        conn.commit()
    except Exception:
        pass
    _redis.delete(f'camera:{camera_id}:stop')
    _redis.delete(f'camera:{camera_id}:task_id')
