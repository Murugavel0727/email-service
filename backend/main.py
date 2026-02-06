import os
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from agent import EmailAgent
from email_service import EmailService
from session_manager import SessionManager

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

# Initialize Session Manager
session_manager = SessionManager()

# Initialize default services (for backward compatibility)
email_service = EmailService()
agent = EmailAgent(email_service)

def get_session_id(x_session_id: Optional[str] = Header(None)) -> Optional[str]:
    """Extract session ID from request headers"""
    return x_session_id
 

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
async def chat_endpoint(request: ChatRequest, session_id: Optional[str] = Header(None, alias="x-session-id")):
    try:
        # Use session-specific email service if session ID provided
        if session_id and session_manager.session_exists(session_id):
            session_email_service = EmailService(session_id=session_id)
            session_agent = EmailAgent(session_email_service)
            response = await session_agent.process_message(
                request.message, 
                request.history,
                request.recipients
            )
        else:
            # Fall back to default service for backward compatibility
            response = await agent.process_message(
                request.message, 
                request.history,
                request.recipients
            )
        return {"response": response}
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login():
    """Initiate OAuth login flow - returns auth URL for frontend to open"""
    try:
        from google_auth_oauthlib.flow import Flow
        
        # Create a new session
        session_id = session_manager.create_session()
        
        # Create OAuth flow
        flow = Flow.from_client_secrets_file(
            "credentials.json",
            scopes=[
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/gmail.readonly"
            ],
            redirect_uri="http://localhost:8000/api/auth/callback"
        )
        
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'  # Force consent to get refresh token
        )
        
        # Store state and session_id mapping temporarily
        # In production, use Redis or database
        if not hasattr(app.state, 'oauth_states'):
            app.state.oauth_states = {}
        app.state.oauth_states[state] = session_id
        
        return {
            "auth_url": auth_url,
            "session_id": session_id,
            "state": state
        }
    except Exception as e:
        print(f"Error in login endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/callback")
async def auth_callback(code: str, state: str):
    """Handle OAuth callback"""
    try:
        from google_auth_oauthlib.flow import Flow
        from fastapi.responses import HTMLResponse
        
        # Get session_id from state
        if not hasattr(app.state, 'oauth_states') or state not in app.state.oauth_states:
            return HTMLResponse(content="""
                <html>
                    <body>
                        <h1>Authentication Failed</h1>
                        <p>Invalid state parameter. Please close this window and try again.</p>
                        <script>window.close();</script>
                    </body>
                </html>
            """)
        
        session_id = app.state.oauth_states[state]
        
        # Exchange code for credentials
        flow = Flow.from_client_secrets_file(
            "credentials.json",
            scopes=[
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/gmail.readonly"
            ],
            redirect_uri="http://localhost:8000/api/auth/callback",
            state=state
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Save credentials to session-specific token file
        email_service = EmailService(session_id=session_id)
        token_file = email_service.token_file
        
        with open(token_file, 'w') as token:
            token.write(credentials.to_json())
        
        # Get user email
        user_email = email_service.get_user_email()
        
        # Update session with user email
        session_manager.update_session(session_id, user_email)
        
        # Clean up state
        del app.state.oauth_states[state]
        
        # Return HTML that closes the popup and notifies parent window
        return HTMLResponse(content=f"""
            <html>
                <head>
                    <style>
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                        }}
                        .container {{
                            text-align: center;
                            padding: 2rem;
                        }}
                        .checkmark {{
                            width: 80px;
                            height: 80px;
                            border-radius: 50%;
                            display: block;
                            stroke-width: 3;
                            stroke: #fff;
                            stroke-miterlimit: 10;
                            margin: 0 auto 1rem;
                            box-shadow: inset 0px 0px 0px #7ac142;
                            animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
                        }}
                        .checkmark__circle {{
                            stroke-dasharray: 166;
                            stroke-dashoffset: 166;
                            stroke-width: 3;
                            stroke-miterlimit: 10;
                            stroke: #fff;
                            fill: none;
                            animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                        }}
                        .checkmark__check {{
                            transform-origin: 50% 50%;
                            stroke-dasharray: 48;
                            stroke-dashoffset: 48;
                            animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
                        }}
                        @keyframes stroke {{
                            100% {{ stroke-dashoffset: 0; }}
                        }}
                        @keyframes scale {{
                            0%, 100% {{ transform: none; }}
                            50% {{ transform: scale3d(1.1, 1.1, 1); }}
                        }}
                        @keyframes fill {{
                            100% {{ box-shadow: inset 0px 0px 0px 30px #7ac142; }}
                        }}
                        h1 {{ margin: 0 0 0.5rem; font-size: 1.5rem; }}
                        p {{ margin: 0; opacity: 0.9; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                        <h1>Authentication Successful!</h1>
                        <p>You can close this window now.</p>
                    </div>
                    <script>
                        // Notify parent window and close
                        if (window.opener) {{
                            window.opener.postMessage({{
                                type: 'oauth_success',
                                session_id: '{session_id}',
                                user_email: '{user_email or ""}'
                            }}, '*');
                        }}
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
            </html>
        """)
    except Exception as e:
        print(f"Error in callback endpoint: {e}")
        return HTMLResponse(content=f"""
            <html>
                <body>
                    <h1>Authentication Failed</h1>
                    <p>Error: {str(e)}</p>
                    <p>Please close this window and try again.</p>
                    <script>setTimeout(() => window.close(), 3000);</script>
                </body>
            </html>
        """)

@app.get("/api/auth/user")
async def get_user(session_id: Optional[str] = Header(None, alias="x-session-id")):
    """Get current user info"""
    try:
        if not session_id:
            raise HTTPException(status_code=401, detail="No session ID provided")
        
        if not session_manager.session_exists(session_id):
            raise HTTPException(status_code=401, detail="Invalid session")
        
        session = session_manager.get_session(session_id)
        email_service = EmailService(session_id=session_id)
        
        # Get user email
        user_email = session.get("user_email") or email_service.get_user_email()
        
        if not user_email:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        return {
            "authenticated": True,
            "email": user_email,
            "session_id": session_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
async def logout(session_id: Optional[str] = Header(None, alias="x-session-id")):
    """Logout and clear session"""
    try:
        if session_id and session_manager.session_exists(session_id):
            session_manager.delete_session(session_id)
        
        return {
            "success": True,
            "message": "Logged out successfully"
        }
    except Exception as e:
        print(f"Error in logout endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
