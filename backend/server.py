from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Urlaubsplaner API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class VacationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class VacationType(str, Enum):
    URLAUB = "urlaub"
    KRANKHEIT = "krankheit"
    FORTBILDUNG = "fortbildung"
    SONDERURLAUB = "sonderurlaub"

class UserRole(str, Enum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    ADMIN = "admin"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    role: UserRole = UserRole.EMPLOYEE
    department: str
    vacation_days_total: int = 30
    vacation_days_used: int = 0
    manager_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str
    role: UserRole = UserRole.EMPLOYEE
    department: str
    vacation_days_total: int = 30
    manager_id: Optional[str] = None

class VacationRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    start_date: date
    end_date: date
    vacation_type: VacationType
    reason: str
    status: VacationStatus = VacationStatus.PENDING
    manager_comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    days_requested: int

class VacationRequestCreate(BaseModel):
    user_id: str
    start_date: date
    end_date: date
    vacation_type: VacationType
    reason: str

class VacationRequestUpdate(BaseModel):
    status: VacationStatus
    manager_comment: Optional[str] = None

# Helper Functions
def calculate_business_days(start_date: date, end_date: date) -> int:
    """Calculate business days between two dates"""
    from datetime import timedelta
    
    days = 0
    current = start_date
    while current <= end_date:
        if current.weekday() < 5:  # Monday = 0, Sunday = 6
            days += 1
        current += timedelta(days=1)
    return days

# User Management Routes
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    user_dict = user_data.dict()
    user_obj = User(**user_dict)
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_obj.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users():
    """Get all users"""
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.get("/users/{user_id}/vacation-balance")
async def get_vacation_balance(user_id: str):
    """Get user's vacation balance"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate used vacation days from approved requests
    approved_requests = await db.vacation_requests.find({
        "user_id": user_id, 
        "status": VacationStatus.APPROVED,
        "vacation_type": VacationType.URLAUB
    }).to_list(1000)
    
    used_days = sum(req["days_requested"] for req in approved_requests)
    remaining_days = user["vacation_days_total"] - used_days
    
    return {
        "total_days": user["vacation_days_total"],
        "used_days": used_days,
        "remaining_days": remaining_days,
        "pending_requests": len(await db.vacation_requests.find({
            "user_id": user_id, 
            "status": VacationStatus.PENDING
        }).to_list(1000))
    }

# Vacation Request Routes
@api_router.post("/vacation-requests", response_model=VacationRequest)
async def create_vacation_request(request_data: VacationRequestCreate):
    """Create a new vacation request"""
    # Get user info
    user = await db.users.find_one({"id": request_data.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate business days
    days_requested = calculate_business_days(request_data.start_date, request_data.end_date)
    
    # Check for overlapping requests
    overlapping = await db.vacation_requests.find({
        "user_id": request_data.user_id,
        "status": {"$in": [VacationStatus.PENDING, VacationStatus.APPROVED]},
        "$or": [
            {"start_date": {"$lte": request_data.end_date}, "end_date": {"$gte": request_data.start_date}}
        ]
    }).to_list(1000)
    
    if overlapping:
        raise HTTPException(status_code=400, detail="Overlapping vacation request exists")
    
    request_dict = request_data.dict()
    request_dict["user_name"] = user["name"]
    request_dict["days_requested"] = days_requested
    
    vacation_request = VacationRequest(**request_dict)
    await db.vacation_requests.insert_one(vacation_request.dict())
    return vacation_request

@api_router.get("/vacation-requests", response_model=List[VacationRequest])
async def get_vacation_requests(user_id: Optional[str] = None, status: Optional[VacationStatus] = None):
    """Get vacation requests with optional filters"""
    query = {}
    if user_id:
        query["user_id"] = user_id
    if status:
        query["status"] = status
    
    requests = await db.vacation_requests.find(query).sort("created_at", -1).to_list(1000)
    return [VacationRequest(**req) for req in requests]

@api_router.get("/vacation-requests/{request_id}", response_model=VacationRequest)
async def get_vacation_request(request_id: str):
    """Get vacation request by ID"""
    request = await db.vacation_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Vacation request not found")
    return VacationRequest(**request)

@api_router.put("/vacation-requests/{request_id}", response_model=VacationRequest)
async def update_vacation_request(request_id: str, update_data: VacationRequestUpdate):
    """Update vacation request (approve/reject)"""
    request = await db.vacation_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Vacation request not found")
    
    update_dict = update_data.dict()
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.vacation_requests.update_one(
        {"id": request_id},
        {"$set": update_dict}
    )
    
    updated_request = await db.vacation_requests.find_one({"id": request_id})
    return VacationRequest(**updated_request)

@api_router.delete("/vacation-requests/{request_id}")
async def delete_vacation_request(request_id: str):
    """Delete vacation request"""
    request = await db.vacation_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Vacation request not found")
    
    if request["status"] != VacationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cannot delete non-pending request")
    
    await db.vacation_requests.delete_one({"id": request_id})
    return {"message": "Vacation request deleted successfully"}

# Calendar and Dashboard Routes
@api_router.get("/calendar")
async def get_calendar_data(start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get calendar data for vacation overview"""
    query = {"status": VacationStatus.APPROVED}
    
    if start_date and end_date:
        query["$or"] = [
            {"start_date": {"$lte": end_date}, "end_date": {"$gte": start_date}}
        ]
    
    approved_requests = await db.vacation_requests.find(query).to_list(1000)
    
    calendar_events = []
    for req in approved_requests:
        calendar_events.append({
            "id": req["id"],
            "title": f"{req['user_name']} - {req['vacation_type']}",
            "start": req["start_date"],
            "end": req["end_date"],
            "user_id": req["user_id"],
            "vacation_type": req["vacation_type"]
        })
    
    return calendar_events

@api_router.get("/dashboard/{user_id}")
async def get_user_dashboard(user_id: str):
    """Get dashboard data for user"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get vacation balance
    balance = await get_vacation_balance(user_id)
    
    # Get recent requests
    recent_requests = await db.vacation_requests.find({
        "user_id": user_id
    }).sort("created_at", -1).limit(5).to_list(5)
    
    # Get upcoming vacations
    upcoming_vacations_cursor = db.vacation_requests.find({
        "user_id": user_id,
        "status": VacationStatus.APPROVED,
        "start_date": {"$gte": datetime.now().date().isoformat()}
    }).sort("start_date", 1).limit(10)
    
    upcoming_vacations = await upcoming_vacations_cursor.to_list(10)
    
    return {
        "user": User(**user),
        "vacation_balance": balance,
        "recent_requests": [VacationRequest(**req) for req in recent_requests],
        "upcoming_vacations": [VacationRequest(**req) for req in upcoming_vacations]
    }

@api_router.get("/manager/pending-requests")
async def get_pending_requests_for_manager(manager_id: str):
    """Get pending requests for manager to approve"""
    # Get users managed by this manager
    managed_users = await db.users.find({"manager_id": manager_id}).to_list(1000)
    user_ids = [user["id"] for user in managed_users]
    
    pending_requests = await db.vacation_requests.find({
        "user_id": {"$in": user_ids},
        "status": VacationStatus.PENDING
    }).sort("created_at", 1).to_list(1000)
    
    return [VacationRequest(**req) for req in pending_requests]

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "Urlaubsplaner API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)