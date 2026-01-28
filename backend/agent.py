import os
import json
import google.generativeai as genai
from typing import List, Dict, Any, Optional


# GEMINI API KEY
# We fetch this inside the class to ensure environment is loaded

SYSTEM_PROMPT = """
You are an intelligent Email Agent. Your goal is to help users draft and send emails.
You will receive a user request and conversation history.

You have access to a tool called 'send_email'.
If the user asks to send an email, you MUST extract the recipient (to_email), subject, and body.
If any information is missing, ask the user for it.
Once you have all the details, you should output a JSON object in this specific format to trigger the action:

```json
{
    "action": "send_email",
    "parameters": {
        "to_email": "recipient@example.com",
        "subject": "Email Subject",
        "body": "Email Body"
    }
}
```

If you are not sending an email, just reply normally.
Always be polite, professional, and helpful.
Do not hallucinate sending the email if you haven't produced the JSON action.
"""

class EmailAgent:
    def __init__(self, email_service):
        self.email_service = email_service
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            print("EmailAgent Error: GEMINI_API_KEY is not set in environment")
        else:
            print(f"EmailAgent: Initializing with API key (length: {len(self.api_key)})")
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-flash-latest")
        
    async def process_message(self, user_message: str, history: List[Dict[str, str]], recipients: Optional[List[str]] = None) -> str:
        """
        Process the user message and determine if an email should be sent.
        recipients: Optional list of email addresses to send to
        """
        # Lazy load API key if missing
        if not self.api_key:
            from dotenv import load_dotenv
            load_dotenv(override=True)
            self.api_key = os.getenv("GEMINI_API_KEY")
            if self.api_key:
                print(f"EmailAgent: Recovered API key at runtime (length: {len(self.api_key)})")
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-flash-latest")

        if not self.api_key:
             print("EmailAgent: Still no API key after reload attempt")
             return f"ERROR: GEMINI_API_KEY is missing. Looking at: {os.path.join(os.getcwd(), '.env')}. Please ensure the key is correctly set in the .env file."

        # Construct history for Gemini
        # Gemini expects 'user' and 'model' roles, or a list of Content objects.
        # We'll use a simplified chat session approach or just append to prompt for simplicity in this migration
        
        full_prompt = SYSTEM_PROMPT + "\n\nConversation History:\n"
        
        # Add recipients info if available
        if recipients and len(recipients) > 0:
            full_prompt += f"\nRECIPIENTS LIST: {', '.join(recipients)}\n"
            full_prompt += "Note: When sending an email, send it to ALL recipients in the list above.\n\n"
        
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            # Map 'assistant' to 'model' if needed, but for prompt appending it doesn't matter much
            full_prompt += f"{role.upper()}: {content}\n"
        
        full_prompt += f"\nUSER: {user_message}\n"
        full_prompt += "AGENT:"
        
        print(f"Sending prompt to Gemini (length: {len(full_prompt)})")

        try:
            response = await self.model.generate_content_async(full_prompt)
            print("Received response from Gemini")
            ai_content = response.text
            print(f"AI Content: {ai_content[:50]}...")
            
            # Check for tool call in the content
            if "```json" in ai_content:
                try:
                    json_str = ai_content.split("```json")[1].split("```")[0].strip()
                    action_data = json.loads(json_str)
                    
                    if action_data.get("action") == "send_email":
                        params = action_data.get("parameters", {})
                        to_email = params.get("to_email")
                        subject = params.get("subject")
                        body = params.get("body")
                        
                        # Use recipients list if provided, otherwise use to_email from AI
                        target_emails = recipients if recipients and len(recipients) > 0 else ([to_email] if to_email else [])
                        
                        if target_emails and subject and body:
                            # Execute the action for all recipients
                            success_count = 0
                            failed_emails = []
                            
                            for email in target_emails:
                                result = self.email_service.send_email(email, subject, body)
                                if result:
                                    success_count += 1
                                else:
                                    failed_emails.append(email)
                            
                            # Build response message
                            if success_count == len(target_emails):
                                return f"Email sent successfully to {success_count} recipient(s): {', '.join(target_emails)}!"
                            elif success_count > 0:
                                return f"Email sent to {success_count} recipient(s). Failed to send to: {', '.join(failed_emails)}"
                            else:
                                return f"Failed to send email to all recipients. Please check server logs."
                        else:
                            return "Missing required information. Please provide subject and body for the email."
                except Exception as e:
                    print(f"JSON parsing error: {e}")
            
            return ai_content

        except Exception as e:
            return f"An error occurred processing your request with Gemini: {e}"
