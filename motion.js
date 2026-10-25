// Motion layer — modern interactions. Skipped entirely for reduced-motion visitors.
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Scroll progress bar + hero scroll drift
  var bar = document.createElement("div");
  bar.className = "mo-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var hero = document.querySelector(".hero-illustration");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--mo-progress", h > 0 ? (scrollY / h).toFixed(4) : 0);
      if (hero && scrollY < innerHeight * 1.2) hero.style.setProperty("--mo-scroll", (scrollY * 0.12).toFixed(1) + "px");
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Section headings reveal
  if ("IntersectionObserver" in window) {
    var heads = document.querySelectorAll("main h2");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("mo-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    heads.forEach(function (h) {
      if (h.getBoundingClientRect().top < innerHeight * 0.88) return; // already on screen: leave as is
      h.classList.add("mo-heading");
      io.observe(h);
    });
  }

  if (!finePointer) return; // the rest is mouse-only

  // Cards: lift + tilt
  var cards = document.querySelectorAll(".product-card, .brand-card, .catalog-card, .seo-card, .review-card, .process .steps article, .contact-cards > div");
  cards.forEach(function (card) {
    card.classList.add("mo-tilt");
    card.addEventListener("pointermove", function (ev) {
      var r = card.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      card.classList.remove("mo-leave");
      card.classList.add("mo-hover");
      card.style.setProperty("--mo-ry", ((x - 0.5) * 6).toFixed(2) + "deg");
      card.style.setProperty("--mo-rx", ((0.5 - y) * 5).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", function () {
      card.classList.remove("mo-hover");
      card.classList.add("mo-leave");
      clearTimeout(card._moT);
      card._moT = setTimeout(function () { card.classList.remove("mo-leave"); }, 450);
      card.style.setProperty("--mo-rx", "0deg");
      card.style.setProperty("--mo-ry", "0deg");
    });
  });

  // Buttons: magnetic pull
  document.querySelectorAll(".button, .nav-cta").forEach(function (btn) {
    btn.classList.add("mo-magnet");
    btn.addEventListener("pointermove", function (ev) {
      var r = btn.getBoundingClientRect();
      var dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
      btn.classList.add("mo-hover");
      btn.style.transform = "translate(" + (dx * 0.18).toFixed(1) + "px," + (dy * 0.28).toFixed(1) + "px)";
    });
    btn.addEventListener("pointerleave", function () {
      btn.classList.remove("mo-hover");
      btn.style.transform = "";
    });
  });

  // Hero illustration follows the pointer slightly
  var heroSec = document.querySelector(".hero");
  if (hero && heroSec) {
    heroSec.addEventListener("pointermove", function (ev) {
      var r = heroSec.getBoundingClientRect();
      hero.style.setProperty("--mo-px", (((ev.clientX - r.left) / r.width - 0.5) * 16).toFixed(1) + "px");
      hero.style.setProperty("--mo-py", (((ev.clientY - r.top) / r.height - 0.5) * 12).toFixed(1) + "px");
    });
    heroSec.addEventListener("pointerleave", function () {
      hero.style.setProperty("--mo-px", "0px");
      hero.style.setProperty("--mo-py", "0px");
    });
  }
})();
