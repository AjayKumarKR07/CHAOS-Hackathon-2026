from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.db.serializers import serialize_note, build_id_query

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.get("", response_model=List[NoteResponse])
def get_notes(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    cursor = db.notes.find({"user_id": str(current_user["id"])}).sort("created_at", -1)
    return [NoteResponse.model_validate(serialize_note(doc)) for doc in cursor]

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    note_in: NoteCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    note_doc = {
        "user_id": str(current_user["id"]),
        "title": note_in.title.strip(),
        "content": note_in.content.strip(),
        "created_at": now,
        "updated_at": now
    }
    result = db.notes.insert_one(note_doc)
    note_doc["_id"] = result.inserted_id
    return NoteResponse.model_validate(serialize_note(note_doc))

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    base_query = build_id_query(note_id)
    query = {"$and": [base_query, {"user_id": str(current_user["id"])}]}

    result = db.notes.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    return None
