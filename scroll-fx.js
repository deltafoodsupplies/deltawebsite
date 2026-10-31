// Scroll storytelling extras (truck scroll bar + footer rangoli).
// Loaded by motion.js only after the page has fully loaded, so it never delays the first paint.
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var RANGOLI = "<svg class=\"mo-rangoli\" viewBox=\"0 0 400 400\" aria-hidden=\"true\" focusable=\"false\"><g class=\"rg1\" fill=\"var(--r1)\"><circle cx=\"200\" cy=\"200\" r=\"22\"/></g><g class=\"rg2\" fill=\"var(--r2)\"><ellipse cx=\"200\" cy=\"148\" rx=\"13\" ry=\"30\" transform=\"rotate(0.0 200 200)\"/><ellipse cx=\"200\" cy=\"148\" rx=\"13\" ry=\"30\" transform=\"rotate(45.0 200 200)\"/><ellipse cx=\"200\" cy=\"148\" rx=\"13\" ry=\"30\" transform=\"rotate(90.0 200 200)\"/><ellipse cx=\"200\" cy=\"148\" rx=\"13\" ry=\"30\" transform=\"rotate(135.0 200 200)\"/><ellipse cx=\"200\" cy=\"148\" rx=\"13\" ry=\"30\" transform=\"rotate(180.0 200 200)\"/><ellipse cx=\"200\" cy=\"148\" rx=\"13\" ry=\"30\" transform=\"rotate(225.0 200 200)\"/><ellipse cx=\"200\" cy=\"148\" rx=\"13\" ry=\"30\" transform=\"rotate(270.0 200 200)\"/><ellipse cx=\"200\" cy=\"148\" rx=\"13\" ry=\"30\" transform=\"rotate(315.0 200 200)\"/></g><g class=\"rg3\" fill=\"var(--r3)\"><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(0.0 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(22.5 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(45.0 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(67.5 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(90.0 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(112.5 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(135.0 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(157.5 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(180.0 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(202.5 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(225.0 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(247.5 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(270.0 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(292.5 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(315.0 200 200)\"/><ellipse cx=\"200\" cy=\"88\" rx=\"11\" ry=\"34\" transform=\"rotate(337.5 200 200)\"/></g><g class=\"rg4\"><g fill=\"var(--r4)\"><circle cx=\"200.0\" cy=\"32.0\" r=\"7\"/><circle cx=\"243.5\" cy=\"37.7\" r=\"7\"/><circle cx=\"284.0\" cy=\"54.5\" r=\"7\"/><circle cx=\"318.8\" cy=\"81.2\" r=\"7\"/><circle cx=\"345.5\" cy=\"116.0\" r=\"7\"/><circle cx=\"362.3\" cy=\"156.5\" r=\"7\"/><circle cx=\"368.0\" cy=\"200.0\" r=\"7\"/><circle cx=\"362.3\" cy=\"243.5\" r=\"7\"/><circle cx=\"345.5\" cy=\"284.0\" r=\"7\"/><circle cx=\"318.8\" cy=\"318.8\" r=\"7\"/><circle cx=\"284.0\" cy=\"345.5\" r=\"7\"/><circle cx=\"243.5\" cy=\"362.3\" r=\"7\"/><circle cx=\"200.0\" cy=\"368.0\" r=\"7\"/><circle cx=\"156.5\" cy=\"362.3\" r=\"7\"/><circle cx=\"116.0\" cy=\"345.5\" r=\"7\"/><circle cx=\"81.2\" cy=\"318.8\" r=\"7\"/><circle cx=\"54.5\" cy=\"284.0\" r=\"7\"/><circle cx=\"37.7\" cy=\"243.5\" r=\"7\"/><circle cx=\"32.0\" cy=\"200.0\" r=\"7\"/><circle cx=\"37.7\" cy=\"156.5\" r=\"7\"/><circle cx=\"54.5\" cy=\"116.0\" r=\"7\"/><circle cx=\"81.2\" cy=\"81.2\" r=\"7\"/><circle cx=\"116.0\" cy=\"54.5\" r=\"7\"/><circle cx=\"156.5\" cy=\"37.7\" r=\"7\"/></g><circle cx=\"200\" cy=\"200\" r=\"190\" fill=\"none\" stroke=\"var(--r1)\" stroke-width=\"3\" stroke-dasharray=\"2 12\" stroke-linecap=\"round\"/></g></svg>";
    // Truck scroll bar: a Delta truck drives the road; pins light up as it passes them
    var road = document.createElement("div");
    road.className = "mo-road is-top";
    road.setAttribute("aria-hidden", "true");
    road.innerHTML = '<i class="mo-pin" style="left:25%"></i><i class="mo-pin" style="left:50%"></i><i class="mo-pin" style="left:75%"></i><i class="mo-pin" style="left:100%"></i>' +
      '<svg class="mo-truck" viewBox="0 0 30 15"><rect x="0" y="1" width="19" height="10" rx="1.5" fill="#fff" stroke="#154297" stroke-width="1"/>' +
      '<rect x="2" y="7" width="15" height="1.6" fill="#f6a21a"/><path d="M19 3.5h5.2l3.3 4V11H19z" fill="#154297"/><path d="M21 5h2.6l2 2.5H21z" fill="#bcd3ff"/>' +
      '<circle class="mo-wheel" cx="6" cy="12" r="2.4" fill="#0c1a36"/><circle class="mo-wheel" cx="23" cy="12" r="2.4" fill="#0c1a36"/></svg>';
    document.body.appendChild(road);
    var pins = road.querySelectorAll(".mo-pin"), stopTimer, roadTick = false;
    function onRoad(moving) {
      roadTick = false;
      var h = document.documentElement.scrollHeight - innerHeight;
      var p = h > 0 ? scrollY / h : 0;
      road.style.setProperty("--mo-progress", p.toFixed(4));
      road.classList.toggle("is-top", scrollY < 40);
      for (var i = 0; i < pins.length; i++) pins[i].classList.toggle("is-passed", p >= (i + 1) / pins.length - 0.005);
      if (moving !== true) return;
      road.classList.add("is-moving");
      clearTimeout(stopTimer);
      stopTimer = setTimeout(function () { road.classList.remove("is-moving"); }, 160);
    }
    addEventListener("scroll", function () {
      if (roadTick) return;
      roadTick = true;
      requestAnimationFrame(function () { onRoad(true); });
    }, { passive: true });
    onRoad();

    // Rangoli in the footer (decorative; blooms as the footer scrolls into view)
    var foot = document.querySelector(".site-footer-pro");
    if (foot && !foot.querySelector(".mo-rangoli")) foot.insertAdjacentHTML("afterbegin", RANGOLI);
})();
