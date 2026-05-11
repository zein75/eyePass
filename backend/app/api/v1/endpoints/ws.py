import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings

router = APIRouter(tags=['websocket'])


@router.websocket('/ws/events')
async def events_ws(ws: WebSocket):
    """
    WebSocket endpoint. Подписывается на Redis channel 'eyepass:events'
    и транслирует каждое новое событие клиенту в реальном времени.
    """
    await ws.accept()

    client = aioredis.from_url(settings.redis_url)
    pubsub = client.pubsub()
    await pubsub.subscribe('eyepass:events')

    try:
        async for message in pubsub.listen():
            if message['type'] == 'message':
                data = message['data']
                if isinstance(data, bytes):
                    data = data.decode()
                await ws.send_text(data)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await pubsub.unsubscribe('eyepass:events')
        await client.aclose()
