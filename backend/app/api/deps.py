from typing import Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo.database import Database
from app.core.database import get_db
from app.core.security import decode_access_token
from app.db.serializers import build_id_query

security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    auth_header: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Database = Depends(get_db)
) -> Dict[str, Any]:
    if not auth_header or not auth_header.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(auth_header.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = str(payload["sub"])
    query = build_id_query(user_id_str)
    user_doc = db.users.find_one(query)
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Normalize user object for downstream use
    return {
        "id": str(user_doc.get("_id", user_doc.get("id"))),
        "email": user_doc.get("email"),
        "full_name": user_doc.get("full_name"),
        "created_at": user_doc.get("created_at"),
        "_raw": user_doc
    }
