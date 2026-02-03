import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from agent import EmailAgent
from email_service import EmailService

# Load environment variables
load_dotenv(override=True)
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    print(f"DEBUG: GEMINI_API_KEY loaded successfully (length: {len(api_key)})")
else:
    print("DEBUG: GEMINI_API_KEY NOT found in environment")

app = FastAPI(title="Agentic Email App")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for debugging
    allow_credentials=False, # Must be False when allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
email_service = EmailService()
agent = EmailAgent(email_service) 

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []
    recipients: Optional[List[str]] = None

@app.get("/")
async def root():
    return {"message": "Agentic Email Backend is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/auth/status")
def auth_status():
    """Check if email service is authenticated"""
    status = email_service.get_auth_status()
    return status

@app.post("/api/auth/init")
async def init_auth():
    """Initialize OAuth flow (local development only)"""
    try:
        # This will trigger the OAuth flow if needed
        service = email_service.authenticate()
        return {
            "success": True,
            "message": "Authentication successful. You can now send emails."
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Authentication failed: {str(e)}"
        )

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response = await agent.process_message(
            request.message, 
            request.history,
            request.recipients
        )
        return {"response": response}
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
