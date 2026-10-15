from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.db.serializers import serialize_task, build_id_query

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    query: Dict[str, Any] = {"user_id": str(current_user["id"])}
    if status and status.upper() != "ALL":
        query["status"] = status.upper()
    if priority and priority.upper() != "ALL":
        query["priority"] = priority.upper()

    cursor = db.tasks.find(query).sort("created_at", -1)
    return [TaskResponse.model_validate(serialize_task(doc)) for doc in cursor]

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    task_doc = {
        "user_id": str(current_user["id"]),
        "title": task_in.title.strip(),
        "description": task_in.description,
        "status": task_in.status.upper() if task_in.status else "TODO",
        "priority": task_in.priority.upper() if task_in.priority else "MEDIUM",
        "due_at": task_in.due_at,
        "created_at": now,
        "updated_at": now
    }
    result = db.tasks.insert_one(task_doc)
    task_doc["_id"] = result.inserted_id
    return TaskResponse.model_validate(serialize_task(task_doc))

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    task_in: TaskUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    base_query = build_id_query(task_id)
    query = {"$and": [base_query, {"user_id": str(current_user["id"])}]}

    existing = db.tasks.find_one(query)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if task_in.title is not None:
        update_fields["title"] = task_in.title.strip()
    if task_in.description is not None:
        update_fields["description"] = task_in.description
    if task_in.status is not None:
        update_fields["status"] = task_in.status.upper()
    if task_in.priority is not None:
        update_fields["priority"] = task_in.priority.upper()
    if task_in.due_at is not None:
        update_fields["due_at"] = task_in.due_at

    db.tasks.update_one(query, {"$set": update_fields})
    updated = db.tasks.find_one(query)
    return TaskResponse.model_validate(serialize_task(updated))

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    base_query = build_id_query(task_id)
    query = {"$and": [base_query, {"user_id": str(current_user["id"])}]}

    result = db.tasks.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return None
