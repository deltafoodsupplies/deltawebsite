// Diwali seasonal theme — sparkles, diyas and a greeting. Remove this file's <script> tag to switch off.
(function () {
  var DIYA =
    '<svg class="dw-diya" viewBox="0 0 34 34" aria-hidden="true">' +
    '<g class="dw-flame"><path d="M17 3 C21 9 21 13 17 17 C13 13 13 9 17 3z" fill="#ffb11a"/>' +
    '<path d="M17 8 C19 11 19 14 17 16.5 C15 14 15 11 17 8z" fill="#fff1b8"/></g>' +
    '<path d="M3 19 C6 29 28 29 31 19 C24 22 10 22 3 19z" fill="#c2531a"/>' +
    '<path d="M3 19 C10 22 24 22 31 19" fill="none" stroke="#ffd36b" stroke-width="1.6"/>' +
    '<circle cx="11" cy="24" r="1.2" fill="#ffd36b"/><circle cx="17" cy="25.2" r="1.2" fill="#ffd36b"/><circle cx="23" cy="24" r="1.2" fill="#ffd36b"/>' +
    '</svg>';

  function decorate(hero, sparks, diyas) {
    var sky = document.createElement("div");
    sky.className = "dw-sky";
    sky.setAttribute("aria-hidden", "true");
    for (var i = 0; i < sparks; i++) {
      var s = document.createElement("span");
      s.className = "dw-spark";
      s.style.left = (Math.random() * 100).toFixed(1) + "%";
      s.style.top = (Math.random() * 85).toFixed(1) + "%";
      s.style.animationDelay = (-Math.random() * 3.6).toFixed(2) + "s";
      var size = (2 + Math.random() * 3).toFixed(1) + "px";
      s.style.width = s.style.height = size;
      sky.appendChild(s);
    }
    hero.appendChild(sky);

    var row = document.createElement("div");
    row.className = "dw-diyas";
    row.setAttribute("aria-hidden", "true");
    row.innerHTML = new Array(diyas + 1).join(DIYA);
    hero.appendChild(row);
  }

  document.querySelectorAll(".hero").forEach(function (h) { decorate(h, 26, 5); });
  document.querySelectorAll(".page-hero").forEach(function (h) { decorate(h, 16, 3); });

  var content = document.querySelector(".hero .hero-content");
  if (content) {
    var chip = document.createElement("p");
    chip.className = "dw-chip";
    chip.innerHTML = DIYA.replace('class="dw-diya"', "") + "Happy Diwali from the Delta family";
    content.insertBefore(chip, content.firstChild);
  }
})();
