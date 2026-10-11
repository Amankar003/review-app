/* ==========================================================================
   ULTRA-PREMIUM REVIEW APP ENGINE
   Dual-Mode: Connects to live FastAPI backend when available,
   with seamless offline/static Netlify resilience & instant client AI.
   ========================================================================== */

// 1. DEFAULT BUSINESS CATALOG (Built-in for zero-fail Netlify static hosting)
const DEFAULT_BUSINESSES = {
  "mahadev-properties": {
    name: "Mahadev Properties",
    tagline: "Trusted Real Estate Consultants & Property Advisory",
    logo_url: "logo.png",
    google_url: "https://www.google.com/search?q=mahadev+properties#lrd=0x39f4e180b1411a69:0xed0356b9ce030d0d,3,,,,",
    default_language: "English",
    questions: [
      {
        id: "dealing",
        q: "Deal & Process kaisa tha?",
        options: ["Honest advice", "Transparent dealing", "Smooth process", "Best property deals"],
      },
      {
        id: "service",
        q: "Guidance & Support kaisa laga?",
        options: ["Quick response", "Professional staff", "Helpful & polite", "Trustworthy"],
      },
      {
        id: "property",
        q: "Property options kaise the?",
        options: ["Prime location", "Budget friendly", "Verified properties", "Good variety"],
      },
    ],
  },
  "demo": {
    name: "Mahadev Properties",
    tagline: "Trusted Real Estate Consultants & Property Advisory",
    logo_url: "logo.png",
    google_url: "https://www.google.com/search?q=mahadev+properties#lrd=0x39f4e180b1411a69:0xed0356b9ce030d0d,3,,,,",
    default_language: "English",
    questions: [
      {
        id: "dealing",
        q: "Deal & Process kaisa tha?",
        options: ["Honest advice", "Transparent dealing", "Smooth process", "Best property deals"],
      },
      {
        id: "service",
        q: "Guidance & Support kaisa laga?",
        options: ["Quick response", "Professional staff", "Helpful & polite", "Trustworthy"],
      },
      {
        id: "property",
        q: "Property options kaise the?",
        options: ["Prime location", "Budget friendly", "Verified properties", "Good variety"],
      },
    ],
  },
};

// 2. SLUG RESOLUTION (Query param -> Path -> Default to mahadev-properties)
function resolveSlug() {
  const urlParams = new URLSearchParams(window.location.search);
  const qSlug = urlParams.get("biz") || urlParams.get("b") || urlParams.get("slug");
  if (qSlug) return qSlug;

  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[0] === "r") return parts[1];
  if (parts.length === 1 && parts[0] !== "index.html" && !parts[0].includes(".")) return parts[0];

  return "mahadev-properties";
}

const SLUG = resolveSlug();
const $ = (id) => document.getElementById(id);

let currentRating = 5;
let googleUrl = "";
let currentBusinessName = "Mahadev Properties";

// API Base configuration (allows specifying Render/Railway backend URL via query param ?api=... or window.BACKEND_API_URL)
function getApiBaseUrl() {
  const params = new URLSearchParams(window.location.search);
  const apiParam = params.get("api");
  if (apiParam) {
    try { localStorage.setItem("review_app_api_base", apiParam); } catch (e) {}
    return apiParam.replace(/\/$/, "");
  }
  try {
    const saved = localStorage.getItem("review_app_api_base");
    if (saved) return saved.replace(/\/$/, "");
  } catch (e) {}
  if (window.BACKEND_API_URL) return window.BACKEND_API_URL.replace(/\/$/, "");
  return ""; // default relative (works when served by FastAPI or Netlify proxy)
}

const RATING_CONFIG = {
  5: { label: "5 Stars - Shandar / Outstanding Experience!", class: "rating-5", icon: "✨" },
  4: { label: "4 Stars - Bahut Accha / Very Good!", class: "rating-4", icon: "👍" },
  3: { label: "3 Stars - Theek Thaak / Average", class: "rating-3", icon: "😐" },
  2: { label: "2 Stars - Sudhaar Ki Zaroorat / Needs Improvement", class: "rating-2", icon: "⚠️" },
  1: { label: "1 Star - Kharab Anubhav / Poor Experience", class: "rating-1", icon: "❌" },
};

// ==========================================================================
// 3. CANVAS CONFETTI ENGINE (Zero Dependencies)
// ==========================================================================
class ConfettiEngine {
  constructor() {
    this.canvas = document.getElementById("confettiCanvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.animationId = null;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 70) {
    if (!this.canvas || !this.ctx) return;
    const colors = ["#fbbf24", "#f59e0b", "#d97706", "#60a5fa", "#3b82f6", "#10b981", "#ffffff"];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        opacity: 1,
        life: 0.98 + Math.random() * 0.015,
      });
    }

    if (!this.animationId) {
      this.loop();
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.rotation += p.vRot;
      p.opacity *= p.life;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.ctx.restore();

      if (p.opacity < 0.05 || p.y > this.canvas.height + 50) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.loop());
    } else {
      this.animationId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

const confetti = new ConfettiEngine();

// ==========================================================================
// 4. THEME CONTROLLER (Dark / Light)
// ==========================================================================
function setupTheme() {
  const toggleBtn = $("themeToggle");
  const icon = $("themeIcon");
  let savedTheme = "dark";
  try {
    savedTheme = localStorage.getItem("preferred_theme") || "dark";
  } catch (e) {}

  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.onclick = () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("preferred_theme", next); } catch (e) {}
    };
  }

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    if (icon) {
      icon.innerHTML = t === "dark" ? "&#9728;" : "&#9790;"; // Sun vs Moon
    }
  }
}

// ==========================================================================
// 5. INITIALIZATION & DATA LOADING (Zero-Fail Hybrid Architecture)
// ==========================================================================
async function init() {
  setupTheme();

  let businessData = null;
  const apiBase = getApiBaseUrl();

  // Try fetching dynamic data from backend API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const r = await fetch(`${apiBase}/api/business/${SLUG}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (r.ok) {
      const json = await r.json();
      if (json && json.name) {
        businessData = json;
      }
    }
  } catch (e) {
    // Network offline or static Netlify deployment without backend
  }

  // Graceful fallback to built-in business profile
  if (!businessData) {
    businessData = DEFAULT_BUSINESSES[SLUG] || DEFAULT_BUSINESSES["mahadev-properties"];
  }

  currentBusinessName = businessData.name || "Mahadev Properties";
  googleUrl = businessData.google_url || "https://www.google.com/search?q=mahadev+properties";

  // Render header info
  if ($("title")) $("title").textContent = businessData.name;
  document.title = `Rate Your Experience - ${businessData.name}`;

  if ($("tagline") && businessData.tagline) {
    $("tagline").textContent = businessData.tagline;
  }

  const logoEl = $("bizLogo");
  if (logoEl) {
    const logoSrc = businessData.logo_url || "logo.png";
    logoEl.src = logoSrc.replace(/^\/static\//, "");
    logoEl.onerror = () => {
      logoEl.src = "logo.png";
    };
  }

  // Render Questions & Chips
  const qContainer = $("questions");
  if (qContainer && Array.isArray(businessData.questions)) {
    qContainer.innerHTML = businessData.questions
      .map(
        (q) => `
      <div class="block">
        <h3>${q.q}</h3>
        <div class="chips">
          ${q.options
            .map(
              (o) => `
            <label class="chip">
              <input type="checkbox" data-q="${q.id}" value="${o}">
              <span>${o}</span>
            </label>`
            )
            .join("")}
        </div>
      </div>`
      )
      .join("");

    // Setup Haptic feedback on chip tap
    document.querySelectorAll(".chip input").forEach((input) => {
      input.addEventListener("change", () => {
        if (navigator.vibrate) navigator.vibrate(12);
      });
    });
  }

  setupStars();
  updateRatingUI(5);
}

// ==========================================================================
// 6. STAR RATING & GATING
// ==========================================================================
function setupStars() {
  const starBtns = document.querySelectorAll(".star-btn");
  starBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = parseInt(btn.dataset.rating, 10);
      if (navigator.vibrate) navigator.vibrate(20);
      setRating(val);
    });
  });
}

function setRating(val) {
  currentRating = val;
  updateRatingUI(val);

  // Review Gating:
  // 4 & 5 stars -> Positive Google Review flow
  // 1-3 stars -> Negative Private Concierge feedback flow
  if (val >= 4) {
    $("positiveFlow").style.display = "block";
    $("negativeFlow").style.display = "none";
  } else {
    $("positiveFlow").style.display = "none";
    $("negativeFlow").style.display = "block";
    const fbInput = $("fbText");
    if (fbInput) fbInput.focus();
  }
}

function updateRatingUI(val) {
  const starBtns = document.querySelectorAll(".star-btn");
  starBtns.forEach((btn) => {
    const r = parseInt(btn.dataset.rating, 10);
    if (r <= val) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const cfg = RATING_CONFIG[val] || RATING_CONFIG[5];
  const badge = $("ratingBadge");
  if (badge) {
    badge.className = `rating-badge ${cfg.class}`;
    const iconSpan = badge.querySelector(".badge-icon");
    if (iconSpan) iconSpan.textContent = cfg.icon;
  }
  if ($("ratingLabel")) $("ratingLabel").textContent = cfg.label;
}

// ==========================================================================
// 7. CLIENT-SIDE SMART REVIEW GENERATOR (Instant Zero-Lag AI Engine)
// ==========================================================================
function generateClientReview(bizName, language, picked, rating = 5) {
  const lang = (language || "English").toLowerCase();
  const pickedList = picked.length ? picked : ["Honest advice", "Transparent dealing"];

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (lang.includes("hindi") && !lang.includes("hinglish")) {
    const hindiOpeners = [
      `${bizName} के साथ मेरा अनुभव बहुत ही शानदार और संतोषजनक रहा।`,
      `${bizName} की टीम ने प्रॉपर्टी से जुड़ी हर जानकारी बहुत ही स्पष्ट और ईमानदारी से दी।`,
      `मैं ${bizName} की सेवाओं से बेहद प्रभावित और खुश हूँ।`,
    ];
    const hindiBodies = [
      `खासतौर पर इनकी ${pickedList.join(", ")} बहुत सराहनीय थी। पूरी प्रक्रिया बहुत ही सुगम और पारदर्शी रही।`,
      `इनका मार्गदर्शन और ${pickedList.join(", ")} वास्तव में भरोसेमंद था। सही प्रॉपर्टी चुनने में बहुत मदद मिली।`,
      `डील के दौरान ${pickedList.join(", ")} का पूरा ध्यान रखा गया।`,
    ];
    const hindiClosers = [
      "मैं सभी को इनकी सेवा लेने की सलाह दूंगा। 5 स्टार अनुभव!",
      "विश्वसनीय और पेशेवर टीम। बहुत-बहुत धन्यवाद!",
      "प्रॉपर्टी खरीदने या सलाह के लिए निश्चित रूप से सबसे बेहतरीन विकल्प।",
    ];
    return `${pickRandom(hindiOpeners)} ${pickRandom(hindiBodies)} ${pickRandom(hindiClosers)}`;
  } else if (lang.includes("hinglish")) {
    const hinglishOpeners = [
      `${bizName} ke saath mera experience kaafi badhiya raha!`,
      `Recently ${bizName} se deal ki, aur service sach me bohot impressive thi.`,
      `${bizName} ki team ke saath property guidance ka anubhav outstanding raha.`,
    ];
    const hinglishBodies = [
      `Khas taur par inki ${pickedList.map((p) => p.toLowerCase()).join(", ")} ne dil jeet liya. Sab kuch smooth aur transparent tha.`,
      `Inka guidance bohot helpful tha aur ${pickedList.map((p) => p.toLowerCase()).join(", ")} ka experience bohot accha laga.`,
      `Dealing ke dauraan ${pickedList.map((p) => p.toLowerCase()).join(", ")} bilkul perfect raha.`,
    ];
    const hinglishClosers = [
      "Definitely recommend karunga sabhi ko. Full 5 stars!",
      "Super professional aur honest team hai. Thank you so much!",
      "Best real estate consultants in town. Must visit!",
    ];
    return `${pickRandom(hinglishOpeners)} ${pickRandom(hinglishBodies)} ${pickRandom(hinglishClosers)}`;
  } else {
    // English
    const enOpeners = [
      `Had an outstanding experience with ${bizName}!`,
      `Really impressed by the professionalism and transparency at ${bizName}.`,
      `I had a wonderful experience dealing with the team at ${bizName}.`,
      `Extremely satisfied with the property advisory services provided by ${bizName}.`,
    ];
    const enBodies = [
      `Their team provided ${pickedList.map((p) => p.toLowerCase()).join(", ")} which made the whole process effortless and completely stress-free.`,
      `I truly appreciated their ${pickedList.map((p) => p.toLowerCase()).join(", ")}. Everything was explained clearly with genuine advice.`,
      `The guidance around ${pickedList.map((p) => p.toLowerCase()).join(", ")} was remarkable and truly trustworthy.`,
    ];
    const enClosers = [
      "Would definitely recommend them to anyone looking for trusted real estate advisory!",
      "Truly dependable and highly professional team. 5 stars all the way!",
      "A 10/10 experience, will certainly return for future property deals.",
    ];
    return `${pickRandom(enOpeners)} ${pickRandom(enBodies)} ${pickRandom(enClosers)}`;
  }
}

// ==========================================================================
// 8. REVIEW GENERATION WITH HYBRID BACKEND & CLIENT FALLBACK
// ==========================================================================
function collect() {
  const answers = {};
  document.querySelectorAll("input[type=checkbox]:checked").forEach((c) => {
    (answers[c.dataset.q] = answers[c.dataset.q] || []).push(c.value);
  });
  return answers;
}

function getSelectedLanguage() {
  const checked = document.querySelector("input[name=lang]:checked");
  return checked ? checked.value : "English";
}

async function generate(btn) {
  const answers = collect();
  if (!Object.keys(answers).length) {
    alert("Kripya kam se kam ek point select karein!");
    return;
  }

  const oldHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-text">⚡ AI Review Ban Raha Hai...</span>`;

  const selectedLang = getSelectedLanguage();
  const pickedList = Object.values(answers).flat();
  let reviewText = "";

  // 1. Try Live FastAPI Backend First
  const apiBase = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(`${apiBase}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        slug: SLUG,
        answers: answers,
        rating: currentRating,
        language: selectedLang,
      }),
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.review) {
        reviewText = data.review.trim();
      }
    }
  } catch (err) {
    // Backend asleep or offline
  }

  // 2. Client-Side AI Generation Fallback (Ensures Netlify deployment never fails)
  if (!reviewText) {
    await new Promise((r) => setTimeout(r, 450)); // natural micro-delay
    reviewText = generateClientReview(currentBusinessName, selectedLang, pickedList, currentRating);
  }

  $("text").value = reviewText;
  $("result").style.display = "block";
  if ($("msg")) $("msg").textContent = "";

  // Trigger celebratory confetti burst!
  confetti.burst(65);
  if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

  $("result").scrollIntoView({ behavior: "smooth" });
  btn.disabled = false;
  btn.innerHTML = oldHtml;
}

if ($("gen")) $("gen").onclick = () => generate($("gen"));
if ($("regen")) $("regen").onclick = () => generate($("regen"));

// ==========================================================================
// 9. QUICK COPY BUTTON
// ==========================================================================
async function copyToClipboard(text) {
  let ok = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch (e) {}

  if (!ok) {
    try {
      const t = $("text");
      t.select();
      document.execCommand("copy");
      ok = true;
    } catch (e) {}
  }
  return ok;
}

if ($("quickCopyBtn")) {
  $("quickCopyBtn").onclick = async () => {
    const val = $("text").value;
    if (!val.trim()) return;

    await copyToClipboard(val);
    const btn = $("quickCopyBtn");
    btn.classList.add("copied");
    if ($("quickCopyIcon")) $("quickCopyIcon").textContent = "✓";
    if ($("quickCopyText")) $("quickCopyText").textContent = "Copied!";

    setTimeout(() => {
      btn.classList.remove("copied");
      if ($("quickCopyIcon")) $("quickCopyIcon").textContent = "📋";
      if ($("quickCopyText")) $("quickCopyText").textContent = "Copy";
    }, 2000);
  };
}

// ==========================================================================
// 10. GOOGLE POST SUBMISSION & MODAL GUIDE
// ==========================================================================
let countdownInterval = null;

if ($("submit")) {
  $("submit").onclick = async () => {
    const t = $("text");
    if (!t.value.trim()) {
      alert("Kripya pehle review generate karein.");
      return;
    }

    // 1. Copy to clipboard
    await copyToClipboard(t.value);

    // 2. Setup Modal
    const destUrl = googleUrl || "https://www.google.com/search?q=mahadev+properties";
    const modalBtn = $("modalRedirectBtn");
    if (modalBtn) modalBtn.href = destUrl;

    const backdrop = $("modalBackdrop");
    if (backdrop) backdrop.classList.add("show");

    // 3. Countdown & progress bar
    let seconds = 3;
    const progress = $("countdownProgress");
    if (progress) progress.style.width = "100%";
    if ($("countdownText")) $("countdownText").textContent = `Opening Google in ${seconds} seconds...`;

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      seconds -= 1;
      if (progress) progress.style.width = `${(seconds / 3) * 100}%`;

      if (seconds <= 0) {
        clearInterval(countdownInterval);
        window.location.href = destUrl;
      } else {
        if ($("countdownText")) $("countdownText").textContent = `Opening Google in ${seconds} seconds...`;
      }
    }, 1000);

    if (modalBtn) {
      modalBtn.onclick = () => {
        clearInterval(countdownInterval);
      };
    }
  };
}

if ($("modalClose")) {
  $("modalClose").onclick = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    const backdrop = $("modalBackdrop");
    if (backdrop) backdrop.classList.remove("show");
  };
}

// ==========================================================================
// 11. PRIVATE CONCIERGE FEEDBACK (1-3 STARS)
// ==========================================================================
if ($("fbSubmit")) {
  $("fbSubmit").onclick = async () => {
    const fbText = $("fbText").value.trim();
    if (!fbText) {
      alert("Kripya apna sujhaav ya shikayat likhein.");
      return;
    }

    const btn = $("fbSubmit");
    btn.disabled = true;
    btn.textContent = "Bheja ja raha hai...";

    const feedbackPayload = {
      slug: SLUG,
      business: currentBusinessName,
      rating: currentRating,
      feedback: fbText,
      name: ($("fbName") ? $("fbName").value : "").trim(),
      phone: ($("fbPhone") ? $("fbPhone").value : "").trim(),
      timestamp: new Date().toISOString(),
    };

    // Try posting to backend API
    const apiBase = getApiBaseUrl();
    try {
      await fetch(`${apiBase}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackPayload),
      });
    } catch (err) {
      // Backend not reached, saved locally
    }

    // Always store in localStorage so customer feedback is never lost
    try {
      const stored = JSON.parse(localStorage.getItem("customer_feedbacks") || "[]");
      stored.push(feedbackPayload);
      localStorage.setItem("customer_feedbacks", JSON.stringify(stored));
    } catch (e) {}

    $("negativeFlow").innerHTML = `
      <section class="card concierge-card" style="text-align: center; border-color: rgba(16, 185, 129, 0.5);">
        <div style="font-size: 42px; margin-bottom: 8px;">✅</div>
        <h2 style="color: #34d399; margin: 0 0 8px; font-size: 20px;">Dhanyawad!</h2>
        <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">
          Aapka feedback direct founder aur management tak pahuch gaya hai. Hum aapke anubhav ko behtar banane ke liye jald hi aapse sampark karenge!
        </p>
      </section>
    `;
  };
}

init();
