import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=['websocket'])

# Менеджер подключений — все клиенты слушают /ws/events
class ConnectionManager:
    def __init__(self):
        self._connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self._connections.append(ws)

    def disconnect(self, ws: WebSocket):
        self._connections.remove(ws)

    async def broadcast(self, data: dict[str, Any]):
        payload = json.dumps(data, default=str)
        dead = []
        for ws in self._connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections.remove(ws)


manager = ConnectionManager()


@router.websocket('/ws/events')
async def events_ws(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            # держим соединение живым, ждём пинг от клиента
            await asyncio.sleep(30)
            await ws.send_text('{"type":"ping"}')
    except WebSocketDisconnect:
        manager.disconnect(ws)
