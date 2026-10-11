# AI Smart Review Engine & Desk Standee System

An intelligent, multi-tenant Google Review generation and reputation management platform designed for local businesses. Currently configured with a live showcase for **Mahadev Properties** (Real Estate Consultants).

---

## 🌟 Key Features

1. **AI-Powered Review Writer**
   - Generates authentic, human-sounding 2–3 sentence reviews based on customer-selected chips (e.g., *Honest advice*, *Smooth process*, *Prime location*).
   - Powered by ultra-fast Groq LLM inference (`openai/gpt-oss-120b`).
   - **Multi-Language Support**: English, Hinglish (conversational Roman Hindi), and Hindi (Devanagari).
   - 1-Click Copy with auto-redirect to official Google Review write page.

2. **Smart Negative Feedback Gating (1–3 Stars)**
   - Protects your public Google rating.
   - Customers selecting 1, 2, or 3 stars are routed to an exclusive **"VIP Founder's Desk"** private feedback form.
   - Saves feedback, contact info, and timestamps privately to `feedback.json` instead of posting publicly to Google.

3. **Executive Desk QR Standee (`/` & `/qr/{slug}`)**
   - High-resolution dynamic QR code generation (`/qr/{slug}.png`).
   - Clean, professional acrylic desk standee display.
   - Built-in **Print Table Standee** mode (automatically stripped of UI backgrounds for crisp, ink-friendly desktop printing) and PNG download button.

4. **Multi-Tenant Architecture**
   - Add new client businesses in seconds by adding an entry in `businesses.py`.
   - Custom branding per business: business name, tagline, logo, custom questions/chips, and Google Review URL or `place_id`.

---

## 📁 Project Architecture

```
review-app/
├── businesses.py          # Multi-business catalog & custom question configs
├── main.py                # FastAPI backend & QR image streaming
├── review_chain.py        # LangChain + Groq LLM prompt chain & fallback engine
├── requirements.txt       # Python dependencies
├── feedback.json          # Private storage for 1-3 star feedback
├── .env.example           # Environment variables template
├── .env                   # Local environment secrets & config
└── frontend/
    ├── index.html         # Mobile customer review application
    ├── qr_standee.html    # Desk standee display & print layout
    ├── app.js             # Review app state machine & API client
    ├── style.css          # Premium theme (Glassmorphism, Dark/Light modes)
    └── logo.png           # Business brand asset
```

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Python 3.10+ (tested with Python 3.11 / 3.12 / 3.14)
- A free [GroqCloud API Key](https://console.groq.com/keys)

### 2. Virtual Environment Setup

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create or edit your `.env` file based on `.env.example`:

```ini
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
PUBLIC_BASE_URL=http://localhost:8000
```

> **Note on `PUBLIC_BASE_URL`**: When hosting online (e.g., Render, Railway, VPS, or Ngrok), set `PUBLIC_BASE_URL` to your live public domain so generated QR codes point to your live site instead of localhost.

### 4. Run the Application

```powershell
.\.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

Open your browser at:
- **Desk Standee**: [http://localhost:8000/](http://localhost:8000/) or [http://localhost:8000/qr/mahadev-properties](http://localhost:8000/qr/mahadev-properties)
- **Customer Mobile Review Flow**: [http://localhost:8000/r/mahadev-properties](http://localhost:8000/r/mahadev-properties)

---

## 🌐 API Endpoints

| Route | Method | Description |
|---|---|---|
| `/` | `GET` | Primary desk standee display |
| `/qr/{slug}` | `GET` | Printable desk standee for specific business slug |
| `/qr/{slug}.png` | `GET` | Dynamic high-resolution QR PNG stream |
| `/r/{slug}` | `GET` | Customer review web application |
| `/api/business/{slug}` | `GET` | Metadata, questions, and Google review target URL |
| `/api/generate` | `POST` | Generates AI review using selected rating, language, and chips |
| `/api/feedback` | `POST` | Records private 1–3 star feedback to `feedback.json` |

---

## 🏢 Adding a New Business Client

Open `businesses.py` and add a new entry:

```python
BUSINESSES["city-cafe"] = {
    "name": "City Cafe & Bakery",
    "tagline": "Artisanal Coffee & Fresh Bakes",
    "logo_url": "/static/logo.png",
    "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",  # Google Place ID or direct google_url
    "google_url": "",
    "language": "English",
    "questions": [
        {
            "id": "food",
            "q": "Khana aur Coffee kaisa laga?",
            "options": ["Delicious coffee", "Freshly baked", "Great taste", "Must try pastries"],
        },
        {
            "id": "service",
            "q": "Service & Ambiance kaisa tha?",
            "options": ["Cozy ambiance", "Friendly staff", "Quick service", "Clean & hygienic"],
        },
    ],
}
```

Now immediately available at:
- Standee: `http://localhost:8000/qr/city-cafe`
- Mobile Review: `http://localhost:8000/r/city-cafe`
