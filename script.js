const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const toggle = document.querySelector("[data-nav-toggle]");
const navGroups = document.querySelectorAll(".nav-group");
const mobileMenuQuery = window.matchMedia("(max-width: 980px)");

const closeNavGroups = () => {
  navGroups.forEach((group) => {
    group.classList.remove("is-expanded");
    group.querySelector(".nav-parent")?.setAttribute("aria-expanded", "false");
  });
};

toggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  if (!isOpen) closeNavGroups();
});

navGroups.forEach((group) => {
  const parent = group.querySelector(".nav-parent");
  parent?.addEventListener("click", () => {
    if (!mobileMenuQuery.matches) return;
    const shouldOpen = !group.classList.contains("is-expanded");
    closeNavGroups();
    group.classList.toggle("is-expanded", shouldOpen);
    parent.setAttribute("aria-expanded", String(shouldOpen));
  });
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open navigation");
    closeNavGroups();
  }
});

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const animatedElements = document.querySelectorAll(
  ".section, .content-page, .nanak-band, .contact-panel, .product-card, .seo-card, .steps article, .faq-list details, .order-hero, .login-card, .order-main, .cart-panel, .admin-shell"
);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion && "IntersectionObserver" in window) {
  const isInView = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );

  animatedElements.forEach((element) => {
    element.classList.add("reveal");
    if (isInView(element)) {
      element.classList.add("is-visible");
    } else {
      observer.observe(element);
    }
  });

  window.addEventListener(
    "load",
    () => {
      animatedElements.forEach((element) => {
        if (!element.classList.contains("is-visible") && isInView(element)) {
          element.classList.add("is-visible");
          observer.unobserve(element);
        }
      });
    },
    { once: true }
  );
} else {
  animatedElements.forEach((element) => element.classList.add("is-visible"));
}

/* ===== 2026 redesign enhancements ===== */

// Hero headline word-by-word rise
const heroTitle = document.querySelector(".hero h1");
if (heroTitle && !reduceMotion) {
  const words = heroTitle.textContent.trim().split(/\s+/);
  heroTitle.textContent = "";
  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "hw";
    span.style.animationDelay = `${80 + index * 55}ms`;
    span.textContent = word;
    heroTitle.appendChild(span);
    if (index < words.length - 1) heroTitle.appendChild(document.createTextNode(" "));
  });
}

// Seamless logo marquee: duplicate the track content once
document.querySelectorAll("[data-marquee] .marquee-track").forEach((track) => {
  const clone = track.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  clone.querySelectorAll("img").forEach((img) => img.setAttribute("alt", ""));
  clone.querySelectorAll(".reveal").forEach((el) => el.classList.remove("reveal"));
  clone.classList.add("marquee-dup");
  track.append(...clone.childNodes);
});

// Count-up metrics when scrolled into view
const counters = document.querySelectorAll("[data-count]");
if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
  const runCount = (el) => {
    const target = parseInt(el.getAttribute("data-count"), 10);
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => countObserver.observe(el));
}

// Back-to-top button
const backToTop = document.querySelector("[data-back-to-top]");
if (backToTop) {
  const toggleBackToTop = () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 640);
  };
  toggleBackToTop();
  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
}

// Official brand logos: auto-swap designed badges for real logo files
// listed in assets/brands/manifest.json (filename => displayed automatically).
fetch("assets/brands/manifest.json")
  .then((response) => (response.ok ? response.json() : null))
  .then((manifest) => {
    if (!manifest || !Array.isArray(manifest.logos)) return;
    const available = new Map(manifest.logos.map((f) => [f.replace(/\.[a-z0-9]+$/i, ""), f]));
    document.querySelectorAll("[data-logo]").forEach((slot) => {
      const file = available.get(slot.getAttribute("data-logo"));
      if (!file) return;
      const brandName = slot.getAttribute("data-brand") || "";
      const img = document.createElement("img");
      img.src = `assets/brands/${file}`;
      img.alt = `${brandName} logo`;
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("load", () => {
        if (slot.classList.contains("marquee-name")) {
          slot.textContent = "";
          slot.classList.add("marquee-logo");
          slot.appendChild(img);
        } else {
          const mono = slot.querySelector(".brand-mono, .brand-wordmark");
          if (mono) mono.remove();
          slot.appendChild(img);
        }
      });
    });
  })
  .catch(() => {});

// Announcement bar dismiss (per session)
const announceBar = document.querySelector("[data-announce]");
if (announceBar) {
  try {
    if (sessionStorage.getItem("dfs-announce-dismissed") === "1") announceBar.remove();
  } catch (e) {}
  announceBar.querySelector("[data-announce-close]")?.addEventListener("click", () => {
    announceBar.remove();
    try { sessionStorage.setItem("dfs-announce-dismissed", "1"); } catch (e) {}
  });
}

// "Do we deliver to you?" city checker
const cityInput = document.querySelector("[data-city-input]");
const cityResult = document.querySelector("[data-city-result]");
if (cityInput && cityResult) {
  const ROUTES = [
    { page: "dallas.html", label: "our Dallas / DFW home routes", state: "Texas",
      cities: ["Dallas","Fort Worth","Arlington","Plano","Irving","Frisco","Garland","Richardson","Carrollton","McKinney","Denton","Grand Prairie","Mesquite","Allen","Lewisville","Euless","Bedford","Grapevine","Flower Mound","Addison"] },
    { page: "houston.html", label: "our Houston-area routes", state: "Texas",
      cities: ["Houston","Katy","Sugar Land","Pearland","The Woodlands","Cypress","Spring","Missouri City","Richmond","Stafford","Humble","Pasadena","League City"] },
    { page: "austin.html", label: "our Central Texas routes", state: "Texas",
      cities: ["Austin","Round Rock","Cedar Park","Pflugerville","San Marcos","Georgetown","Leander","Hutto","Kyle"] },
    { page: "oklahoma.html", label: "our Oklahoma routes", state: "Oklahoma",
      cities: ["Oklahoma City","Tulsa","Norman","Edmond","Broken Arrow","Lawton","Stillwater","Moore","Yukon"] },
    { page: "new-mexico.html", label: "our New Mexico routes", state: "New Mexico",
      cities: ["Albuquerque","Santa Fe","Las Cruces","Rio Rancho"] },
    { page: "arkansas.html", label: "our Arkansas routes", state: "Arkansas",
      cities: ["Little Rock","North Little Rock","Fayetteville","Bentonville","Rogers","Springdale","Fort Smith","Conway"] },
    { page: "louisiana.html", label: "our Louisiana routes", state: "Louisiana",
      cities: ["New Orleans","Baton Rouge","Lafayette","Shreveport","Metairie","Lake Charles","Kenner","Bossier City"] },
  ];
  const norm = (s) => s.toLowerCase().replace(/[^a-z ]/g, "").trim();
  const editDistance = (a, b) => {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return dp[a.length][b.length];
  };
  const findMatch = (q) => {
    // pass 1: prefix or exact match
    for (const route of ROUTES) {
      for (const city of route.cities) {
        if (norm(city).startsWith(q)) return { route, city };
      }
      if (norm(route.state).startsWith(q)) return { route, city: route.state };
    }
    // pass 2: typo-tolerant (edit distance <= 2 on full name, e.g. "huston" -> Houston)
    if (q.length >= 4) {
      let best = null, bestDist = 3;
      for (const route of ROUTES) {
        for (const city of [...route.cities, route.state]) {
          const d = editDistance(q, norm(city));
          if (d < bestDist) { bestDist = d; best = { route, city }; }
        }
      }
      if (best) return best;
    }
    return null;
  };
  const renderResult = (query) => {
    const q = norm(query);
    if (q.length < 2) { cityResult.innerHTML = ""; cityResult.className = "checker-result"; return; }
    const match = findMatch(q);
    if (match) {
      const stateName = match.route.state;
      cityResult.className = "checker-result is-yes";
      cityResult.innerHTML = `<strong>${match.city}</strong> is inside our ${stateName} service region. Delivery availability depends on route and order size — <a href="contact.html">request wholesale info</a> or <a href="${match.route.page}">see ${stateName} coverage</a>.`;
    } else {
      cityResult.className = "checker-result is-maybe";
      cityResult.innerHTML = `<strong>We may still be able to help.</strong> Our region keeps growing — <a href="contact.html">ask our sales team about your city</a>.`;
    }
  };
  cityInput.addEventListener("input", () => renderResult(cityInput.value));
}


// Context-aware WhatsApp chat link
const waFloat = document.querySelector(".whatsapp-float");
if (waFloat) {
  const pageFile = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const MESSAGES = {
    "brands.html": "Hi Delta Food Supplies, I'd like brand availability info.",
    "nanak-foods.html": "Hi Delta Food Supplies, I'd like Nanak product availability.",
    "products.html": "Hi Delta Food Supplies, I'd like wholesale product availability.",
    "coming-soon.html": "Hi Delta Food Supplies, I'd like to place a wholesale order via WhatsApp.",
    "dallas.html": "Hi Delta Food Supplies, I'm a business in the Dallas/DFW area and I'd like wholesale info.",
    "houston.html": "Hi Delta Food Supplies, I'm a business in the Houston area and I'd like wholesale info.",
    "austin.html": "Hi Delta Food Supplies, I'm a business in the Austin area and I'd like wholesale info.",
    "oklahoma.html": "Hi Delta Food Supplies, I'm a business in Oklahoma and I'd like wholesale info.",
    "new-mexico.html": "Hi Delta Food Supplies, I'm a business in New Mexico and I'd like wholesale info.",
    "arkansas.html": "Hi Delta Food Supplies, I'm a business in Arkansas and I'd like wholesale info.",
    "louisiana.html": "Hi Delta Food Supplies, I'm a business in Louisiana and I'd like wholesale info.",
  };
  const msg = MESSAGES[pageFile] || "Hi Delta Food Supplies, I'd like wholesale product info.";
  waFloat.href = "https://wa.me/14694736655?text=" + encodeURIComponent(msg);
}

// Page loader: fade out as soon as the page is ready (failsafe in CSS)
const pageLoader = document.querySelector("[data-loader]");
if (pageLoader) {
  const hideLoader = () => {
    pageLoader.classList.add("is-done");
    setTimeout(() => pageLoader.remove(), 600);
  };
  if (document.readyState === "complete") {
    setTimeout(hideLoader, 200);
  } else {
    window.addEventListener("load", () => setTimeout(hideLoader, 200), { once: true });
    // don't hold visitors hostage on slow connections
    setTimeout(hideLoader, 2200);
  }
}


// Interactive region map: update info panel on hover/focus
const mapInfo = document.querySelector("[data-map-info]");
if (mapInfo) {
  document.querySelectorAll(".region-map .state").forEach((state) => {
    const show = () => {
      mapInfo.innerHTML = `<strong>${state.getAttribute("data-state")}</strong><span>${state.getAttribute("data-info")}</span><em>Click to open the ${state.getAttribute("data-state")} page</em>`;
    };
    state.addEventListener("mouseenter", show);
    state.addEventListener("focus", show);
  });
}

// Cursor spotlight on cards
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion) {
  let spotTicking = false;
  document.addEventListener("pointermove", (event) => {
    if (spotTicking) return;
    spotTicking = true;
    requestAnimationFrame(() => {
      spotTicking = false;
      const card = event.target.closest?.(".product-card, .brand-card, .brand-spotlight, .seo-card, .bento-cta");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  }, { passive: true });
}

// WhatsApp greeting bubble: appears once per session after a short delay
const waButton = document.querySelector(".whatsapp-float");
if (waButton) {
  let dismissed = false;
  try { dismissed = sessionStorage.getItem("dfs-wa-greeting") === "1"; } catch (e) {}
  if (!dismissed) {
    const bubble = document.createElement("div");
    bubble.className = "wa-greeting";
    bubble.setAttribute("role", "status");
    bubble.innerHTML =
      '<strong>Hi there! 👋</strong>' +
      '<span>Need wholesale prices or availability? Chat with our sales team on WhatsApp.</span>' +
      '<span class="wa-status">Replies Mon–Fri, 9am–5pm CT</span>' +
      '<button type="button" class="wa-greeting-close" aria-label="Dismiss chat greeting">&times;</button>';
    document.body.appendChild(bubble);
    const hideGreeting = (remember) => {
      bubble.classList.remove("is-shown");
      setTimeout(() => bubble.remove(), 400);
      if (remember) { try { sessionStorage.setItem("dfs-wa-greeting", "1"); } catch (e) {} }
    };
    setTimeout(() => bubble.classList.add("is-shown"), 4500);
    setTimeout(() => { if (bubble.isConnected) hideGreeting(false); }, 22000);
    bubble.querySelector(".wa-greeting-close").addEventListener("click", () => hideGreeting(true));
    bubble.addEventListener("click", (event) => {
      if (event.target.closest(".wa-greeting-close")) return;
      hideGreeting(true);
      waButton.click();
    });
  }
}
