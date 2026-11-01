// Festival themes — turn on automatically by date (Dallas time).
// To change the schedule, edit FESTIVALS below: [theme, first day, last day] (inclusive).
// Preview a theme on any page with ?festival=diwali (navratri, holi, ramadan, eid, holidays,
// sankranti, ugadi, vaisakhi, rakhi, janmashtami, ganesh, onam, gurpurab);
// ?festival=off hides themes for the visit, ?festival=auto goes back to the schedule.
(function () {
  var FESTIVALS = [
    ["diwali",      "2026-10-20", "2026-11-11"], // Diwali Nov 8
    ["gurpurab",    "2026-11-20", "2026-11-26"], // Guru Nanak Jayanti Nov 24
    ["holidays",    "2026-12-15", "2027-01-01"],
    ["sankranti",   "2027-01-10", "2027-01-17"], // Lohri Jan 13, Sankranti Jan 14, Pongal Jan 15
    ["ramadan",     "2027-02-06", "2027-03-07"], // Ramadan from ~Feb 8
    ["eid",         "2027-03-08", "2027-03-13"], // Eid al-Fitr ~Mar 9–10
    ["holi",        "2027-03-15", "2027-03-23"], // Holi Mar 22
    ["ugadi",       "2027-04-03", "2027-04-09"], // Ugadi Apr 7–8
    ["vaisakhi",    "2027-04-11", "2027-04-16"], // Vaisakhi, Pohela Boishakh, Puthandu Apr 14–15
    ["eid",         "2027-05-13", "2027-05-19"], // Eid al-Adha ~May 16–17
    ["rakhi",       "2027-08-12", "2027-08-18"], // Raksha Bandhan Aug 17
    ["janmashtami", "2027-08-21", "2027-08-26"], // Janmashtami Aug 25
    ["ganesh",      "2027-08-31", "2027-09-07"], // Ganesh Chaturthi Sep 4
    ["onam",        "2027-09-08", "2027-09-13"], // Thiruvonam Sep 12
    ["navratri",    "2027-09-27", "2027-10-10"], // Navratri Sep 30, Dussehra Oct 9
    ["diwali",      "2027-10-15", "2027-11-01"], // Diwali ~Oct 29
    ["gurpurab",    "2027-11-10", "2027-11-15"], // Guru Nanak Jayanti Nov 14
    ["holidays",    "2027-12-15", "2028-01-01"],
    ["sankranti",   "2028-01-10", "2028-01-17"], // Lohri Jan 13–14, Sankranti/Pongal Jan 15
    ["ramadan",     "2028-01-26", "2028-02-25"], // Ramadan from ~Jan 28
    ["eid",         "2028-02-26", "2028-03-01"], // Eid al-Fitr ~Feb 26–27
    ["holi",        "2028-03-04", "2028-03-12"], // Holi Mar 11
    ["ugadi",       "2028-03-23", "2028-03-28"], // Ugadi Mar 27
    ["vaisakhi",    "2028-04-10", "2028-04-15"], // Vaisakhi, Pohela Boishakh, Puthandu Apr 13–14
    ["eid",         "2028-05-03", "2028-05-09"], // Eid al-Adha ~May 5–6
    ["rakhi",       "2028-08-01", "2028-08-06"], // Raksha Bandhan Aug 5
    ["janmashtami", "2028-08-09", "2028-08-14"], // Janmashtami Aug 13
    ["ganesh",      "2028-08-19", "2028-08-29"], // Ganesh Chaturthi Aug 23
    ["onam",        "2028-08-30", "2028-09-02"], // Thiruvonam Sep 1
    ["navratri",    "2028-09-16", "2028-09-28"], // Navratri Sep 19, Dussehra Sep 27
    ["diwali",      "2028-10-03", "2028-10-20"], // Diwali Oct 17
    ["gurpurab",    "2028-10-29", "2028-11-03"], // Guru Nanak Jayanti Nov 2
    ["holidays",    "2028-12-15", "2029-01-01"]
  ];

  var GREETINGS = {
    diwali:   { text: "Happy Diwali from the Delta family", href: "diwali-sweets-stocking-guide.html", icon: "diya" },
    navratri: { text: "Happy Navratri & Dussehra from the Delta family", icon: "diya" },
    holi:     { text: "Happy Holi from the Delta family", icon: "colors" },
    ramadan:  { text: "Ramadan Mubarak from the Delta family", icon: "moon" },
    eid:      { text: "Eid Mubarak from the Delta family", icon: "moon" },
    holidays: { text: "Happy Holidays from the Delta family", icon: "star" },
    sankranti:   { text: "Happy Sankranti, Pongal & Lohri from the Delta family", icon: "kite" },
    ugadi:       { text: "Happy Ugadi from the Delta family", icon: "leaf" },
    vaisakhi:    { text: "Happy Vaisakhi & New Year from the Delta family", icon: "wheat" },
    rakhi:       { text: "Happy Raksha Bandhan from the Delta family", icon: "rakhi" },
    janmashtami: { text: "Happy Janmashtami from the Delta family", icon: "feather" },
    ganesh:      { text: "Happy Ganesh Chaturthi from the Delta family", icon: "marigold" },
    onam:        { text: "Happy Onam from the Delta family", icon: "pookalam" },
    gurpurab:    { text: "Happy Gurpurab from the Delta family", icon: "diya" }
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
    star: '<path d="M17 2 L20.6 12.4 L31.6 12.6 L22.8 19.2 L26 29.8 L17 23.5 L8 29.8 L11.2 19.2 L2.4 12.6 L13.4 12.4 Z" fill="#ffe8a3"/>',
    kite: '<path d="M17 2 L28 14 L17 28 L6 14 Z" fill="#ffd54f"/><path d="M17 2 V28 M6 14 H28" stroke="#e65100" stroke-width="1.2"/><path d="M17 28 q-3 3 0 5 q3 2 0 4" fill="none" stroke="#e53935" stroke-width="1.4"/>',
    leaf: '<path d="M17 3 C6 12 8 26 17 32 C26 26 28 12 17 3Z" fill="#43a047"/><path d="M17 6 V30" stroke="#c8e6c9" stroke-width="1"/>',
    wheat: '<path d="M17 33 V8" stroke="#ffd54f" stroke-width="1.6"/><g fill="#ffd54f"><ellipse cx="13.5" cy="11" rx="2.4" ry="4" transform="rotate(-25 13.5 11)"/><ellipse cx="20.5" cy="11" rx="2.4" ry="4" transform="rotate(25 20.5 11)"/><ellipse cx="13.5" cy="18" rx="2.4" ry="4" transform="rotate(-25 13.5 18)"/><ellipse cx="20.5" cy="18" rx="2.4" ry="4" transform="rotate(25 20.5 18)"/><ellipse cx="17" cy="5" rx="2.2" ry="4"/></g>',
    rakhi: '<path d="M1 17 H33" stroke="#e53935" stroke-width="2"/><circle cx="17" cy="17" r="9" fill="#ffd54f"/><g fill="#e53935"><circle cx="17" cy="11.5" r="3"/><circle cx="22.5" cy="17" r="3"/><circle cx="17" cy="22.5" r="3"/><circle cx="11.5" cy="17" r="3"/></g><circle cx="17" cy="17" r="2.8" fill="#fff59d"/>',
    feather: '<path d="M17 33 V6" stroke="#c9a24a" stroke-width="1.2"/><ellipse cx="17" cy="13" rx="8" ry="12" fill="#2e7d32"/><ellipse cx="17" cy="14" rx="5.4" ry="7" fill="#1565c0"/><ellipse cx="17" cy="15" rx="3.2" ry="4.2" fill="#00897b"/><ellipse cx="17" cy="15.5" rx="1.6" ry="2.1" fill="#ffd54f"/>',
    marigold: '<circle cx="17" cy="17" r="13" fill="#e65100"/><circle cx="17" cy="17" r="10" fill="#f6a21a"/><circle cx="17" cy="17" r="6.6" fill="#ffc23d"/><circle cx="17" cy="17" r="2.6" fill="#c2531a"/>',
    pookalam: '<circle cx="17" cy="17" r="15" fill="#f6a21a"/><circle cx="17" cy="17" r="11" fill="#fff8e1"/><circle cx="17" cy="17" r="8" fill="#fdd835"/><circle cx="17" cy="17" r="5" fill="#e53935"/><circle cx="17" cy="17" r="2.2" fill="#fff8e1"/>'
  };

  // Large corner decorations for some themes (viewBox 0 0 100 100)
  var DECO = {
    sankranti: { cls: "fx-spin-slow", svg: '<g fill="#ffcf3a"><circle cx="50" cy="50" r="22"/>' + (function () { var r = ""; for (var i = 0; i < 12; i++) r += '<path d="M50 6 L54 22 L46 22 Z" transform="rotate(' + i * 30 + ' 50 50)"/>'; return r; })() + '</g><circle cx="50" cy="50" r="15" fill="#ffe27a"/>' },
    janmashtami: { cls: "fx-sway", svg: '<path d="M50 98 Q48 60 50 8" stroke="#c9a24a" stroke-width="2" fill="none"/><g><ellipse cx="50" cy="32" rx="22" ry="30" fill="#2e7d32" opacity=".95"/><ellipse cx="50" cy="34" rx="15" ry="19" fill="#1565c0"/><ellipse cx="50" cy="36" rx="9.5" ry="12" fill="#00897b"/><ellipse cx="50" cy="37" rx="5" ry="6.4" fill="#ffd54f"/><ellipse cx="50" cy="38" rx="2.4" ry="3" fill="#06143a"/></g>' },
    onam: { cls: "fx-spin-slow", svg: (function () { var r = '<circle cx="50" cy="50" r="48" fill="#e65100"/><circle cx="50" cy="50" r="42" fill="#fdd835"/>'; for (var i = 0; i < 16; i++) r += '<path d="M50 10 C56 20 56 28 50 34 C44 28 44 20 50 10Z" fill="#fff8e1" transform="rotate(' + i * 22.5 + ' 50 50)"/>'; r += '<circle cx="50" cy="50" r="17" fill="#e53935"/>'; for (var j = 0; j < 8; j++) r += '<circle cx="50" cy="38" r="4" fill="#f6a21a" transform="rotate(' + j * 45 + ' 50 50)"/>'; return r + '<circle cx="50" cy="50" r="6" fill="#2e7d32"/>'; })() },
    rakhi: { cls: "fx-sway", svg: '<path d="M0 50 C25 40 75 40 100 50" stroke="#e53935" stroke-width="4" fill="none"/><path d="M0 50 C25 40 75 40 100 50" stroke="#ffd54f" stroke-width="1.4" stroke-dasharray="4 5" fill="none"/><circle cx="50" cy="46" r="24" fill="#ffd54f"/>' + (function () { var r = ""; for (var i = 0; i < 8; i++) r += '<circle cx="50" cy="30" r="7" fill="#e53935" transform="rotate(' + i * 45 + ' 50 46)"/>'; return r; })() + '<circle cx="50" cy="46" r="10" fill="#fff59d"/><circle cx="50" cy="46" r="4" fill="#c62828"/>' },
    vaisakhi: { cls: "fx-sway", svg: '<g stroke="#ffd54f" stroke-width="2.4" fill="none"><path d="M50 98 V30"/><path d="M50 98 Q40 60 28 34"/><path d="M50 98 Q60 60 72 34"/></g><g fill="#ffcf3a">' + (function () { var r = ""; [[50, 14], [28, 20], [72, 20]].forEach(function (p) { for (var k = 0; k < 4; k++) { r += '<ellipse cx="' + (p[0] - 4) + '" cy="' + (p[1] + k * 7) + '" rx="3.2" ry="5.5" transform="rotate(-25 ' + (p[0] - 4) + " " + (p[1] + k * 7) + ')"/><ellipse cx="' + (p[0] + 4) + '" cy="' + (p[1] + k * 7) + '" rx="3.2" ry="5.5" transform="rotate(25 ' + (p[0] + 4) + " " + (p[1] + k * 7) + ')"/>'; } }); return r; })() + '</g>' }
  };
  var PETALS = { ganesh: ["#f6a21a", "#ffc23d", "#e53935"], onam: ["#fdd835", "#f6a21a", "#fff8e1", "#e53935"], ugadi: ["#43a047", "#ffc23d", "#fff8e1"], vaisakhi: ["#ffd54f", "#ff8f00", "#fff3c4"] };

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
    } else if (fest === "sankranti") {
      var kc = [["#e53935", "#ffd54f"], ["#1e88e5", "#fff"], ["#43a047", "#ffd54f"], ["#fbc02d", "#e53935"], ["#8e24aa", "#fff"]];
      for (i = 0; i < (big ? 6 : 3); i++) {
        el = document.createElement("span");
        el.className = "fx-kite";
        var c = kc[i % kc.length], ks = rand(0.7, 1.25);
        el.style.left = (big ? rand(50, 90) : rand(55, 92)).toFixed(1) + "%";
        el.style.top = rand(6, 42).toFixed(1) + "%";
        el.style.transform = "scale(" + ks.toFixed(2) + ")";
        el.style.animationDelay = (-rand(0, 7)).toFixed(1) + "s";
        el.innerHTML = '<svg viewBox="0 0 34 46"><path d="M17 1 L32 16 L17 34 L2 16 Z" fill="' + c[0] + '"/><path d="M17 1 V34 M2 16 H32" stroke="' + c[1] + '" stroke-width="1.2" opacity=".85"/><path d="M17 34 q-5 4 0 7 q5 3 0 7" fill="none" stroke="' + c[1] + '" stroke-width="1.4"/></svg>';
        layer.appendChild(el);
      }
    } else if (PETALS[fest]) {
      var pc = PETALS[fest];
      for (i = 0; i < (big ? 26 : 14); i++) {
        el = document.createElement("span");
        el.className = "fx-petal";
        var ps = rand(6, 12);
        el.style.width = ps.toFixed(1) + "px";
        el.style.height = (ps * 0.7).toFixed(1) + "px";
        el.style.left = rand(0, 100).toFixed(1) + "%";
        el.style.background = pc[i % pc.length];
        el.style.animationDuration = rand(9, 17).toFixed(1) + "s";
        el.style.animationDelay = (-rand(0, 17)).toFixed(1) + "s";
        el.style.setProperty("--fx-sway", rand(-60, 60).toFixed(0) + "px");
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
    if (DECO[fest]) {
      var d = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      d.setAttribute("viewBox", "0 0 100 100");
      d.setAttribute("class", "fx-deco " + DECO[fest].cls);
      d.setAttribute("aria-hidden", "true");
      d.innerHTML = DECO[fest].svg;
      hero.appendChild(d);
    }
    if (fest === "diwali" || fest === "navratri" || fest === "gurpurab" || fest === "ganesh") {
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
