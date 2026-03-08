import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, UserResponse, TokenResponse, UpdateProfile, ChangePassword
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_unverified,
    create_email_verification_token,
    decode_email_verification_token,
)
from datetime import timedelta
from app.config import settings
from app.routers.send_email import send_html_email, build_verification_email_html

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def _build_verify_url(token: str) -> str:
    return f"{settings.backend_base_url.rstrip('/')}/api/v1/auth/verify-email?token={token}"


async def _send_verification_email(user: User):
    verify_token = create_email_verification_token(user.id, user.email)
    verify_url = _build_verify_url(verify_token)
    html = build_verification_email_html(user.display_name or user.username, verify_url)
    await asyncio.to_thread(
        send_html_email,
        user.email,
        "Verify Calculus Account",
        html,
    )

@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check existing user
    result = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Create user
    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        display_name=data.display_name or data.username,
        is_active=not settings.require_email_verification,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    if settings.require_email_verification:
        try:
            await _send_verification_email(user)
        except Exception as exc:
            logger.exception("Failed to send verification email for user_id=%s", user.id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Account created but failed to send verification email. Please try resend verification.",
            ) from exc
    
    # Generate token
    token = create_access_token({"sub": str(user.id)})
    
    return TokenResponse(token=token, user=UserResponse.model_validate(user))

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Allow login even if email not verified - frontend will show verification UI
    # if not user.is_active:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Email not verified. Please check your inbox."
    #     )
    
    # Determine token expiry based on "remember me"
    if getattr(data, 'remember', False):
        access_expires = timedelta(days=30)
    else:
        access_expires = timedelta(minutes=settings.access_token_expire_minutes)

    token = create_access_token({"sub": str(user.id)}, expires_delta=access_expires)

    # Set HttpOnly cookie so browser stores the token (used for "remember me")
    secure_flag = not settings.debug
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=secure_flag,
        samesite="lax",
        max_age=int(access_expires.total_seconds()),
        path="/"
    )

    return TokenResponse(token=token, user=UserResponse.model_validate(user))

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user_unverified)):
    """Get current user info - allows unverified users to check their status"""
    return UserResponse.model_validate(current_user)

@router.post("/logout")
async def logout(response: Response):
    # Clear auth cookie
    response.delete_cookie("access_token", path="/")
    return {"success": True}


@router.get("/verify-email")
async def verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    payload = decode_email_verification_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id or not email:
        raise HTTPException(status_code=400, detail="Invalid verification token payload")

    result = await db.execute(select(User).where(User.id == int(user_id), User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_active:
        return {"success": True, "message": "Email already verified"}

    user.is_active = True
    await db.commit()
    return {"success": True, "message": "Email verified successfully. You can now log in."}


@router.post("/resend-verification")
async def resend_verification(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_unverified)
):
    """Resend verification email - allows unverified users"""
    if current_user.is_active:
        return {"success": True, "message": "Email already verified"}

    try:
        await _send_verification_email(current_user)
    except Exception as exc:
        logger.exception("Failed to resend verification email for user_id=%s", current_user.id)
        raise HTTPException(status_code=500, detail="Failed to send verification email") from exc

    return {"success": True, "message": "Verification email sent"}

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: UpdateProfile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(User.id == current_user.id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.display_name is not None:
        user.display_name = data.display_name
        
    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)

@router.put("/change-password")
async def change_password(
    data: ChangePassword,
    db: AsyncSession = Depends(get_db),  # Using AsyncSession for async operations
    current_user: User = Depends(get_current_user),
):
    # Use await and select instead of db.query
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    user.hashed_password = hash_password(data.new_password)
    
    await db.commit()  # Wait for commit to finish
    return {"success": True, "message": "Password changed successfully"}