// ============================================================
// Website form handler → Delta API (activate AFTER the backend
// is deployed). Add to each page with forms:
//   <script src="site/api-forms.js" data-api="https://YOUR-CLOUD-RUN-URL" defer></script>
//
// Progressive enhancement: if the API is unreachable, the form
// falls back to its normal FormSubmit action — zero lost leads.
// ============================================================
(() => {
  const API_BASE =
    document.currentScript?.getAttribute("data-api") || "https://api.deltafoodsupplies.com";

  const FIELD_MAP = {
    "Business name": "businessName",
    "Contact name": "contactName",
    "Email": "email",
    "Phone": "phone",
    "City": "city",
    "City and state": "city",
    "Business type": "businessType",
    "Message": "message",
  };

  document.querySelectorAll('form[action*="formsubmit.co"]').forEach((form) => {
    async function handler(event) {
      event.preventDefault();
      const raw = new FormData(form);
      const payload = { _honey: raw.get("_honey") || "" };
      for (const [name, value] of raw.entries()) {
        if (FIELD_MAP[name]) payload[FIELD_MAP[name]] = value;
      }
      payload.type = /account application/i.test(raw.get("_subject") || "")
        ? "account-application"
        : "contact";

      const button = form.querySelector('button[type="submit"]');
      const label = button ? button.textContent : "";
      if (button) {
        button.disabled = true;
        button.textContent = "Sending…";
      }

      try {
        const response = await fetch(`${API_BASE}/api/inquiries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`API ${response.status}`);
        window.location.href = "thank-you.html";
      } catch (err) {
        // API down? Fall back to the original FormSubmit action.
        console.warn("[forms] API unavailable, falling back:", err.message);
        if (button) {
          button.disabled = false;
          button.textContent = label;
        }
        form.removeEventListener("submit", handler);
        form.submit();
      }
    }
    form.addEventListener("submit", handler);
  });
})();
