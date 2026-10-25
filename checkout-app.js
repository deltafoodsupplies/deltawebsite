const STORAGE_KEY = "deltaOrderPortal";
const SESSION_KEY = "deltaOrderSession";
const DRAFT_KEY = "deltaOrderDraft";
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const cloneSeed = () => JSON.parse(JSON.stringify(window.DeltaOrderSeed || {}));
const normalize = (value) => String(value || "").trim().toLowerCase();
const slugify = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const todayIso = () => new Date().toISOString().slice(0, 10);

const categoryForProduct = (product) => {
  const text = `${product.productCategory || ""} ${product.category || ""} ${product.name || ""} ${product.pack || ""}`.toLowerCase();
  if (text.includes("frozen") || text.includes("frz") || text.includes("momo") || text.includes("samosa")) return "Frozen";
  if (text.includes("dairy") || text.includes("paneer") || text.includes("yogurt") || text.includes("lassi") || text.includes("cooler")) return "Cooler";
  return "Dry";
};

const subCategoryForProduct = (product) => {
  if (product.subCategory) return product.subCategory;
  const text = `${product.category || ""} ${product.name || ""}`.toLowerCase();
  if (text.includes("momo")) return "Momo's";
  if (text.includes("samosa")) return "Samosa";
  if (text.includes("paneer")) return "Paneer";
  if (text.includes("sweet") || text.includes("rasmalai") || text.includes("burfi") || text.includes("ladoo")) return "Sweets";
  if (text.includes("spice") || text.includes("masala")) return "Spices";
  if (text.includes("tea") || text.includes("drink") || text.includes("syrup")) return "Beverages";
  if (text.includes("bread") || text.includes("naan") || text.includes("parotta")) return "Frozen Breads";
  if (text.includes("vegetable") || text.includes("okra")) return "Frozen Vegetables";
  return product.category || "General";
};

const normalizeProduct = (product) => {
  const active = typeof product.active === "boolean" ? product.active : product.available !== false;
  const hide = Boolean(product.hide || product.hideFromCustomer);
  const outOfStock = Boolean(product.outOfStock);
  const productCategory = categoryForProduct(product);
  return {
    ...product,
    id: product.id || `${slugify(product.brand)}-${slugify(product.name)}`,
    sku: product.sku || product.code || "",
    brand: product.brand || "Unassigned",
    productCategory,
    category: product.category || productCategory,
    subCategory: subCategoryForProduct(product),
    pack: product.pack || product.caseSize || "",
    price: Number(product.price || 0),
    forms: product.forms?.length ? product.forms : ["store", "restaurant"],
    labelIds: product.labelIds || [],
    isNew: Boolean(product.isNew),
    available: active && !hide && !outOfStock && product.available !== false
  };
};

const fullSeed = () => {
  const seed = cloneSeed();
  const imported = JSON.parse(JSON.stringify(window.DeltaPdfProducts || []));
  const byId = new Map((seed.products || []).map((product) => [product.id, product]));
  imported.forEach((product) => {
    if (!byId.has(product.id)) byId.set(product.id, product);
  });
  seed.products = [...byId.values()];
  seed.customers ||= [];
  seed.labels ||= [];
  seed.orders ||= [];
  return seed;
};

const withDefaults = (db) => {
  const seed = fullSeed();
  const productMap = new Map((db.products || []).map((product) => [product.id, normalizeProduct(product)]));
  seed.products.forEach((product) => {
    if (!productMap.has(product.id)) productMap.set(product.id, normalizeProduct(product));
  });
  db.products = [...productMap.values()].map(normalizeProduct);

  const customerMap = new Map((db.customers || []).map((customer) => [customer.id, customer]));
  seed.customers.forEach((customer) => {
    if (!customerMap.has(customer.id)) customerMap.set(customer.id, customer);
  });
  db.customers = [...customerMap.values()];

  const labelMap = new Map((db.labels || []).map((label) => [label.id, label]));
  seed.labels.forEach((label) => {
    if (!labelMap.has(label.id)) labelMap.set(label.id, label);
  });
  db.labels = [...labelMap.values()];
  db.orders ||= [];
  return db;
};

const loadDb = () => withDefaults(JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(fullSeed())));
const saveDb = (db) => localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
const loadDraft = () => JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
const saveDraft = () => sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state.draft));

const state = {
  db: loadDb(),
  draft: loadDraft()
};

const elements = {
  shell: document.querySelector("[data-checkout-shell]"),
  reviewPanel: document.querySelector("[data-review-panel]"),
  successPanel: document.querySelector("[data-success-panel]"),
  account: document.querySelector("[data-checkout-account]"),
  groups: document.querySelector("[data-review-groups]"),
  cases: document.querySelector("[data-review-cases]"),
  total: document.querySelector("[data-review-total]"),
  summaryCases: document.querySelector("[data-summary-cases]"),
  summaryTotal: document.querySelector("[data-summary-total]"),
  fulfillment: document.querySelector("[data-review-fulfillment]"),
  notes: document.querySelector("[data-review-notes]"),
  upsells: document.querySelector("[data-review-upsells]"),
  placeOrder: document.querySelector("[data-place-order]"),
  status: document.querySelector("[data-review-status]"),
  portalLoginLink: document.querySelector("[data-portal-login-link]"),
  accountToggle: document.querySelector("[data-account-toggle]"),
  accountDropdown: document.querySelector("[data-account-dropdown]"),
  accountInitials: document.querySelector("[data-account-initials]"),
  accountName: document.querySelector("[data-account-name]"),
  accountMenuSummary: document.querySelector("[data-account-menu-summary]"),
  accountSettingsToggle: document.querySelector("[data-account-settings-toggle]"),
  accountSettingsPanel: document.querySelector("[data-account-settings-panel]"),
  logoutButtons: document.querySelectorAll("[data-logout]")
};

const currentCustomer = () => state.db.customers.find((customer) => customer.id === sessionStorage.getItem(SESSION_KEY) && customer.active !== false);
const productById = (id) => state.db.products.find((product) => product.id === id);
const cartItems = () => Object.entries(state.draft?.cart || {})
  .map(([id, qty]) => ({ product: productById(id), qty: Number(qty) || 0 }))
  .filter((line) => line.product && line.qty > 0);

const totals = () => {
  const items = cartItems();
  return {
    items,
    cases: items.reduce((sum, line) => sum + line.qty, 0),
    total: items.reduce((sum, line) => sum + line.qty * line.product.price, 0)
  };
};

const hasLabel = (product, terms) => (product.labelIds || []).some((id) => {
  const label = state.db.labels.find((item) => item.id === id);
  return terms.some((term) => normalize(label?.name).includes(term));
});

const accountProducts = () => state.db.products.filter((product) => product.available && product.forms.includes(state.draft?.formType || "store"));
const recommendedProducts = () => {
  const inCart = new Set(Object.keys(state.draft?.cart || {}));
  const brands = new Set(cartItems().map((line) => line.product.brand));
  const subCategories = new Set(cartItems().map((line) => line.product.subCategory));
  return accountProducts()
    .filter((product) => !inCart.has(product.id))
    .map((product) => {
      let score = 0;
      if (brands.has(product.brand)) score += 4;
      if (subCategories.has(product.subCategory)) score += 3;
      if (normalize(product.brand).includes("nanak")) score += 2;
      if (hasLabel(product, ["sale", "short", "new"])) score += 3;
      if (["Paneer", "Spices", "Frozen Breads", "Sweets", "Momo's"].includes(product.subCategory)) score += 1;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, 6)
    .map((item) => item.product);
};

const ensureDraft = () => {
  const customer = currentCustomer();
  renderHeaderAccount();
  if (!customer || !state.draft || state.draft.customerId !== customer.id || !cartItems().length) {
    elements.reviewPanel.innerHTML = `<div class="empty-state"><strong>No order draft found.</strong><p>Return to the ordering page and add at least one case before review.</p><a class="button primary" href="order.html">Go to order portal</a></div>`;
    return false;
  }
  return true;
};

const renderHeaderAccount = () => {
  const customer = currentCustomer();
  elements.portalLoginLink?.classList.toggle("is-hidden", Boolean(customer));
  elements.accountToggle?.classList.toggle("is-hidden", !customer);
  if (!customer || !elements.accountToggle) return;
  const words = String(customer.name || "Delta Food").split(/\s+/).filter(Boolean);
  elements.accountInitials.textContent = words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  elements.accountName.textContent = customer.name;
  elements.accountMenuSummary.innerHTML = `
    <strong>${customer.name}</strong>
    <span>${customer.email}</span>
    <span>${customer.cadence === "twice-weekly" ? "Twice weekly" : "Weekly"}: ${customer.orderDays?.join(" / ") || "Scheduled"}</span>
    <span>Cutoff ${customer.cutoff || "10:00 AM"}</span>
  `;
  elements.accountSettingsPanel.innerHTML = `
    <span><b>Company type</b>${customer.companyType || "Wholesale account"}</span>
    <span><b>Allowed forms</b>${customer.allowedForms?.join(", ") || "store"}</span>
    <span><b>Sales contact</b>${customer.salesPerson || "Delta Sales"}</span>
    <span><b>Phone</b>${customer.mainPhone || "Office: +1 469.473.6655"}</span>
  `;
};

const updateQty = (id, qty) => {
  const safeQty = Math.max(0, Number.parseInt(qty, 10) || 0);
  if (safeQty === 0) delete state.draft.cart[id];
  else state.draft.cart[id] = safeQty;
  saveDraft();
  renderReview();
};

const addProduct = (id) => {
  state.draft.cart[id] = (Number(state.draft.cart[id]) || 0) + 1;
  saveDraft();
  renderReview();
};

const renderAccount = () => {
  const customer = currentCustomer();
  const total = totals();
  elements.account.innerHTML = `
    <span>Account dashboard</span>
    <strong>${customer.name}</strong>
    <p>${customer.email}</p>
    <div><b>${state.draft.formType === "restaurant" ? "Restaurant" : "Store"} order</b><b>${state.draft.fulfillment}</b></div>
    <div><b>${customer.orderDays?.join(" / ") || "Scheduled"}</b><b>Cutoff ${customer.cutoff || "10:00 AM"}</b></div>
    <div><b>${total.cases} cases</b><b>${currency.format(total.total)}</b></div>
  `;
  elements.fulfillment.value = state.draft.fulfillment || "Delta truck delivery";
  elements.notes.value = state.draft.notes || "";
};

const renderGroups = () => {
  const grouped = cartItems().reduce((acc, line) => {
    const category = line.product.productCategory || "Dry";
    acc[category] ||= [];
    acc[category].push(line);
    return acc;
  }, {});
  elements.groups.innerHTML = ["Cooler", "Frozen", "Dry"].map((category) => {
    const lines = grouped[category] || [];
    if (!lines.length) return "";
    return `<section class="review-group"><h3>${category}</h3>${lines.map((line) => `<article class="review-line"><div><span>${line.product.brand} | ${line.product.sku}</span><strong>${line.product.name}</strong><p>${line.product.subCategory} | ${line.product.pack}</p></div><span>${currency.format(line.product.price)}</span><div class="qty-stepper"><button type="button" data-review-minus="${line.product.id}">-</button><input data-review-qty="${line.product.id}" type="number" min="0" value="${line.qty}" /><button type="button" data-review-plus="${line.product.id}">+</button></div><strong>${currency.format(line.qty * line.product.price)}</strong></article>`).join("")}</section>`;
  }).join("");
};

const renderUpsells = () => {
  const products = recommendedProducts();
  elements.upsells.innerHTML = products.length
    ? products.map((product) => `<button type="button" data-add-review-product="${product.id}"><span>${product.brand}</span><strong>${product.name}</strong><small>${product.pack} | ${currency.format(product.price)}</small></button>`).join("")
    : `<p class="small-note">No additional recommendations for this cart.</p>`;
};

const renderTotals = () => {
  const total = totals();
  elements.cases.textContent = String(total.cases);
  elements.total.textContent = currency.format(total.total);
  elements.summaryCases.textContent = String(total.cases);
  elements.summaryTotal.textContent = currency.format(total.total);
};

const renderReview = () => {
  if (!ensureDraft()) return;
  renderAccount();
  renderGroups();
  renderUpsells();
  renderTotals();
};

const submitOrder = () => {
  if (!ensureDraft()) return;
  const customer = currentCustomer();
  const total = totals();
  if (!total.items.length) {
    elements.status.textContent = "Add at least one case before submitting.";
    return;
  }
  state.draft.fulfillment = elements.fulfillment.value;
  state.draft.notes = elements.notes.value.trim();
  const order = {
    id: `DFS-${Date.now()}`,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    companyName: customer.name,
    territory: `DFS_${customer.state || "TX"}`,
    salesPerson: customer.salesPerson || "Delta Sales",
    formType: state.draft.formType,
    fulfillment: state.draft.fulfillment,
    notes: state.draft.notes,
    status: "Order Received",
    orderDate: todayIso(),
    shipDate: "",
    submittedAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    items: total.items.map((line) => ({
      productId: line.product.id,
      sku: line.product.sku,
      name: line.product.name,
      brand: line.product.brand,
      category: line.product.productCategory,
      subCategory: line.product.subCategory,
      pack: line.product.pack,
      price: line.product.price,
      qty: line.qty
    }))
  };
  state.db.orders.unshift(order);
  saveDb(state.db);
  sessionStorage.removeItem(DRAFT_KEY);
  elements.reviewPanel.classList.add("is-hidden");
  elements.successPanel.classList.remove("is-hidden");
  elements.successPanel.innerHTML = `
    <div class="success-card">
      <p class="section-kicker">Order submitted</p>
      <h1>${order.id}</h1>
      <p>Your order was received by Delta Food Supplies. Estimated total: <strong>${currency.format(total.total)}</strong>.</p>
      <div class="next-steps">
        <article><span>1</span><strong>Order Received</strong><p>Delta sales will review item availability and pricing.</p></article>
        <article><span>2</span><strong>Order Entered</strong><p>Your order is entered for warehouse preparation or delivery route planning.</p></article>
        <article><span>3</span><strong>Order Shipped</strong><p>You will receive your order by Delta truck delivery or warehouse pickup.</p></article>
      </div>
      <div class="hero-actions"><a class="button primary" href="order.html">Start another order</a><a class="button secondary" href="contact.html">Contact sales</a></div>
    </div>
  `;
};

elements.groups.addEventListener("click", (event) => {
  const minus = event.target.closest("[data-review-minus]");
  const plus = event.target.closest("[data-review-plus]");
  if (minus) updateQty(minus.dataset.reviewMinus, (state.draft.cart[minus.dataset.reviewMinus] || 0) - 1);
  if (plus) updateQty(plus.dataset.reviewPlus, (state.draft.cart[plus.dataset.reviewPlus] || 0) + 1);
});

elements.groups.addEventListener("input", (event) => {
  const input = event.target.closest("[data-review-qty]");
  if (input) updateQty(input.dataset.reviewQty, input.value);
});

elements.upsells.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-review-product]");
  if (button) addProduct(button.dataset.addReviewProduct);
});

elements.fulfillment.addEventListener("change", () => {
  state.draft.fulfillment = elements.fulfillment.value;
  saveDraft();
  renderAccount();
});

elements.notes.addEventListener("input", () => {
  state.draft.notes = elements.notes.value;
  saveDraft();
});

elements.placeOrder.addEventListener("click", submitOrder);
elements.accountToggle?.addEventListener("click", () => {
  const isOpen = !elements.accountDropdown.classList.contains("is-hidden");
  elements.accountDropdown.classList.toggle("is-hidden", isOpen);
  elements.accountToggle.setAttribute("aria-expanded", String(!isOpen));
});
elements.accountSettingsToggle?.addEventListener("click", () => {
  elements.accountSettingsPanel.classList.toggle("is-hidden");
});
elements.logoutButtons.forEach((button) => button.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(DRAFT_KEY);
  window.location.href = "order.html";
}));
renderReview();
