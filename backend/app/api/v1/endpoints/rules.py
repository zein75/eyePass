import uuid
from datetime import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.access_rule import AccessRule
from app.schemas.rule import AccessRuleCreate, AccessRuleOut

router = APIRouter(prefix='/rules', tags=['rules'])


def _to_out(r: AccessRule) -> AccessRuleOut:
    return AccessRuleOut(
        id=r.id,
        person_id=r.person_id,
        person_name=r.person.full_name if r.person else '',
        zone_id=r.zone_id,
        zone_name=r.zone.name if r.zone else '',
        time_from=r.time_from.strftime('%H:%M') if isinstance(r.time_from, time) else str(r.time_from),
        time_to=r.time_to.strftime('%H:%M') if isinstance(r.time_to, time) else str(r.time_to),
        days_of_week=r.days_of_week,
        is_active=r.is_active,
    )


@router.get('', response_model=list[AccessRuleOut])
async def list_rules(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(
        select(AccessRule)
        .options(selectinload(AccessRule.person), selectinload(AccessRule.zone))
        .order_by(AccessRule.person_id)
    )
    return [_to_out(r) for r in result.scalars().all()]


@router.post('', response_model=AccessRuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule(
    data: AccessRuleCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    rule = AccessRule(
        person_id=data.person_id,
        zone_id=data.zone_id,
        time_from=time.fromisoformat(data.time_from),
        time_to=time.fromisoformat(data.time_to),
        days_of_week=data.days_of_week,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule, ['person', 'zone'])
    return _to_out(rule)


@router.delete('/{rule_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(AccessRule).where(AccessRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail='Правило не найдено')
    await db.delete(rule)
    await db.commit()
