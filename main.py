import os
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # review_chain import se pehle .env load hona chahiye

import qrcode
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import json
import urllib.parse
from datetime import datetime

from businesses import BUSINESSES
from review_chain import generate_review

FRONTEND = Path(__file__).parent / "frontend"
FEEDBACK_FILE = Path(__file__).parent / "feedback.json"

app = FastAPI(title="QR Review Generator")
app.mount("/static", StaticFiles(directory=FRONTEND), name="static")


class GenerateIn(BaseModel):
    slug: str
    answers: dict[str, list[str]]
    rating: int = 5
    language: str | None = None


class FeedbackIn(BaseModel):
    slug: str
    rating: int
    feedback: str
    name: str | None = ""
    phone: str | None = ""


def get_business(slug: str) -> dict:
    biz = BUSINESSES.get(slug)
    if not biz:
        raise HTTPException(404, "Business not found")
    return biz


@app.get("/")
def home_standee():
    # Primary Desk Standee Display (Mahadev Properties)
    return FileResponse(FRONTEND / "qr_standee.html")


@app.get("/qr/{slug}.png")
def qr_code(slug: str, request: Request):
    get_business(slug)
    configured_base = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
    
    # Auto-detect public host if deployed (Render, Railway, VPS, domain)
    host_header = request.headers.get("x-forwarded-host") or request.headers.get("host")
    proto = request.headers.get("x-forwarded-proto") or ("https" if "https" in str(request.base_url) else "http")
    
    if configured_base and "localhost" not in configured_base:
        base = configured_base
    elif host_header:
        base = f"{proto}://{host_header}"
    else:
        base = str(request.base_url).rstrip("/")

    target_url = f"{base}/r/{slug}"
    buf = BytesIO()
    qrcode.make(target_url).save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


@app.get("/qr/{slug}")
def standee_page(slug: str):
    get_business(slug)
    return FileResponse(FRONTEND / "qr_standee.html")


@app.get("/r/{slug}")
def review_page(slug: str):
    get_business(slug)
    return FileResponse(FRONTEND / "index.html")


@app.get("/api/business/{slug}")
def business_info(slug: str):
    biz = get_business(slug)
    place_id = str(biz.get("place_id", "")).strip()
    google_url = str(biz.get("google_url", "")).strip()

    if not google_url:
        if place_id and place_id != "YOUR_PLACE_ID":
            google_url = f"https://search.google.com/local/writereview?placeid={place_id}"
        else:
            # Fallback search URL jab tak real place_id ya google_url set nahi kiya gaya
            query = urllib.parse.quote_plus(f"{biz['name']} reviews")
            google_url = f"https://www.google.com/maps/search/?api=1&query={query}"

    return {
        "name": biz["name"],
        "tagline": biz.get("tagline", "Premium Quality Services"),
        "logo_url": biz.get("logo_url", "/static/logo.png"),
        "questions": biz["questions"],
        "default_language": biz.get("language", "English"),
        "google_url": google_url,
    }


@app.post("/api/generate")
def generate(body: GenerateIn):
    biz = get_business(body.slug)
    picked = []
    for q in biz["questions"]:  # sirf config ke valid options hi lo
        allowed = set(q["options"])
        picked += [o for o in body.answers.get(q["id"], []) if o in allowed]
    if not picked:
        raise HTTPException(400, "Please select at least one option")
    
    lang = body.language or biz.get("language", "English")
    rating = max(1, min(5, body.rating))
    return {"review": generate_review(biz["name"], lang, picked, rating)}


@app.post("/api/feedback")
def submit_feedback(body: FeedbackIn):
    biz = get_business(body.slug)
    entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "business": biz["name"],
        "slug": body.slug,
        "rating": body.rating,
        "feedback": body.feedback.strip(),
        "name": (body.name or "").strip(),
        "phone": (body.phone or "").strip(),
    }
    
    feedbacks = []
    if FEEDBACK_FILE.exists():
        try:
            feedbacks = json.loads(FEEDBACK_FILE.read_text(encoding="utf-8"))
        except Exception:
            feedbacks = []
            
    feedbacks.append(entry)
    FEEDBACK_FILE.write_text(json.dumps(feedbacks, indent=2, ensure_ascii=False), encoding="utf-8")
    return {"status": "ok", "message": "Feedback submitted successfully"}

