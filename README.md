# AI Smart Review Engine - Mahadev Properties

An intelligent Google Review generation and reputation management platform designed for local businesses. Currently configured with a live showcase for **Mahadev Properties** (Real Estate Consultants).

---

## 🌟 Key Features

1. **AI-Powered Review Writer**
   - Generates authentic, human-sounding 2–3 sentence reviews based on customer-selected chips (e.g., *Honest advice*, *Smooth process*, *Prime location*).
   - Powered by ultra-fast Groq LLM inference (`openai/gpt-oss-120b` or `llama-3.3-70b-versatile`).
   - **Multi-Language Support**: English, Hinglish (conversational Roman Hindi), and Hindi (Devanagari).
   - **Hybrid Zero-Fail Engine**: Runs with live Groq LLM when connected to backend, and seamlessly falls back to client-side smart generation on static hosting (Netlify) so reviews are never interrupted.
   - 1-Click Copy with auto-redirect to official Google Review page.

2. **Smart Negative Feedback Gating (1–3 Stars)**
   - Protects your public Google rating.
   - Customers selecting 1, 2, or 3 stars are routed to an exclusive **"VIP Founder's Desk"** private feedback form.
   - Saves feedback, contact info, and timestamps privately (to `feedback.json` on backend and `localStorage` as offline backup).

3. **High-Resolution QR Code Engine (`/qr.png` or `/qr/{slug}.png`)**
   - Dynamic QR code generation pointing directly to your live review portal.
   - Perfect for printing on physical table stands, visiting cards, and billing receipts.

4. **Multi-Tenant Architecture**
   - Configure additional business profiles via `businesses.py` or query parameter `?biz=your-business`.
   - Custom branding per business: business name, tagline, logo, custom questions/chips, and Google Review URL.

---

## 📁 Project Architecture

```
review-app/
├── businesses.py          # Multi-business catalog & custom question configs
├── main.py                # FastAPI backend & QR image streaming
├── review_chain.py        # LangChain + Groq LLM prompt chain & fallback engine
├── requirements.txt       # Python dependencies
├── feedback.json          # Private storage for 1-3 star feedback
├── netlify.toml           # Netlify build and SPA routing configuration
├── .env.example           # Environment variables template
├── .env                   # Local environment secrets & config
└── frontend/
    ├── index.html         # Mobile customer review application
    ├── app.js             # Review app state machine & hybrid AI client
    ├── style.css          # Premium theme (Obsidian & Gold luxury, Dark/Light modes)
    ├── logo.png           # Business brand asset
    └── _redirects         # Netlify routing redirects
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
PUBLIC_BASE_URL=https://reviewmahadevproperties.netlify.app
```

### 4. Run Locally

```powershell
.\.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

Open your browser at:
- **Review Portal**: [http://localhost:8000/](http://localhost:8000/)
- **QR Code Image**: [http://localhost:8000/qr.png](http://localhost:8000/qr.png)

---

## ☁️ Deployment

### Frontend (Netlify)
1. Push your repository to GitHub.
2. In Netlify, connect your repo.
3. Settings:
   - **Base directory**: `.`
   - **Publish directory**: `frontend`
4. The site is live at your Netlify domain (e.g. `https://reviewmahadevproperties.netlify.app`).

### Backend (Render / Railway / VPS - Optional for Live LLM)
1. Deploy the repository as a Python Web Service on Render or Railway.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables: `GROQ_API_KEY`, `GROQ_MODEL`, `PUBLIC_BASE_URL`.
5. In Netlify frontend, point to your backend URL by adding `?api=https://your-backend.onrender.com` or setting it in `localStorage`.

---

## 🌐 API Endpoints

| Route | Method | Description |
|---|---|---|
| `/` | `GET` | Customer review web application |
| `/qr.png` | `GET` | High-resolution dynamic QR PNG stream |
| `/qr/{slug}.png` | `GET` | QR code for specific business slug |
| `/r/{slug}` | `GET` | Slug redirect to review application |
| `/api/business/{slug}` | `GET` | Business metadata, questions, and Google review URL |
| `/api/generate` | `POST` | Generates AI review using selected rating, language, and chips |
| `/api/feedback` | `POST` | Records private 1–3 star feedback to `feedback.json` |
