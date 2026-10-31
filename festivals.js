// Festival themes — turn on automatically by date (Dallas time).
// To change the schedule, edit FESTIVALS below: [theme, first day, last day] (inclusive).
// Preview a theme on any page with ?festival=diwali (navratri, holi, ramadan, eid, holidays);
// ?festival=off hides themes for the visit, ?festival=auto goes back to the schedule.
(function () {
  var FESTIVALS = [
    ["diwali",   "2026-10-20", "2026-11-11"], // Diwali Nov 8
    ["holidays", "2026-12-15", "2027-01-01"],
    ["ramadan",  "2027-02-06", "2027-03-07"], // Ramadan from ~Feb 8
    ["eid",      "2027-03-08", "2027-03-13"], // Eid al-Fitr ~Mar 9–10
    ["holi",     "2027-03-15", "2027-03-23"], // Holi Mar 22
    ["eid",      "2027-05-13", "2027-05-19"], // Eid al-Adha ~May 16–17
    ["navratri", "2027-09-27", "2027-10-10"], // Navratri Sep 30, Dussehra Oct 9
    ["diwali",   "2027-10-15", "2027-11-01"], // Diwali ~Oct 29
    ["holidays", "2027-12-15", "2028-01-01"],
    ["ramadan",  "2028-01-26", "2028-02-25"], // Ramadan from ~Jan 28
    ["eid",      "2028-02-26", "2028-03-01"], // Eid al-Fitr ~Feb 26–27
    ["holi",     "2028-03-04", "2028-03-12"], // Holi Mar 11
    ["eid",      "2028-05-03", "2028-05-09"], // Eid al-Adha ~May 5–6
    ["navratri", "2028-09-16", "2028-09-28"], // Dussehra Sep 27
    ["diwali",   "2028-10-03", "2028-10-20"], // Diwali Oct 17
    ["holidays", "2028-12-15", "2029-01-01"]
  ];

  var GREETINGS = {
    diwali:   { text: "Happy Diwali from the Delta family", href: "diwali-sweets-stocking-guide.html", icon: "diya" },
    navratri: { text: "Happy Navratri & Dussehra from the Delta family", icon: "diya" },
    holi:     { text: "Happy Holi from the Delta family", icon: "colors" },
    ramadan:  { text: "Ramadan Mubarak from the Delta family", icon: "moon" },
    eid:      { text: "Eid Mubarak from the Delta family", icon: "moon" },
    holidays: { text: "Happy Holidays from the Delta family", icon: "star" }
  };

  function todayInDallas() {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
  }

  function pickFestival() {
    var override = null;
    try {
      var q = new URLSearchParams(location.search).get("festival");
      if (q) {
        if (q === "auto") sessionStorage.removeItem("dfs-festival");
        else sessionStorage.setItem("dfs-festival", q);
      }
      override = sessionStorage.getItem("dfs-festival");
    } catch (e) {}
    if (override === "off") return null;
    if (override && GREETINGS[override]) return override;
    var today = todayInDallas();
    for (var i = 0; i < FESTIVALS.length; i++) {
      if (today >= FESTIVALS[i][1] && today <= FESTIVALS[i][2]) return FESTIVALS[i][0];
    }
    return null;
  }

  var fest = pickFestival();
  if (!fest) return;
  var root = document.documentElement;
  root.classList.add("fest", "fest-" + fest);
  root.setAttribute("data-festival", fest);

  var ICONS = {
    diya: '<path d="M17 3 C21 9 21 13 17 17 C13 13 13 9 17 3z" fill="#ffb11a"/><path d="M17 8 C19 11 19 14 17 16.5 C15 14 15 11 17 8z" fill="#fff1b8"/><path d="M3 19 C6 29 28 29 31 19 C24 22 10 22 3 19z" fill="#c2531a"/><path d="M3 19 C10 22 24 22 31 19" fill="none" stroke="#ffd36b" stroke-width="1.6"/>',
    colors: '<circle cx="11" cy="13" r="7" fill="#e91e63"/><circle cx="22" cy="12" r="6" fill="#ffc107"/><circle cx="16" cy="22" r="7" fill="#2196f3"/><circle cx="25" cy="22" r="4.5" fill="#4caf50"/>',
    moon: '<path d="M21 4 A13 13 0 1 0 30 25 A10.5 10.5 0 1 1 21 4z" fill="#f4d58d"/><path d="M26 8 L27.2 10.8 L30.2 11 L27.9 13 L28.6 16 L26 14.4 L23.4 16 L24.1 13 L21.8 11 L24.8 10.8 Z" fill="#f4d58d"/>',
    star: '<path d="M17 2 L20.6 12.4 L31.6 12.6 L22.8 19.2 L26 29.8 L17 23.5 L8 29.8 L11.2 19.2 L2.4 12.6 L13.4 12.4 Z" fill="#ffe8a3"/>'
  };

  function diya() {
    return '<svg class="fx-diya" viewBox="0 0 34 34" aria-hidden="true">' +
      '<g class="fx-flame"><path d="M17 3 C21 9 21 13 17 17 C13 13 13 9 17 3z" fill="#ffb11a"/>' +
      '<path d="M17 8 C19 11 19 14 17 16.5 C15 14 15 11 17 8z" fill="#fff1b8"/></g>' +
      '<path d="M3 19 C6 29 28 29 31 19 C24 22 10 22 3 19z" fill="#c2531a"/>' +
      '<path d="M3 19 C10 22 24 22 31 19" fill="none" stroke="#ffd36b" stroke-width="1.6"/>' +
      '<circle cx="11" cy="24" r="1.2" fill="#ffd36b"/><circle cx="17" cy="25.2" r="1.2" fill="#ffd36b"/><circle cx="23" cy="24" r="1.2" fill="#ffd36b"/></svg>';
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function sky(hero, big) {
    var layer = document.createElement("div");
    layer.className = "fx-sky";
    layer.setAttribute("aria-hidden", "true");
    var i, el;
    if (fest === "holi") {
      var colors = ["#e91e63", "#ffc107", "#4caf50", "#2196f3", "#9c27b0", "#ff5722", "#00bcd4"];
      for (i = 0; i < (big ? 14 : 8); i++) {
        el = document.createElement("span");
        el.className = "fx-puff";
        var s = rand(50, big ? 170 : 120);
        el.style.width = el.style.height = s.toFixed(0) + "px";
        el.style.left = rand(-5, 95).toFixed(1) + "%";
        el.style.top = rand(-10, 90).toFixed(1) + "%";
        el.style.background = "radial-gradient(circle, " + colors[i % colors.length] + " 0%, transparent 70%)";
        el.style.animationDelay = (-rand(0, 14)).toFixed(1) + "s";
        layer.appendChild(el);
      }
    } else if (fest === "holidays") {
      for (i = 0; i < (big ? 40 : 24); i++) {
        el = document.createElement("span");
        el.className = "fx-snow";
        var z = rand(2.5, 6);
        el.style.width = el.style.height = z.toFixed(1) + "px";
        el.style.left = rand(0, 100).toFixed(1) + "%";
        el.style.opacity = rand(0.45, 0.95).toFixed(2);
        el.style.animationDuration = rand(9, 18).toFixed(1) + "s";
        el.style.animationDelay = (-rand(0, 18)).toFixed(1) + "s";
        el.style.setProperty("--fx-sway", rand(-40, 40).toFixed(0) + "px");
        layer.appendChild(el);
      }
    } else {
      var starry = fest === "ramadan" || fest === "eid";
      for (i = 0; i < (big ? 26 : 16); i++) {
        el = document.createElement("span");
        el.className = "fx-spark";
        var p = starry ? rand(1.5, 3.2) : rand(2, 5);
        el.style.width = el.style.height = p.toFixed(1) + "px";
        el.style.left = rand(0, 100).toFixed(1) + "%";
        el.style.top = rand(0, 85).toFixed(1) + "%";
        el.style.animationDelay = (-rand(0, 3.6)).toFixed(2) + "s";
        layer.appendChild(el);
      }
    }
    hero.appendChild(layer);

    if (fest === "ramadan" || fest === "eid") {
      var moon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      moon.setAttribute("viewBox", "0 0 34 34");
      moon.setAttribute("class", "fx-moon");
      moon.setAttribute("aria-hidden", "true");
      moon.innerHTML = ICONS.moon;
      hero.appendChild(moon);
    }
    if (fest === "diwali" || fest === "navratri") {
      var row = document.createElement("div");
      row.className = "fx-diyas";
      row.setAttribute("aria-hidden", "true");
      row.innerHTML = new Array((big ? 5 : 3) + 1).join(diya());
      hero.appendChild(row);
    }
  }

  function decorate() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll(".hero").forEach(function (h) { sky(h, !reduce); });
    document.querySelectorAll(".page-hero, .lost-hero").forEach(function (h) { sky(h, false); });

    var g = GREETINGS[fest];
    var content = document.querySelector(".hero .hero-content");
    if (g && content && !content.querySelector(".fx-chip")) {
      var chip = document.createElement(g.href ? "a" : "p");
      chip.className = "fx-chip";
      if (g.href) chip.href = g.href;
      chip.innerHTML = '<svg viewBox="0 0 34 34" aria-hidden="true">' + ICONS[g.icon] + "</svg><span>" + g.text + "</span>";
      content.insertBefore(chip, content.firstChild);
    }
    if (window.deltaI18nRefresh) window.deltaI18nRefresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", decorate);
  else decorate();
})();
