import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Djezzy AI Hub Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MARKETING_API_URL = os.getenv("MARKETING_API_URL", "https://faroukblz-djezzy-marketing-engine.hf.space")
FRAUD_API_URL = os.getenv("FRAUD_API_URL", "https://faroukblz-djezzy-fraud-engine.hf.space")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class LLMRequest(BaseModel):
    context: str
    customInstructions: str = ""
    type: str

@app.get("/")
def read_root():
    return {"status": "Djezzy AI Hub Backend is running"}

@app.post("/api/marketing/segment")
async def segment_users(payload: dict):
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{MARKETING_API_URL}/predict_segment", json=payload)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/support/score-user")
async def score_user(payload: dict):
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{FRAUD_API_URL}/predict_fraud", json=payload)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/llm/generate-message")
async def generate_message(req: LLMRequest):
    systemPrompt = """You are a Djezzy telecom SMS copywriter. You write short, compelling SMS messages (max 160 chars when possible, up to 320 chars if needed).

Rules:
- Write ONLY in informal French (the conversational, everyday French spoken by people).
- DO NOT use Algerian Darija or standard/formal French.
- Be warm, friendly, and professional
- Include relevant details from the user context
- For marketing: promote relevant offers based on the user's data usage and segment
- For refund approval: be empathetic and reassuring, confirm the refund
- For refund denial: be respectful but firm, explain briefly, offer an alternative

Always output ONLY the SMS text, nothing else."""

    if req.type == 'marketing':
        userPrompt = f"Generate a promotional SMS for this Djezzy customer:\n{req.context}\n\nCustom instructions from the marketing agent: {req.customInstructions or 'None'}"
    elif req.type == 'approve':
        userPrompt = f"Generate a refund APPROVAL SMS for this customer's transaction:\n{req.context}\n\nCustom instructions from the support agent: {req.customInstructions or 'None'}"
    elif req.type == 'deny':
        userPrompt = f"Generate a refund DENIAL SMS for this customer's transaction:\n{req.context}\n\nCustom instructions from the support agent: {req.customInstructions or 'None'}"
    else:
        raise HTTPException(status_code=400, detail="Invalid SMS type")

    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": systemPrompt},
                        {"role": "user", "content": userPrompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 150
                }
            )
            response.raise_for_status()
            data = response.json()
            return {"sms": data["choices"][0]["message"]["content"].strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
