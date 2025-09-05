# app.py
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import Optional
import torch, joblib, os

# ---------- Load model ----------
MODEL_PATH = os.getenv("MODEL_PATH", "model")
LABEL_PATH = os.getenv("LABEL_PATH", "label_encoder.joblib")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()
le = joblib.load(LABEL_PATH)

# ---------- App + static/templates ----------
app = FastAPI(title="AI Symptom Checker")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

class Query(BaseModel):
    text: str
    temp: Optional[float] = None
    hr: Optional[int] = None
    spo2: Optional[int] = None

@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/check")
def check(q: Query):
    # Build input text (append vitals if provided)
    vitals_bits = []
    if q.temp is not None: vitals_bits.append(f"temp:{q.temp}")
    if q.hr   is not None: vitals_bits.append(f"hr:{q.hr}")
    if q.spo2 is not None: vitals_bits.append(f"spo2:{q.spo2}")
    full_text = q.text if not vitals_bits else f"{q.text} {' '.join(vitals_bits)}"

    inputs = tokenizer(full_text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1).cpu().numpy()[0]

    # top-5 suggestions
    top_idx = probs.argsort()[::-1][:5]
    results = [
        {"condition": le.classes_[i], "confidence": float(probs[i])}
        for i in top_idx
    ]

    # simple triage demo (you can beef this up later)
    triage = "self_care"
    notes = []
    t = q.text.lower()
    redflags = [
        ("chest pain", "urgent"),
        ("one-sided weakness", "urgent"),
        ("shortness of breath", "urgent"),
        ("stiff neck", "urgent"),
    ]
    for kw, level in redflags:
        if kw in t:
            triage = level
            notes.append(f"Red flag: {kw}")
            break

    if q.spo2 is not None and q.spo2 < 92:
        triage = "urgent"; notes.append("Low SpO₂")
    if q.temp is not None and q.temp >= 39.0:
        if triage != "urgent": triage = "consult"
        notes.append("High fever")
    if q.hr is not None and q.hr >= 120:
        if triage != "urgent": triage = "consult"
        notes.append("High heart rate")

    return {
        "suggestions": results,
        "triage": triage,
        "notes": notes,
        "disclaimer": "This is not medical advice. Consult a clinician."
    }
