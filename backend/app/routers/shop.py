from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, ShopItem, UserInventory
from app.schemas import ShopItemResponse, BuyItemResponse, InventoryItemResponse, UserResponse
from app.auth import get_current_user

router = APIRouter(prefix="/shop", tags=["shop"])


@router.get("/items", response_model=list[ShopItemResponse])
async def list_shop_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all active shop items."""
    result = await db.execute(
        select(ShopItem)
        .where(ShopItem.is_active == True)
        .order_by(ShopItem.order_index, ShopItem.price)
    )
    return result.scalars().all()


@router.post("/buy/{item_id}", response_model=BuyItemResponse)
async def buy_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Purchase a shop item with coins."""
    result = await db.execute(
        select(ShopItem).where(ShopItem.id == item_id, ShopItem.is_active == True)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    user_coins = current_user.coins or 0
    if user_coins < item.price:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough coins. You have {user_coins}, need {item.price}."
        )

    # Deduct coins
    current_user.coins = user_coins - item.price

    # Calculate expiry for timed items
    expires_at = None
    if item.item_type == "xp_boost":
        expires_at = datetime.utcnow() + timedelta(hours=item.effect_value)

    # Stackable items: increment quantity if already owned
    stackable_types = ("streak_freeze", "hint_token")
    if item.item_type in stackable_types:
        inv_result = await db.execute(
            select(UserInventory).where(
                UserInventory.user_id == current_user.id,
                UserInventory.item_id == item_id,
            )
        )
        existing = inv_result.scalar_one_or_none()
        if existing:
            existing.quantity += 1
        else:
            db.add(UserInventory(
                user_id=current_user.id,
                item_id=item_id,
                quantity=1,
                is_active=True,
            ))
    else:
        db.add(UserInventory(
            user_id=current_user.id,
            item_id=item_id,
            quantity=1,
            expires_at=expires_at,
            is_active=True,
        ))

    await db.commit()
    await db.refresh(current_user)

    return BuyItemResponse(
        success=True,
        item=ShopItemResponse.model_validate(item),
        coins_spent=item.price,
        remaining_coins=current_user.coins,
        message=f"Purchased {item.name}!",
    )


@router.get("/inventory", response_model=list[InventoryItemResponse])
async def get_inventory(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return current user's inventory."""
    result = await db.execute(
        select(UserInventory)
        .options(selectinload(UserInventory.item))
        .where(UserInventory.user_id == current_user.id)
        .order_by(UserInventory.acquired_at.desc())
    )
    return result.scalars().all()


@router.get("/balance")
async def get_balance(
    current_user: User = Depends(get_current_user),
):
    """Return current coin balance."""
    return {"coins": current_user.coins or 0}

@router.post("/equip/{item_id}", response_model=UserResponse)
async def equip_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Equip an item from the user's inventory."""
    # Check if user owns the item
    result = await db.execute(
        select(UserInventory)
        .options(selectinload(UserInventory.item))
        .where(UserInventory.user_id == current_user.id, UserInventory.item_id == item_id)
    )
    inv = result.scalar_one_or_none()
    if not inv or not inv.item:
        raise HTTPException(status_code=400, detail="You do not own this item.")
    
    # Store in equipped_items dict by item_type
    eq = dict(current_user.equipped_items) if current_user.equipped_items else {}
    eq[inv.item.item_type] = inv.item.id
    current_user.equipped_items = eq

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/unequip/{item_type}", response_model=UserResponse)
async def unequip_item(
    item_type: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Unequip an item type."""
    eq = dict(current_user.equipped_items) if current_user.equipped_items else {}
    if item_type in eq:
        del eq[item_type]
        current_user.equipped_items = eq
        await db.commit()
        await db.refresh(current_user)
        
    return current_user
