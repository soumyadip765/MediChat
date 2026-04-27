from fastapi import FastAPI
from pydantic import BaseModel
import os
from google import genai
from fastapi.middleware.cors import CORSMiddleware

# Load API key from environment
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("API key not found! Set GEMINI_API_KEY in terminal.")

# Initialize Gemini client
client = genai.Client(api_key=API_KEY)

# FastAPI app
app = FastAPI()

# Enable CORS (for frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request body
class ChatRequest(BaseModel):
    message: str


# 🚨 Emergency detection
def is_emergency(text: str) -> bool:
    keywords = [
        "chest pain", "can't breathe", "shortness of breath",
        "unconscious", "severe bleeding", "stroke",
        "suicidal", "kill myself", "want to die"
    ]
    text = text.lower()
    return any(k in text for k in keywords)


# Chat endpoint
@app.post("/chat")
async def chat(req: ChatRequest):
    user_message = req.message

    # 🚨 Emergency override
    if is_emergency(user_message):
        return {
            "reply": "⚠️ This may be a medical emergency. Please call emergency services immediately (India: 112 / 108)."
        }

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""
You are a healthcare assistant chatbot.

Rules:
- Provide general health advice only
- Do NOT diagnose
- Suggest when to see a doctor
- Keep responses clear and helpful

User: {user_message}
"""
        )

        reply = response.text if response.text else "⚠️ No response from AI."

    except Exception as e:
        print("Error:", e)
        reply = "⚠️ AI service error. Please try again later."

    return {"reply": reply}