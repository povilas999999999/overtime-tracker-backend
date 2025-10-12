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
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
import asyncio
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

class PhotoUpload(BaseModel):
    session_id: str
    photo_base64: str

class WorkSessionStart(BaseModel):
    date: str
    latitude: float
    longitude: float

class WorkSessionEnd(BaseModel):
    session_id: str
    latitude: float
    longitude: float

class EmailSendRequest(BaseModel):
    session_id: str

# Helper Functions
async def parse_pdf_schedule(pdf_path: str) -> List[dict]:
    """Parse work schedule from PDF using AI"""
    try:
        emergent_key = os.getenv('EMERGENT_LLM_KEY')
        if not emergent_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment")
        
        # Initialize chat with Gemini (supports file attachments)
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"pdf-parse-{uuid.uuid4()}",
            system_message="You are an expert at extracting work schedule information from documents."
        ).with_model("gemini", "gemini-2.0-flash")
        
        # Create file attachment
        pdf_file = FileContentWithMimeType(
            file_path=pdf_path,
            mime_type="application/pdf"
        )
        
        # Ask AI to extract schedule
        message = UserMessage(
            text="""Extract the work schedule from this PDF. 
            Return ONLY a JSON array with this exact format:
            [{"date": "YYYY-MM-DD", "start": "HH:MM", "end": "HH:MM"}, ...]
            
            Rules:
            - Use 24-hour time format
            - Include only future dates or current month dates
            - If no specific dates, assume next 30 days
            - Return valid JSON only, no additional text""",
            file_contents=[pdf_file]
        )
        
        response = await chat.send_message(message)
        logger.info(f"AI Response: {response}")
        
        # Parse response
        import json
        # Extract JSON from response (handle markdown code blocks)
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        schedule = json.loads(response_text)
        return schedule
        
    except Exception as e:
        logger.error(f"Error parsing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

def send_email_with_photos(recipient: str, subject: str, body: str, photos: List[str]):
    """Send email with photos attached"""
    try:
        sender_email = os.getenv('SENDER_EMAIL', 'paulius.bosas@nvc.santa.lt')
        sender_password = os.getenv('SENDER_PASSWORD', 'Pavasaris2025!')
        
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
        
        # Connect to Outlook SMTP
        with smtplib.SMTP('smtp-mail.outlook.com', 587) as server:
            server.starttls()
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

@api_router.post("/schedule/upload")
async def upload_schedule(request: PDFUploadRequest):
    """Upload and parse work schedule PDF"""
    try:
        # Decode base64 PDF
        pdf_data = base64.b64decode(request.pdf_base64.split(',')[1] if ',' in request.pdf_base64 else request.pdf_base64)
        
        # Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(pdf_data)
            tmp_path = tmp_file.name
        
        try:
            # Parse with AI
            work_days = await parse_pdf_schedule(tmp_path)
            
            # Save to database
            schedule = WorkSchedule(
                work_days=work_days,
                pdf_filename=request.filename
            )
            await db.schedules.insert_one(schedule.dict())
            
            return {"success": True, "schedule": schedule.dict()}
        finally:
            # Clean up temp file
            os.unlink(tmp_path)
            
    except Exception as e:
        logger.error(f"Error uploading schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/schedule/current")
async def get_current_schedule():
    """Get the most recent schedule"""
    schedule = await db.schedules.find_one(sort=[("uploaded_at", -1)])
    if not schedule:
        return {"schedule": None}
    return {"schedule": WorkSchedule(**schedule).dict()}

@api_router.post("/schedule/upload-image")
async def upload_schedule_image(request: ImageUploadRequest):
    """Upload and parse work schedule from image using OCR"""
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image_base64.split(',')[1] if ',' in request.image_base64 else request.image_base64)
        
        # Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            tmp_file.write(image_data)
            tmp_path = tmp_file.name
        
        try:
            emergent_key = os.getenv('EMERGENT_LLM_KEY')
            if not emergent_key:
                raise ValueError("EMERGENT_LLM_KEY not found in environment")
            
            # Initialize chat with Gemini (supports image)
            session_id_str = f"image-ocr-{uuid.uuid4()}"
            chat = LlmChat(
                api_key=emergent_key,
                session_id=session_id_str,
                system_message="You are an expert at extracting work schedule information from images."
            ).with_model("gemini", "gemini-2.0-flash")
            
            # Create file attachment
            image_file = FileContentWithMimeType(
                file_path=tmp_path,
                mime_type="image/jpeg"
            )
            
            # Ask AI to extract schedule
            prompt_text = "Extract the work schedule from this image. Return ONLY a JSON array with format: [{date: YYYY-MM-DD, start: HH:MM, end: HH:MM}]. Use 24-hour time. Return valid JSON only."
            
            message = UserMessage(
                text=prompt_text,
                file_contents=[image_file]
            )
            
            response = await chat.send_message(message)
            logger.info(f"AI Response: {response}")
            
            # Parse response
            import json
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            work_days = json.loads(response_text)
            
            # Save to database
            schedule = WorkSchedule(
                work_days=work_days,
                pdf_filename="schedule_image.jpg"
            )
            await db.schedules.insert_one(schedule.dict())
            
            return {"success": True, "schedule": schedule.dict()}
        finally:
            # Clean up temp file
            os.unlink(tmp_path)
            
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

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
    
    session = WorkSession(
        date=request.date,
        start_time=datetime.utcnow(),
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
    
    end_time = datetime.utcnow()
    start_time = session['start_time']
    actual_minutes = int((end_time - start_time).total_seconds() / 60)
    
    overtime_minutes = 0
    if session.get('scheduled_start') and session.get('scheduled_end'):
        # Calculate expected work duration
        from datetime import datetime as dt
        scheduled_start = dt.strptime(session['scheduled_start'], "%H:%M")
        scheduled_end = dt.strptime(session['scheduled_end'], "%H:%M")
        expected_minutes = int((scheduled_end - scheduled_start).total_seconds() / 60)
        
        overtime_minutes = max(0, actual_minutes - expected_minutes)
    
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
    
    overtime_minutes = session.get('overtime_minutes', 0)
    overtime_hours = overtime_minutes / 60
    
    body = f"""
    <html>
    <body>
        <h2>Darbo viršvalandžių ataskaita</h2>
        <p><strong>Data:</strong> {session['date']}</p>
        <p><strong>Darbo pradžia:</strong> {session['start_time'].strftime('%H:%M')}</p>
        <p><strong>Darbo pabaiga:</strong> {session.get('end_time', datetime.utcnow()).strftime('%H:%M')}</p>
        <p><strong>Viršvalandžiai:</strong> {overtime_hours:.2f} val. ({overtime_minutes} min.)</p>
        <br>
        <p>Prašau apmokėti už viršvalandžius.</p>
        <p>Pridėtos {len(session.get('photos', []))} darbo nuotraukos.</p>
    </body>
    </html>
    """
    
    send_email_with_photos(recipient, subject, body, session.get('photos', []))
    
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
