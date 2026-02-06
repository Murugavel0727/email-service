import uuid
import json
import os
from typing import Dict, Optional
from datetime import datetime, timedelta

class SessionManager:
    """Manages user sessions for multi-user authentication"""
    
    def __init__(self):
        # In-memory session storage: session_id -> session_data
        self.sessions: Dict[str, dict] = {}
        # Directory to store per-user token files
        self.tokens_dir = "user_tokens"
        os.makedirs(self.tokens_dir, exist_ok=True)
        
    def create_session(self, user_email: Optional[str] = None) -> str:
        """Create a new session and return session ID"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "session_id": session_id,
            "user_email": user_email,
            "created_at": datetime.now().isoformat(),
            "last_accessed": datetime.now().isoformat()
        }
        print(f"SessionManager: Created session {session_id} for user {user_email}")
        return session_id
    
    def get_session(self, session_id: str) -> Optional[dict]:
        """Get session data by session ID"""
        session = self.sessions.get(session_id)
        if session:
            # Update last accessed time
            session["last_accessed"] = datetime.now().isoformat()
        return session
    
    def update_session(self, session_id: str, user_email: str):
        """Update session with user email after authentication"""
        if session_id in self.sessions:
            self.sessions[session_id]["user_email"] = user_email
            self.sessions[session_id]["last_accessed"] = datetime.now().isoformat()
            print(f"SessionManager: Updated session {session_id} with user {user_email}")
    
    def delete_session(self, session_id: str):
        """Delete a session and its associated token file"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            print(f"SessionManager: Deleted session {session_id}")
            
        # Delete token file if exists
        token_file = self.get_token_path(session_id)
        if os.path.exists(token_file):
            os.remove(token_file)
            print(f"SessionManager: Deleted token file for session {session_id}")
    
    def get_token_path(self, session_id: str) -> str:
        """Get the path to the token file for a session"""
        return os.path.join(self.tokens_dir, f"token_{session_id}.json")
    
    def session_exists(self, session_id: str) -> bool:
        """Check if a session exists"""
        return session_id in self.sessions
    
    def cleanup_old_sessions(self, max_age_hours: int = 24):
        """Remove sessions older than max_age_hours"""
        now = datetime.now()
        to_delete = []
        
        for session_id, session_data in self.sessions.items():
            last_accessed = datetime.fromisoformat(session_data["last_accessed"])
            age = now - last_accessed
            
            if age > timedelta(hours=max_age_hours):
                to_delete.append(session_id)
        
        for session_id in to_delete:
            self.delete_session(session_id)
            
        if to_delete:
            print(f"SessionManager: Cleaned up {len(to_delete)} old sessions")
