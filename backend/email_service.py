import os
import base64
import json
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

class EmailService:
    def __init__(self):
        self.creds = None
        self.service = None
        self._initialize_credentials()
            
    def _initialize_credentials(self):
        """Initialize credentials from token.json, environment variables, or credentials.json"""
        print("EmailService: Initializing credentials...")
        
        # Option 1: Try to load from environment variable (for production/Vercel)
        refresh_token = os.getenv("GMAIL_REFRESH_TOKEN")
        client_id = os.getenv("GMAIL_CLIENT_ID")
        client_secret = os.getenv("GMAIL_CLIENT_SECRET")
        
        if refresh_token and client_id and client_secret:
            print("EmailService: Using credentials from environment variables")
            try:
                token_data = {
                    "refresh_token": refresh_token,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "scopes": SCOPES
                }
                self.creds = Credentials.from_authorized_user_info(token_data, SCOPES)
                print("EmailService: Successfully loaded credentials from environment")
                return
            except Exception as e:
                print(f"EmailService: Error loading from environment: {e}")
        
        # Option 2: Try to load from token.json (for local development)
        if os.path.exists("token.json"):
            print("EmailService: Loading credentials from token.json")
            try:
                self.creds = Credentials.from_authorized_user_file("token.json", SCOPES)
                print("EmailService: Successfully loaded credentials from token.json")
                return
            except Exception as e:
                print(f"EmailService: Error loading token.json: {e}")
        
        print("EmailService: No valid credentials found. Authentication required.")
            
    def authenticate(self):
        """Authenticates the user and returns Gmail service"""
        if self.service:
            return self.service
            
        # Check if credentials need refresh
        if self.creds and self.creds.expired and self.creds.refresh_token:
            print("EmailService: Refreshing expired credentials...")
            try:
                self.creds.refresh(Request())
                print("EmailService: Credentials refreshed successfully")
                
                # Save refreshed token if we have a local token.json
                if os.path.exists("token.json"):
                    with open("token.json", "w") as token:
                        token.write(self.creds.to_json())
                        print("EmailService: Updated token.json with refreshed credentials")
            except Exception as e:
                print(f"EmailService: Error refreshing credentials: {e}")
                self.creds = None
        
        # If no valid credentials, need to authenticate
        if not self.creds or not self.creds.valid:
            if not os.path.exists("credentials.json"):
                raise FileNotFoundError(
                    "Authentication required. Please run the /api/auth/init endpoint locally "
                    "or set GMAIL_REFRESH_TOKEN, GMAIL_CLIENT_ID, and GMAIL_CLIENT_SECRET "
                    "environment variables."
                )
            
            print("EmailService: Starting OAuth flow...")
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            self.creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open("token.json", "w") as token:
                token.write(self.creds.to_json())
            print("EmailService: OAuth flow completed, token.json saved")

        self.service = build("gmail", "v1", credentials=self.creds)
        print("EmailService: Gmail service initialized")
        return self.service
    
    def is_authenticated(self):
        """Check if the service is authenticated and ready to send emails"""
        try:
            if not self.creds:
                return False
            
            if self.creds.expired and self.creds.refresh_token:
                # Try to refresh
                try:
                    self.creds.refresh(Request())
                    return True
                except:
                    return False
            
            return self.creds.valid
        except:
            return False
    
    def get_auth_status(self):
        """Get detailed authentication status"""
        if not self.creds:
            return {
                "authenticated": False,
                "message": "No credentials found. Please authenticate.",
                "has_token_file": os.path.exists("token.json"),
                "has_credentials_file": os.path.exists("credentials.json"),
                "has_env_vars": bool(os.getenv("GMAIL_REFRESH_TOKEN"))
            }
        
        if self.creds.expired:
            if self.creds.refresh_token:
                return {
                    "authenticated": True,
                    "message": "Credentials expired but can be refreshed",
                    "needs_refresh": True
                }
            else:
                return {
                    "authenticated": False,
                    "message": "Credentials expired and cannot be refreshed. Re-authentication required."
                }
        
        return {
            "authenticated": True,
            "message": "Ready to send emails",
            "needs_refresh": False
        }

    def create_message(self, sender, to, subject, message_text):
        """Create a message for an email."""
        message = MIMEText(message_text)
        message["to"] = to
        message["from"] = sender
        message["subject"] = subject
        return {"raw": base64.urlsafe_b64encode(message.as_bytes()).decode()}

    def send_email(self, to_email: str, subject: str, content: str):
        """Send an email."""
        try:
            print(f"EmailService: Attempting to send email to {to_email}")
            service = self.authenticate()
            message = self.create_message("me", to_email, subject, content)
            
            sent_message = (
                service.users()
                .messages()
                .send(userId="me", body=message)
                .execute()
            )
            print(f'EmailService: Email sent successfully. Message Id: {sent_message["id"]}')
            return sent_message
        except HttpError as error:
            print(f"EmailService: HTTP error occurred: {error}")
            return None
        except Exception as error:
            print(f"EmailService: Unexpected error occurred: {error}")
            return None
