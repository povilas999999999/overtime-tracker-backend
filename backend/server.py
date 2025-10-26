from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import base64
import io
import litellm
from litellm import completion
import asyncio
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get('DB_NAME', 'overtime_tracker')
db = client[db_name]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class WorkSchedule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    work_days: List[dict]  # [{"date": "2025-01-15", "start": "09:00", "end": "17:00"}]
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    pdf_filename: str

class AppSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reminder_interval: int = 15  # minutes
    reminder_duration: int = 10  # seconds
    work_location: Optional[dict] = None  # {"latitude": 0, "longitude": 0, "radius": 100}
    recipient_email: str = "povilas999999999@yahoo.com"
    email_subject: str = "Prašau apmokėti už viršvalandžius"
    email_body_template: str = """Sveiki,

Prašau apmokėti už viršvalandžius.

Data: {date}
Darbo pradžia: {start_time}
Darbo pabaiga: {end_time}
Viršvalandžiai: {overtime_hours} val. ({overtime_minutes} min.)

Pridėtos {photo_count} darbo nuotraukos.

Pagarbiai"""
    geofence_radius: int = 100  # meters
    overtime_threshold_minutes: int = 5  # minutes to wait after scheduled end before sending email
    end_of_day_reminder_minutes: int = 15  # minutes before scheduled end to start reminding
    auto_send_email_on_geofence: bool = False  # if False, ask user; if True, send automatically
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class WorkSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    start_time: datetime
    end_time: Optional[datetime] = None
    photos: List[str] = []  # base64 encoded photos
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    overtime_minutes: Optional[int] = None
    email_sent: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PDFUploadRequest(BaseModel):
    pdf_base64: str
    filename: str

class ImageUploadRequest(BaseModel):
    image_base64: str

class ManualScheduleRequest(BaseModel):
    work_days: List[dict]  # [{\"date\": \"2025-01-15\", \"start\": \"09:00\", \"end\": \"17:00\"}]

class SettingsUpdate(BaseModel):
    reminder_interval: Optional[int] = None
    reminder_duration: Optional[int] = None
    work_location: Optional[dict] = None
    recipient_email: Optional[str] = None
    email_subject: Optional[str] = None
    email_body_template: Optional[str] = None
    geofence_radius: Optional[int] = None
    overtime_threshold_minutes: Optional[int] = None
    end_of_day_reminder_minutes: Optional[int] = None
    auto_send_email_on_geofence: Optional[bool] = None

class PhotoUpload(BaseModel):
    session_id: str
    photo_base64: str

class WorkSessionStart(BaseModel):
    date: str
    latitude: float
    longitude: float
    start_timestamp: str  # ISO format timestamp from frontend

class WorkSessionEnd(BaseModel):
    session_id: str
    latitude: float
    longitude: float

class WorkSessionEdit(BaseModel):
    session_id: str
    start_time: str  # ISO format
    end_time: Optional[str] = None  # ISO format
    date: str

class EmailSendRequest(BaseModel):
    session_id: str

# Helper Functions
# PDF/Image AI parsing removed to avoid emergentintegrations dependency
# Use manual schedule entry endpoint instead: /api/schedule/manual

def send_email_with_photos(recipient: str, subject: str, body: str, photos: List[str]):
    """Send email with photos attached using Gmail SMTP"""
    try:
        sender_email = os.getenv('SENDER_EMAIL', 'pauliusbosas.nvc@gmail.com')
        sender_password = os.getenv('SENDER_PASSWORD', 'afsgfbwuirqgyafg')
        
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        # Attach photos
        for idx, photo_base64 in enumerate(photos):
            try:
                # Decode base64 photo
                photo_data = base64.b64decode(photo_base64.split(',')[1] if ',' in photo_base64 else photo_base64)
                
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(photo_data)
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f'attachment; filename=darbo_nuotrauka_{idx+1}.jpg')
                msg.attach(part)
            except Exception as e:
                logger.error(f"Error attaching photo {idx}: {str(e)}")
        
        # Connect to Gmail SMTP with SSL
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {recipient}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Overtime Tracking API"}

# PDF upload endpoint removed - use /api/schedule/manual instead

@api_router.get("/schedule/current")
async def get_current_schedule():
    """Get the most recent schedule"""
    schedule = await db.schedules.find_one(sort=[("uploaded_at", -1)])
    if not schedule:
        return {"schedule": None}
    return {"schedule": WorkSchedule(**schedule).dict()}

@api_router.delete("/schedule/{schedule_id}")
async def delete_schedule(schedule_id: str):
    """Delete a schedule"""
    result = await db.schedules.delete_one({"id": schedule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"success": True, "message": "Schedule deleted"}

@api_router.post("/schedule/upload-file")
async def upload_schedule_file(request: dict):
    """Upload Excel/CSV/TXT file with work schedule
    
    Request body:
        file_content: base64 encoded file
        file_name: filename (e.g., schedule.csv)
        year: (optional) year for day-number format (default: current year)
        month: (optional) month for day-number format (default: current month)
    """
    try:
        file_content = request.get('file_content')  # base64 encoded
        file_name = request.get('file_name', 'schedule.csv')
        year = request.get('year')  # optional
        month = request.get('month')  # optional
        
        if not file_content:
            raise HTTPException(status_code=400, detail="No file content provided")
        
        # Decode base64
        file_data = base64.b64decode(file_content.split(',')[1] if ',' in file_content else file_content)
        
        # Determine file type
        file_ext = file_name.lower().split('.')[-1]
        
        # Prepare year_month tuple
        year_month = None
        if year and month:
            year_month = (int(year), int(month))
        
        work_days = []
        
        if file_ext in ['xlsx', 'xls']:
            # Excel file
            import pandas as pd
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_ext}') as tmp:
                tmp.write(file_data)
                tmp_path = tmp.name
            
            try:
                df = pd.read_excel(tmp_path)
                work_days = parse_dataframe_to_schedule(df, year_month)
            finally:
                os.unlink(tmp_path)
                
        elif file_ext == 'csv':
            # CSV file
            import pandas as pd
            import io
            df = pd.read_csv(io.BytesIO(file_data))
            work_days = parse_dataframe_to_schedule(df, year_month)
            
        elif file_ext == 'txt':
            # TXT file - expect format: date,start,end per line
            text_content = file_data.decode('utf-8')
            lines = text_content.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                    
                parts = [p.strip() for p in line.split(',')]
                if len(parts) >= 3:
                    work_days.append({
                        'date': parts[0],
                        'start': parts[1],
                        'end': parts[2]
                    })
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")
        
        if not work_days:
            raise HTTPException(status_code=400, detail="No valid schedule data found in file")
        
        # Save to database
        schedule = WorkSchedule(
            work_days=work_days,
            pdf_filename=file_name
        )
        await db.schedules.insert_one(schedule.dict())
        
        return {"success": True, "schedule": schedule.dict(), "parsed_days": len(work_days)}
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

def parse_dataframe_to_schedule(df, year_month=None):
    """Parse pandas DataFrame to schedule format
    
    Supports formats:
    1. Full date format: date (YYYY-MM-DD), start (HH:MM), end (HH:MM)
    2. Day number format: day (1-31), start (HH:MM), end (HH:MM)
    3. Multi-month format: Multiple rows with day numbers spanning multiple months
    
    Args:
        df: pandas DataFrame
        year_month: Optional tuple (year, month) for day number format. 
                   If None, uses current year and month.
    """
    from datetime import datetime
    from calendar import monthrange
    work_days = []
    
    # Find columns
    day_col = None
    start_col = None
    end_col = None
    
    for col in df.columns:
        col_lower = str(col).lower().strip()
        if 'day' in col_lower or 'diena' in col_lower:
            day_col = col
        elif 'date' in col_lower or 'data' in col_lower:
            day_col = col
        elif 'start' in col_lower or 'pradž' in col_lower or 'prad' in col_lower:
            start_col = col
        elif 'end' in col_lower or 'pabaig' in col_lower or 'pab' in col_lower:
            end_col = col
    
    # If not found, use first 3 columns
    if not day_col and len(df.columns) >= 1:
        day_col = df.columns[0]
    if not start_col and len(df.columns) >= 2:
        start_col = df.columns[1]
    if not end_col and len(df.columns) >= 3:
        end_col = df.columns[2]
    
    if not (day_col and start_col and end_col):
        raise ValueError("Could not identify day/date, start, and end columns")
    
    # Determine starting year and month
    if not year_month:
        now = datetime.now()
        current_year, current_month = now.year, now.month
    else:
        current_year, current_month = year_month
    
    # Track current month for multi-month detection
    working_year = current_year
    working_month = current_month
    last_day_num = 0
    
    for idx, row in df.iterrows():
        try:
            day_val = str(row[day_col]).strip()
            start_val = str(row[start_col]).strip()
            end_val = str(row[end_col]).strip()
            
            # Skip empty rows
            if day_val in ['', 'nan', 'NaN', 'None']:
                continue
            
            # Skip rows with P, M, A, BN markers (non-work days)
            if end_val.upper() in ['P', 'M', 'A', 'BN'] or start_val.upper() in ['P', 'M', 'A', 'BN']:
                logger.debug(f"Skipping non-work day: {day_val}")
                continue
            
            # Skip rows with empty or invalid start time
            if start_val in ['', 'nan', 'NaN', 'None', '00:00']:
                logger.debug(f"Skipping day {day_val} - no valid start time")
                continue
            
            # Check if day_val is a full date or just day number
            if '-' in day_val or '/' in day_val:
                # Full date format
                date_str = day_val
            else:
                # Day number format - convert to full date
                try:
                    day_num = int(float(day_val))  # float first to handle "1.0"
                    
                    if not (1 <= day_num <= 31):
                        logger.warning(f"Invalid day number: {day_val}")
                        continue
                    
                    # Multi-month detection: if day number goes backwards, move to next month
                    if last_day_num > 0 and day_num < last_day_num:
                        # Day number decreased - likely new month
                        working_month += 1
                        if working_month > 12:
                            working_month = 1
                            working_year += 1
                        logger.info(f"🔄 DETECTED NEW MONTH: {working_year}-{working_month:02d} (day went from {last_day_num} to {day_num})")
                    
                    # Check if day_num is valid for this month
                    max_day = monthrange(working_year, working_month)[1]
                    if day_num > max_day:
                        logger.warning(f"Day {day_num} invalid for {working_year}-{working_month:02d} (max: {max_day})")
                        continue
                    
                    date_str = f"{working_year:04d}-{working_month:02d}-{day_num:02d}"
                    last_day_num = day_num
                    
                except ValueError:
                    logger.warning(f"Could not parse day: {day_val}")
                    continue
            
            work_days.append({
                'date': date_str,
                'start': start_val,
                'end': end_val
            })
            
        except Exception as e:
            logger.warning(f"Skipping row due to error: {e}")
            continue
    
    logger.info(f"Successfully parsed {len(work_days)} work days")
    return work_days

@api_router.post("/schedule/manual")
async def upload_manual_schedule(request: ManualScheduleRequest):
    """Upload manually entered schedule"""
    try:
        # Validate work_days
        if not request.work_days or len(request.work_days) == 0:
            raise HTTPException(status_code=400, detail="No work days provided")
        
        # Save to database
        schedule = WorkSchedule(
            work_days=request.work_days,
            pdf_filename="manual_entry"
        )
        await db.schedules.insert_one(schedule.dict())
        
        return {"success": True, "schedule": schedule.dict()}
        
    except Exception as e:
        logger.error(f"Error saving manual schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save schedule: {str(e)}")

@api_router.post("/settings")
async def update_settings(settings: SettingsUpdate):
    """Update app settings"""
    # Get existing settings or create new
    existing = await db.settings.find_one()
    
    if existing:
        # Update existing
        update_data = {k: v for k, v in settings.dict().items() if v is not None}
        update_data['updated_at'] = datetime.utcnow()
        await db.settings.update_one({"id": existing["id"]}, {"$set": update_data})
        updated = await db.settings.find_one({"id": existing["id"]})
        return {"success": True, "settings": AppSettings(**updated).dict()}
    else:
        # Create new
        new_settings = AppSettings(**settings.dict(exclude_none=True))
        await db.settings.insert_one(new_settings.dict())
        return {"success": True, "settings": new_settings.dict()}

@api_router.get("/settings")
async def get_settings():
    """Get app settings"""
    settings = await db.settings.find_one()
    if not settings:
        # Return defaults
        default_settings = AppSettings()
        await db.settings.insert_one(default_settings.dict())
        return {"settings": default_settings.dict()}
    return {"settings": AppSettings(**settings).dict()}

@api_router.post("/session/start")
async def start_work_session(request: WorkSessionStart):
    """Start a work session"""
    # Get current schedule to find expected times
    schedule = await db.schedules.find_one(sort=[("uploaded_at", -1)])
    
    scheduled_times = None
    if schedule:
        work_days = schedule.get('work_days', [])
        for day in work_days:
            if day['date'] == request.date:
                scheduled_times = {"start": day['start'], "end": day['end']}
                break
    
    # Use timestamp from frontend (already in local timezone)
    start_time = datetime.fromisoformat(request.start_timestamp.replace('Z', '+00:00'))
    
    session = WorkSession(
        date=request.date,
        start_time=start_time,
        scheduled_start=scheduled_times['start'] if scheduled_times else None,
        scheduled_end=scheduled_times['end'] if scheduled_times else None
    )
    
    await db.sessions.insert_one(session.dict())
    return {"success": True, "session": session.dict()}

@api_router.post("/session/end")
async def end_work_session(request: WorkSessionEnd):
    """End a work session and calculate overtime"""
    session = await db.sessions.find_one({"id": request.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # FIXED: Use Lithuania timezone (UTC+2/UTC+3)
    from datetime import timedelta, timezone
    lithuania_tz = timezone(timedelta(hours=2))  # EET (UTC+2) - Winter
    # TODO: Handle EEST (UTC+3) for summer - for now using +2
    
    # Get current time in Lithuania timezone
    end_time = datetime.now(lithuania_tz)
    
    start_time = session['start_time']
    
    # Ensure start_time has timezone info
    if start_time.tzinfo is None:
        # If start_time is naive, assume it's in Lithuania time
        start_time = start_time.replace(tzinfo=lithuania_tz)
    
    overtime_minutes = 0
    if session.get('scheduled_end'):
        # Calculate overtime based on actual end time vs scheduled end time
        from datetime import datetime as dt
        
        # Get scheduled end time
        scheduled_end_str = session['scheduled_end']  # "HH:MM"
        scheduled_end_time = dt.strptime(scheduled_end_str, "%H:%M").time()
        
        # Combine with today's date in Lithuania timezone
        scheduled_end_datetime = datetime.combine(end_time.date(), scheduled_end_time)
        scheduled_end_datetime = scheduled_end_datetime.replace(tzinfo=lithuania_tz)
        
        # Calculate overtime: how many minutes AFTER scheduled end time
        overtime_seconds = (end_time - scheduled_end_datetime).total_seconds()
        overtime_minutes = max(0, int(overtime_seconds / 60))
        
        logger.info(f"Overtime calculation: end_time={end_time}, scheduled_end={scheduled_end_datetime}, overtime_minutes={overtime_minutes}")
    
    # Update session
    await db.sessions.update_one(
        {"id": request.session_id},
        {"$set": {
            "end_time": end_time,
            "overtime_minutes": overtime_minutes
        }}
    )
    
    updated_session = await db.sessions.find_one({"id": request.session_id})
    return {"success": True, "session": WorkSession(**updated_session).dict()}

@api_router.post("/session/photo")
async def add_session_photo(request: PhotoUpload):
    """Add a photo to a work session"""
    session = await db.sessions.find_one({"id": request.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Add photo to session
    photos = session.get('photos', [])
    photos.append(request.photo_base64)
    
    await db.sessions.update_one(
        {"id": request.session_id},
        {"$set": {"photos": photos}}
    )
    
    return {"success": True, "photo_count": len(photos)}

@api_router.get("/session/active")
async def get_active_session():
    """Get the current active session"""
    # Find session without end_time
    session = await db.sessions.find_one({"end_time": None}, sort=[("start_time", -1)])
    if not session:
        return {"session": None}
    return {"session": WorkSession(**session).dict()}

@api_router.post("/email/send")
async def send_overtime_email(request: EmailSendRequest):
    """Send overtime email with photos"""
    session = await db.sessions.find_one({"id": request.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    settings = await db.settings.find_one()
    if not settings:
        settings = AppSettings().dict()
    
    recipient = settings.get('recipient_email', 'povilas999999999@yahoo.com')
    subject = settings.get('email_subject', 'Prašau apmokėti už viršvalandžius')
    email_template = settings.get('email_body_template', AppSettings().email_body_template)
    
    overtime_minutes = session.get('overtime_minutes', 0)
    overtime_hours = overtime_minutes / 60
    
    # Get timezone from settings (default Lithuania UTC+2)
    timezone_offset = settings.get('timezone_offset', 2)  # hours
    from datetime import timedelta, timezone as tz
    user_timezone = tz(timedelta(hours=timezone_offset))
    
    # Use SCHEDULED times from work schedule, not actual button press times!
    scheduled_start = session.get('scheduled_start', 'N/A')  # HH:MM format from schedule
    scheduled_end = session.get('scheduled_end', 'N/A')  # HH:MM format from schedule
    
    # Get actual end time and convert to user timezone
    end_time = session.get('end_time')
    if end_time:
        if end_time.tzinfo is None:
            # If naive, assume UTC
            end_time = end_time.replace(tzinfo=tz.utc)
        # Convert to user timezone
        end_time = end_time.astimezone(user_timezone)
        actual_end_str = end_time.strftime('%H:%M')
    else:
        actual_end_str = 'N/A'
    
    # Format the email body using the template
    body_text = email_template.format(
        date=session['date'],
        start_time=scheduled_start,  # FIXED: Use scheduled start from work schedule!
        end_time=actual_end_str,  # Use actual end time with correct timezone
        overtime_hours=f"{overtime_hours:.2f}",
        overtime_minutes=overtime_minutes,
        photo_count=len(session.get('photos', []))
    )
    
    # Convert to HTML
    body_html = f"""
    <html>
    <body>
        <pre style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
{body_text}
        </pre>
    </body>
    </html>
    """
    
    send_email_with_photos(recipient, subject, body_html, session.get('photos', []))
    
    # Mark email as sent
    await db.sessions.update_one(
        {"id": request.session_id},
        {"$set": {"email_sent": True}}
    )
    
    return {"success": True, "message": "Email sent successfully"}

@api_router.get("/sessions/history")
async def get_session_history(limit: int = 30):
    """Get work session history"""
    sessions = await db.sessions.find().sort("start_time", -1).limit(limit).to_list(limit)
    return {"sessions": [WorkSession(**s).dict() for s in sessions]}

@api_router.post("/session/edit")
async def edit_work_session(request: WorkSessionEdit):
    """Edit work session times"""
    session = await db.sessions.find_one({"id": request.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Parse new times from frontend
    new_start = datetime.fromisoformat(request.start_time.replace('Z', '+00:00'))
    new_end = datetime.fromisoformat(request.end_time.replace('Z', '+00:00')) if request.end_time else None
    
    # Recalculate overtime if both times present
    overtime_minutes = 0
    if new_end and session.get('scheduled_start') and session.get('scheduled_end'):
        actual_minutes = int((new_end - new_start).total_seconds() / 60)
        scheduled_start = datetime.strptime(session['scheduled_start'], "%H:%M")
        scheduled_end = datetime.strptime(session['scheduled_end'], "%H:%M")
        expected_minutes = int((scheduled_end - scheduled_start).total_seconds() / 60)
        overtime_minutes = max(0, actual_minutes - expected_minutes)
    
    # Update session
    update_data = {
        "start_time": new_start,
        "date": request.date
    }
    if new_end:
        update_data["end_time"] = new_end
        update_data["overtime_minutes"] = overtime_minutes
    
    await db.sessions.update_one(
        {"id": request.session_id},
        {"$set": update_data}
    )
    
    updated_session = await db.sessions.find_one({"id": request.session_id})
    return {"success": True, "session": WorkSession(**updated_session).dict()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
