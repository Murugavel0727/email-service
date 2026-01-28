import os
import base64
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
        # The file token.json stores the user's access and refresh tokens, and is
        # created automatically when the authorization flow completes for the first
        # time.
        if os.path.exists("token.json"):
            self.creds = Credentials.from_authorized_user_file("token.json", SCOPES)
            
    def authenticate(self):
        """Authenticates the user using client_secrets.json"""
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                if not os.path.exists("credentials.json"):
                     raise FileNotFoundError("credentials.json not found. Please place your Google Cloud credentials file in the backend directory.")
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    "credentials.json", SCOPES
                )
                self.creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open("token.json", "w") as token:
                token.write(self.creds.to_json())

        return build("gmail", "v1", credentials=self.creds)

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
            service = self.authenticate()
            message = self.create_message("me", to_email, subject, content)
            
            sent_message = (
                service.users()
                .messages()
                .send(userId="me", body=message)
                .execute()
            )
            print(f'Message Id: {sent_message["id"]}')
            return sent_message
        except HttpError as error:
            print(f"An error occurred: {error}")
            return None
