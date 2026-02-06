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
SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly"  # Needed to read user profile
]

class EmailService:
    def __init__(self, session_id: str = None):
        self.session_id = session_id
        self.creds = None
        self.service = None
        self.token_file = self._get_token_file_path()
        self._initialize_credentials()
    
    def _get_token_file_path(self) -> str:
        """Get the token file path for this session"""
        if self.session_id:
            # Use session-specific token file
            os.makedirs("user_tokens", exist_ok=True)
            return os.path.join("user_tokens", f"token_{self.session_id}.json")
        else:
            # Fall back to default token.json for backward compatibility
            return "token.json"
            
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
        
        # Option 2: Try to load from token file (session-specific or default)
        if os.path.exists(self.token_file):
            print(f"EmailService: Loading credentials from {self.token_file}")
            try:
                self.creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)
                print(f"EmailService: Successfully loaded credentials from {self.token_file}")
                return
            except Exception as e:
                print(f"EmailService: Error loading {self.token_file}: {e}")
        
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
                
                # Save refreshed token to session-specific file
                if os.path.exists(self.token_file):
                    with open(self.token_file, "w") as token:
                        token.write(self.creds.to_json())
                        print(f"EmailService: Updated {self.token_file} with refreshed credentials")
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
            with open(self.token_file, "w") as token:
                token.write(self.creds.to_json())
            print(f"EmailService: OAuth flow completed, {self.token_file} saved")

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
                "has_token_file": os.path.exists(self.token_file),
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
    
    def get_user_email(self) -> str:
        """Get the email address of the authenticated user"""
        try:
            # Load credentials if not already loaded
            if not self.creds and os.path.exists(self.token_file):
                self.creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)
            
            if not self.creds:
                print("EmailService: No credentials available to get user email")
                return None
            
            # Try to get email from token data first
            if os.path.exists(self.token_file):
                with open(self.token_file, 'r') as f:
                    token_data = json.load(f)
                    # Email might be in the account field
                    if 'account' in token_data and token_data['account']:
                        return token_data['account']
            
            # If not in token, query the Gmail API
            if not self.service:
                self.service = build("gmail", "v1", credentials=self.creds)
            
            profile = self.service.users().getProfile(userId='me').execute()
            email = profile.get('emailAddress')
            
            # Save email to token file for future use
            if email and os.path.exists(self.token_file):
                with open(self.token_file, 'r') as f:
                    token_data = json.load(f)
                token_data['account'] = email
                with open(self.token_file, 'w') as f:
                    json.dump(token_data, f)
                print(f"EmailService: Saved user email {email} to token file")
            
            return email
        except Exception as e:
            print(f"EmailService: Error getting user email: {e}")
            import traceback
            traceback.print_exc()
            return None
