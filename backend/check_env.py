import os
from dotenv import load_dotenv

print("--- DIAGNOSTIC START ---")
print(f"Current Directory: {os.getcwd()}")
env_path = os.path.join(os.getcwd(), '.env')
print(f"Checking for .env at: {env_path}")
print(f"File exists: {os.path.exists(env_path)}")

load_dotenv(override=True)
key = os.getenv("GEMINI_API_KEY")
if key:
    print(f"SUCCESS: GEMINI_API_KEY found (length: {len(key)})")
    print(f"Starts with: {key[:5]}...")
else:
    print("FAILURE: GEMINI_API_KEY NOT found")

print("--- DIAGNOSTIC END ---")
