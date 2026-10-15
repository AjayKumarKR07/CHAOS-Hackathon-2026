from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.auth import UserRegister, UserLogin, UserResponse, TokenResponse
from app.api.deps import get_current_user
from app.db.serializers import serialize_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Database = Depends(get_db)):
    email_clean = user_in.email.lower().strip()
    
    # Check duplicate email
    existing_user = db.users.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Securely hash password
    hashed_pwd = get_password_hash(user_in.password)

    user_doc = {
        "full_name": user_in.full_name.strip(),
        "email": email_clean,
        "password_hash": hashed_pwd,
        "created_at": datetime.now(timezone.utc)
    }
    
    try:
        result = db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_data = serialize_user(user_doc)
    token = create_access_token(subject=user_data["id"])
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user_data)
    )

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Database = Depends(get_db)):
    email_clean = login_in.email.lower().strip()
    user_doc = db.users.find_one({"email": email_clean})
    
    if not user_doc or not verify_password(login_in.password, user_doc.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    user_data = serialize_user(user_doc)
    token = create_access_token(subject=user_data["id"])
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user_data)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        full_name=current_user["full_name"],
        email=current_user["email"],
        created_at=current_user["created_at"]
    )

@router.post("/logout")
def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"message": "Successfully logged out."}
