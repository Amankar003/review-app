/* ==========================================================================
   ULTRA-PREMIUM REVIEW APP ENGINE
   ========================================================================== */

const SLUG = location.pathname.split("/").filter(Boolean).pop();
const $ = (id) => document.getElementById(id);

let currentRating = 5;
let googleUrl = "";

const RATING_CONFIG = {
  5: { label: "5 Stars - Shandar / Outstanding Experience!", class: "rating-5", icon: "✨" },
  4: { label: "4 Stars - Bahut Accha / Very Good!", class: "rating-4", icon: "👍" },
  3: { label: "3 Stars - Theek Thaak / Average", class: "rating-3", icon: "😐" },
  2: { label: "2 Stars - Sudhaar Ki Zaroorat / Needs Improvement", class: "rating-2", icon: "⚠️" },
  1: { label: "1 Star - Kharab Anubhav / Poor Experience", class: "rating-1", icon: "❌" }
};

// ==========================================================================
// 1. LIGHTWEIGHT CANVAS CONFETTI ENGINE (Zero Dependencies)
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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 70) {
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
// 2. THEME CONTROLLER (Dark / Light)
// ==========================================================================
function setupTheme() {
  const toggleBtn = $("themeToggle");
  const icon = $("themeIcon");
  const savedTheme = localStorage.getItem("preferred_theme") || "dark";
  
  applyTheme(savedTheme);

  toggleBtn.onclick = () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("preferred_theme", next);
  };

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    icon.innerHTML = t === "dark" ? "&#9728;" : "&#9790;"; // Sun vs Moon
  }
}

// ==========================================================================
// 3. INITIALIZATION & DATA LOADING
// ==========================================================================
async function init() {
  setupTheme();

  if (!SLUG) {
    $("title").textContent = "Invalid Business URL";
    return;
  }

  try {
    const r = await fetch(`/api/business/${SLUG}`);
    if (!r.ok) {
      $("title").textContent = "Business Not Found";
      return;
    }
    const data = await r.json();
    googleUrl = data.google_url;
    
    // Set Header Info
    $("title").textContent = data.name;
    document.title = `${data.name} - Official Review Portal`;
    if (data.tagline) $("tagline").textContent = data.tagline;
    if (data.logo_url) $("bizLogo").src = data.logo_url;

    // Render Question Cards & Chips
    $("questions").innerHTML = data.questions.map((q) => `
      <div class="block">
        <h3>${q.q}</h3>
        <div class="chips">
          ${q.options.map((o) => `
            <label class="chip">
              <input type="checkbox" data-q="${q.id}" value="${o}">
              <span>${o}</span>
            </label>`).join("")}
        </div>
      </div>`).join("");

    // Setup Haptic feedback on chip tap
    document.querySelectorAll(".chip input").forEach((input) => {
      input.addEventListener("change", () => {
        if (navigator.vibrate) navigator.vibrate(12);
      });
    });

  } catch (err) {
    $("title").textContent = "Connection Error";
  }

  setupStars();
  updateRatingUI(5);
}

// ==========================================================================
// 4. STAR RATING & GATING
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
    $("fbText").focus();
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
  badge.className = `rating-badge ${cfg.class}`;
  badge.querySelector(".badge-icon").textContent = cfg.icon;
  $("ratingLabel").textContent = cfg.label;
}

// ==========================================================================
// 5. REVIEW GENERATION WITH CONFETTI
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

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: SLUG,
        answers: answers,
        rating: currentRating,
        language: getSelectedLanguage()
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error generating review");

    $("text").value = data.review;
    $("result").style.display = "block";
    $("msg").textContent = "";

    // Trigger celebratory confetti burst!
    confetti.burst(60);
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

    $("result").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert("Review generate nahi ho saka. Kripya dobara koshish karein.");
  }

  btn.disabled = false;
  btn.innerHTML = oldHtml;
}

$("gen").onclick = () => generate($("gen"));
$("regen").onclick = () => generate($("regen"));

// ==========================================================================
// 6. QUICK COPY BUTTON
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

$("quickCopyBtn").onclick = async () => {
  const val = $("text").value;
  if (!val.trim()) return;

  await copyToClipboard(val);
  const btn = $("quickCopyBtn");
  btn.classList.add("copied");
  $("quickCopyIcon").textContent = "✓";
  $("quickCopyText").textContent = "Copied!";

  setTimeout(() => {
    btn.classList.remove("copied");
    $("quickCopyIcon").textContent = "📋";
    $("quickCopyText").textContent = "Copy";
  }, 2000);
};

// ==========================================================================
// 7. GOOGLE POST SUBMISSION & MODAL GUIDE
// ==========================================================================
let countdownInterval = null;

$("submit").onclick = async () => {
  const t = $("text");
  if (!t.value.trim()) {
    alert("Kripya pehle review generate karein.");
    return;
  }

  // 1. Copy to clipboard
  await copyToClipboard(t.value);

  // 2. Setup Modal
  const destUrl = googleUrl || "https://www.google.com/maps";
  const modalBtn = $("modalRedirectBtn");
  modalBtn.href = destUrl;

  const backdrop = $("modalBackdrop");
  backdrop.classList.add("show");

  // 3. Countdown & progress bar
  let seconds = 3;
  const progress = $("countdownProgress");
  progress.style.width = "100%";
  $("countdownText").textContent = `Opening Google in ${seconds} seconds...`;

  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    seconds -= 1;
    progress.style.width = `${(seconds / 3) * 100}%`;

    if (seconds <= 0) {
      clearInterval(countdownInterval);
      window.location.href = destUrl;
    } else {
      $("countdownText").textContent = `Opening Google in ${seconds} seconds...`;
    }
  }, 1000);

  modalBtn.onclick = () => {
    clearInterval(countdownInterval);
  };
};

$("modalClose").onclick = () => {
  if (countdownInterval) clearInterval(countdownInterval);
  $("modalBackdrop").classList.remove("show");
};

// ==========================================================================
// 8. PRIVATE CONCIERGE FEEDBACK (1-3 STARS)
// ==========================================================================
$("fbSubmit").onclick = async () => {
  const fbText = $("fbText").value.trim();
  if (!fbText) {
    alert("Kripya apna sujhaav ya shikayat likhein.");
    return;
  }

  const btn = $("fbSubmit");
  btn.disabled = true;
  btn.textContent = "Bheja ja raha hai...";

  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: SLUG,
        rating: currentRating,
        feedback: fbText,
        name: $("fbName").value.trim(),
        phone: $("fbPhone").value.trim()
      }),
    });

    if (!res.ok) throw new Error("Error submitting feedback");

    $("negativeFlow").innerHTML = `
      <section class="card concierge-card" style="text-align: center; border-color: rgba(16, 185, 129, 0.5);">
        <div style="font-size: 42px; margin-bottom: 8px;">✅</div>
        <h2 style="color: #34d399; margin: 0 0 8px; font-size: 20px;">Dhanyawad!</h2>
        <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">
          Aapka feedback direct founder aur management tak pahuch gaya hai. Hum aapke anubhav ko behtar banane ke liye jald hi aapse sampark karenge!
        </p>
      </section>
    `;
  } catch (err) {
    alert("Feedback bhejte waqt problem aayi, kripya dobara try karein.");
    btn.disabled = false;
    btn.textContent = "Send Direct to Management";
  }
};

init();
