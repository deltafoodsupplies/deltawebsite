const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const toggle = document.querySelector("[data-nav-toggle]");

toggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open navigation");
  }
});

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const animatedElements = document.querySelectorAll(
  ".section, .nanak-band, .contact-panel, .product-card, .steps article, .review-card, .faq-list details"
);

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
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
