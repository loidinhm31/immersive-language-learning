import os
from dotenv import load_dotenv
import google.genai as genai

load_dotenv()

api_key = os.getenv("GOOGLE_CLOUD_API_KEY")
client = genai.Client(api_key=api_key, http_options={'api_version': 'v1alpha'})

print("Listing available models...")
try:
    for m in client.models.list():
        print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
