// Visitor stats with GoatCounter (privacy-friendly: no cookies, no personal data).
// Dashboard: https://deltafoodsupplies.goatcounter.com  (private — log in to view)
// Counts page views plus a few useful actions, listed under "events" in the dashboard:
//   whatsapp, call, email, inquiry-form, language/<code>, language-prompt/<yes|no>, festival-chip/<theme>, order-cta
(function () {
  var CODE = "deltafoodsupplies";
  // Only count the live site — not local copies or previews
  if (!/(^|\.)deltafoodsupplies\.com$/.test(location.hostname)) return;

  var queue = [];
  function send(name, title) {
    var gc = window.goatcounter;
    if (gc && gc.count) gc.count({ path: name, title: title || name, event: true });
    else queue.push([name, title]);
  }

  function load() {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://" + CODE + ".goatcounter.com/count");
    s.onload = function () {
      var wait = setInterval(function () {
        if (window.goatcounter && window.goatcounter.count) {
          clearInterval(wait);
          queue.splice(0).forEach(function (q) { send(q[0], q[1]); });
        }
      }, 200);
      setTimeout(function () { clearInterval(wait); }, 10000);
    };
    document.head.appendChild(s);
  }
  // Load after the page is ready so it never slows the first paint
  if (document.readyState === "complete") load(); else addEventListener("load", load);

  var page = location.pathname.replace(/^\//, "") || "index.html";
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("a, button") : null;
    if (!t) return;
    var href = t.getAttribute("href") || "";
    if (/^https:\/\/wa\.me\//.test(href)) send("whatsapp", "WhatsApp tap on " + page);
    else if (/^tel:/.test(href)) send("call", "Phone tap on " + page);
    else if (/^mailto:/.test(href)) send("email", "Email tap on " + page);
    else if (t.classList.contains("fx-chip")) send("festival-chip/" + (document.documentElement.getAttribute("data-festival") || "unknown"), "Festival greeting tap");
    else if (t.hasAttribute("data-lang") && t.closest(".lang-menu")) send("language/" + t.getAttribute("data-lang"), "Language switch");
    else if (t.classList.contains("lang-prompt-yes")) send("language-prompt/yes", "Accepted phone-language suggestion");
    else if (t.classList.contains("lang-prompt-no")) send("language-prompt/no", "Stayed in English");
    else if (t.classList.contains("primary") && /contact\.html|become-a-customer\.html/.test(href)) send("order-cta", "Order button on " + page);
  }, true);

  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f || !f.matches || !f.matches("form")) return;
    var subj = f.querySelector('input[name="_subject"]');
    send("inquiry-form", (subj ? subj.value : "Form") + " — " + page);
  }, true);
})();
