from fastapi import APIRouter

from app.api.v1.endpoints import auth, cameras, events, persons, rules, zones, ws

router = APIRouter()

router.include_router(auth.router)
router.include_router(persons.router)
router.include_router(cameras.router)
router.include_router(zones.router)
router.include_router(rules.router)
router.include_router(events.router)
router.include_router(ws.router)
