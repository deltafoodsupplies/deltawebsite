const STORAGE_KEY = "deltaOrderPortal";
const SESSION_KEY = "deltaOrderSession";
const DRAFT_KEY = "deltaOrderDraft";
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const cloneSeed = () => JSON.parse(JSON.stringify(window.DeltaOrderSeed || {}));
const normalize = (value) => String(value || "").trim().toLowerCase();
const slugify = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
  const outOfStock = Boolean(product.outOfStock);
  const hide = Boolean(product.hide || product.hideFromCustomer);
  const active = typeof product.active === "boolean" ? product.active : product.available !== false;
  const productCategory = categoryForProduct(product);
  return {
    ...product,
    id: product.id || `${slugify(product.brand)}-${slugify(product.name)}`,
    sku: product.sku || product.code || "",
    brand: product.brand || "Unassigned",
    category: product.category || productCategory,
    productCategory,
    subCategory: subCategoryForProduct(product),
    pack: product.pack || product.caseSize || "",
    price: Number(product.price || 0),
    description: product.description || "",
    tagText: product.tagText || "",
    forms: product.forms?.length ? product.forms : ["store", "restaurant"],
    labelIds: product.labelIds || [],
    outOfStock,
    hide,
    active,
    available: active && !hide && !outOfStock && product.available !== false,
    isNew: Boolean(product.isNew)
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
  seed.labels ||= [];
  seed.customers ||= [];
  seed.orders ||= [];
  return seed;
};

const withCustomerDefaults = (db) => {
  const seed = fullSeed();
  const existingProducts = new Map((db.products || []).map((product) => [product.id, normalizeProduct(product)]));
  seed.products.forEach((product) => {
    if (!existingProducts.has(product.id)) existingProducts.set(product.id, normalizeProduct(product));
  });
  db.products = [...existingProducts.values()].map(normalizeProduct);

  const existingLabels = new Map((db.labels || db.tags || []).map((label) => [label.id, label]));
  seed.labels.forEach((label) => {
    if (!existingLabels.has(label.id)) existingLabels.set(label.id, label);
  });
  db.labels = [...existingLabels.values()].map((label) => ({
    id: label.id,
    name: label.name,
    color: label.color || "#0f8a4b",
    active: typeof label.active === "boolean" ? label.active : true,
    territory: label.territory || "All"
  }));

  const seedCustomers = seed.customers || [];
  const customerMap = new Map((db.customers || []).map((customer) => [customer.id, customer]));
  seedCustomers.forEach((customer) => {
    if (!customerMap.has(customer.id)) customerMap.set(customer.id, customer);
  });
  db.customers = [...customerMap.values()].map((customer) => {
    const fallback = seedCustomers.find((item) => item.id === customer.id) || {};
    return {
      ...customer,
      email: customer.email || fallback.email || "",
      accessCode: customer.accessCode || fallback.accessCode || "",
      active: typeof customer.active === "boolean" ? customer.active : true,
      allowedForms: customer.allowedForms?.length ? customer.allowedForms : ["store"],
      orderDays: customer.orderDays?.length ? customer.orderDays : ["Monday"],
      cutoff: customer.cutoff || fallback.cutoff || "10:00 AM",
      cadence: customer.cadence || fallback.cadence || "weekly",
      companyType: customer.companyType || fallback.companyType || "Retailer"
    };
  });
  db.orders ||= [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
};

const loadDb = () => withCustomerDefaults(JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(fullSeed())));
const saveDb = (db) => localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
const loadDraft = () => JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
const initialDraft = loadDraft();
const saveDraft = () => {
  const customer = currentCustomer();
  if (!customer) return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
    customerId: customer.id,
    formType: state.formType,
    fulfillment: elements.fulfillment?.value || loadDraft()?.fulfillment || "Delta truck delivery",
    notes: elements.notes?.value?.trim() || loadDraft()?.notes || "",
    cart: state.cart,
    updatedAt: new Date().toISOString()
  }));
};

const state = {
  db: loadDb(),
  customerId: sessionStorage.getItem(SESSION_KEY) || "",
  formType: initialDraft?.customerId === sessionStorage.getItem(SESSION_KEY) ? initialDraft.formType : "store",
  orderView: "reorder",
  cart: initialDraft?.customerId === sessionStorage.getItem(SESSION_KEY) ? initialDraft.cart || {} : {}
};

const elements = {
  loginShell: document.querySelector("[data-login-shell]"),
  loginForm: document.querySelector("[data-login-form]"),
  resetForm: document.querySelector("[data-reset-form]"),
  showReset: document.querySelector("[data-show-reset]"),
  showLogin: document.querySelector("[data-show-login]"),
  loginStatus: document.querySelector("[data-login-status]"),
  resetStatus: document.querySelector("[data-reset-status]"),
  orderShell: document.querySelector("[data-order-shell]"),
  logoutButtons: document.querySelectorAll("[data-logout]"),
  accountCard: document.querySelector("[data-account-card]"),
  formTabs: document.querySelector("[data-form-tabs]"),
  fulfillment: document.querySelector("[data-fulfillment]"),
  notes: document.querySelector("[data-order-notes]"),
  search: document.querySelector("[data-product-search]"),
  category: document.querySelector("[data-category-filter]"),
  brand: document.querySelector("[data-brand-filter]"),
  display: document.querySelector("[data-display-mode]"),
  productList: document.querySelector("[data-product-list]"),
  cartCount: document.querySelector("[data-cart-count]"),
  cartLines: document.querySelector("[data-cart-lines]"),
  totalCases: document.querySelector("[data-total-cases]"),
  totalPrice: document.querySelector("[data-total-price]"),
  clearCart: document.querySelector("[data-clear-cart]"),
  submit: document.querySelector("[data-submit-order]"),
  status: document.querySelector("[data-order-status]"),
  reorderGrid: document.querySelector("[data-reorder-grid]"),
  merchNav: document.querySelector("[data-merch-nav]"),
  orderDeadline: document.querySelector("[data-order-deadline]"),
  upsellStrip: document.querySelector("[data-upsell-strip]"),
  cartSuggestions: document.querySelector("[data-cart-suggestions]"),
  mobileCartBar: document.querySelector("[data-mobile-cart-bar]"),
  mobileCartCount: document.querySelector("[data-mobile-cart-count]"),
  mobileCartTotal: document.querySelector("[data-mobile-cart-total]"),
  mobileSubmit: document.querySelector("[data-mobile-submit]"),
  portalAccount: document.querySelector("[data-portal-account]"),
  portalLoginLink: document.querySelector("[data-portal-login-link]"),
  accountToggle: document.querySelector("[data-account-toggle]"),
  accountDropdown: document.querySelector("[data-account-dropdown]"),
  accountInitials: document.querySelector("[data-account-initials]"),
  accountName: document.querySelector("[data-account-name]"),
  accountMenuSummary: document.querySelector("[data-account-menu-summary]"),
  accountSettingsToggle: document.querySelector("[data-account-settings-toggle]"),
  accountSettingsPanel: document.querySelector("[data-account-settings-panel]")
};

if (initialDraft?.customerId === state.customerId) {
  if (elements.fulfillment) elements.fulfillment.value = initialDraft.fulfillment || "Delta truck delivery";
  if (elements.notes) elements.notes.value = initialDraft.notes || "";
}

const currentCustomer = () => state.db.customers.find((customer) => customer.id === state.customerId && customer.active);
const isAuthenticated = () => Boolean(currentCustomer());
const labelById = () => new Map((state.db.labels || []).filter((label) => label.active !== false).map((label) => [label.id, label]));
const labelsForProduct = (product) => (product.labelIds || []).map((id) => labelById().get(id)).filter(Boolean);
const hasLabel = (product, terms) => labelsForProduct(product).some((label) => terms.some((term) => normalize(label.name).includes(term)));

const productsForAccount = () => state.db.products.filter((product) => product.available && product.forms.includes(state.formType));
const productById = (id) => state.db.products.find((product) => product.id === id);
const ordersForCustomer = () => {
  const customer = currentCustomer();
  if (!customer) return [];
  return (state.db.orders || [])
    .filter((order) => order.customerId === customer.id || normalize(order.customerEmail) === normalize(customer.email) || normalize(order.customerName) === normalize(customer.name))
    .sort((a, b) => new Date(b.submittedAt || b.orderDate || 0) - new Date(a.submittedAt || a.orderDate || 0));
};
const lastOrder = () => ordersForCustomer()[0];

const orderItemProduct = (item) => productById(item.productId) || productsForAccount().find((product) => product.sku === item.sku || normalize(product.name) === normalize(item.name));
const lastOrderLines = () => (lastOrder()?.items || []).map((item) => ({ product: orderItemProduct(item), qty: item.qty || item.quantity || 1 })).filter((line) => line.product?.available && line.product.forms.includes(state.formType));

const frequentProducts = () => {
  const counts = new Map();
  ordersForCustomer().forEach((order) => {
    (order.items || []).forEach((item) => {
      const product = orderItemProduct(item);
      if (product?.available && product.forms.includes(state.formType)) counts.set(product.id, (counts.get(product.id) || 0) + Number(item.qty || item.quantity || 1));
    });
  });
  const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => productById(id)).filter(Boolean);
  if (ordered.length) return ordered;
  return productsForAccount()
    .filter((product) => normalize(`${product.brand} ${product.name}`).includes("nanak") || ["Paneer", "Spices", "Frozen Breads", "Sweets"].includes(product.subCategory))
    .slice(0, 12);
};

const dealProducts = () => productsForAccount().filter((product) => hasLabel(product, ["sale", "short", "deal"]) || product.price > 0 && product.price < 15).slice(0, 24);
const newProducts = () => productsForAccount().filter((product) => product.isNew || hasLabel(product, ["new"])).slice(0, 24);

const recommendedProducts = () => {
  const cartBrands = new Set(cartItems().map((line) => line.product.brand));
  const cartSubs = new Set(cartItems().map((line) => line.product.subCategory));
  const inCart = new Set(Object.keys(state.cart));
  const base = productsForAccount().filter((product) => !inCart.has(product.id));
  const scored = base.map((product) => {
    let score = 0;
    if (cartBrands.has(product.brand)) score += 4;
    if (cartSubs.has(product.subCategory)) score += 3;
    if (normalize(product.brand).includes("nanak")) score += 2;
    if (hasLabel(product, ["sale", "short", "new"])) score += 3;
    if (["Paneer", "Spices", "Frozen Breads", "Sweets", "Momo's"].includes(product.subCategory)) score += 1;
    return { product, score };
  });
  return scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name)).slice(0, 8).map((item) => item.product);
};

const missedProducts = () => {
  const inCart = new Set(Object.keys(state.cart));
  return lastOrderLines().filter((line) => !inCart.has(line.product.id)).map((line) => line.product).slice(0, 8);
};

const productsForView = () => {
  switch (state.orderView) {
    case "reorder": {
      const last = lastOrderLines().map((line) => line.product);
      return last.length ? last : frequentProducts();
    }
    case "deals":
      return dealProducts();
    case "new":
      return newProducts();
    case "frozen":
      return productsForAccount().filter((product) => product.productCategory === "Frozen");
    case "cooler":
      return productsForAccount().filter((product) => product.productCategory === "Cooler");
    case "dry":
      return productsForAccount().filter((product) => product.productCategory === "Dry");
    case "brands":
    case "all":
    default:
      return productsForAccount();
  }
};

const visibleProducts = () => {
  const query = normalize(elements.search.value);
  const category = elements.category.value;
  const brand = elements.brand.value;
  const inLastOrder = new Set(lastOrderLines().map((line) => line.product.id));
  return productsForView()
    .filter((product) => {
      const matchesCategory = category === "All" || product.category === category || product.productCategory === category || product.subCategory === category;
      const matchesBrand = brand === "All" || product.brand === brand;
      const haystack = normalize(`${product.name} ${product.brand} ${product.sku} ${product.category} ${product.productCategory} ${product.subCategory} ${product.description} ${product.tagText}`);
      return matchesCategory && matchesBrand && (!query || haystack.includes(query));
    })
    .sort((a, b) => {
      const score = (product) => (state.cart[product.id] ? 10 : 0) + (inLastOrder.has(product.id) ? 6 : 0) + (hasLabel(product, ["sale", "short"]) ? 4 : 0) + (normalize(product.brand).includes("nanak") ? 2 : 0);
      return score(b) - score(a) || a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name);
    });
};

const cartItems = () =>
  Object.entries(state.cart)
    .map(([id, qty]) => ({ product: productById(id), qty }))
    .filter((line) => line.product);

const addProduct = (id, qty = 1) => {
  const product = productById(id);
  if (!product?.available) return;
  state.cart[id] = (state.cart[id] || 0) + qty;
};

const setQty = (id, qty) => {
  const safeQty = Math.max(0, Number.parseInt(qty, 10) || 0);
  if (safeQty === 0) delete state.cart[id];
  else state.cart[id] = safeQty;
  saveDraft();
  renderCart();
  renderProducts();
  renderRevenueSections();
};

const addSetToCart = (setName) => {
  const sources = {
    last: lastOrderLines(),
    frequent: frequentProducts().slice(0, 8).map((product) => ({ product, qty: 1 })),
    deals: dealProducts().slice(0, 6).map((product) => ({ product, qty: 1 })),
    recommended: recommendedProducts().slice(0, 6).map((product) => ({ product, qty: 1 }))
  };
  (sources[setName] || []).forEach((line) => addProduct(line.product.id, Number(line.qty) || 1));
  saveDraft();
  elements.status.textContent = "Items added to your order.";
  renderAll();
};

const renderSession = () => {
  const authenticated = isAuthenticated();
  elements.loginShell.classList.toggle("is-hidden", authenticated);
  elements.orderShell.classList.toggle("is-locked", !authenticated);
  elements.mobileCartBar.classList.toggle("is-hidden", !authenticated);
  elements.portalLoginLink?.classList.toggle("is-hidden", authenticated);
  elements.accountToggle?.classList.toggle("is-hidden", !authenticated);
  if (!authenticated) {
    state.cart = {};
    state.customerId = "";
    sessionStorage.removeItem(SESSION_KEY);
    elements.accountDropdown?.classList.add("is-hidden");
  }
};

const renderHeaderAccount = () => {
  const customer = currentCustomer();
  if (!customer || !elements.accountToggle) return;
  const words = String(customer.name || "Delta Food").split(/\s+/).filter(Boolean);
  elements.accountInitials.textContent = words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  elements.accountName.textContent = customer.name;
  elements.accountMenuSummary.innerHTML = `
    <strong>${customer.name}</strong>
    <span>${customer.email}</span>
    <span>${customer.cadence === "twice-weekly" ? "Twice weekly" : "Weekly"}: ${customer.orderDays.join(" / ")}</span>
    <span>Cutoff ${customer.cutoff}</span>
  `;
  elements.accountSettingsPanel.innerHTML = `
    <span><b>Company type</b>${customer.companyType || "Wholesale account"}</span>
    <span><b>Allowed forms</b>${customer.allowedForms.join(", ")}</span>
    <span><b>Sales contact</b>${customer.salesPerson || "Delta Sales"}</span>
    <span><b>Phone</b>${customer.mainPhone || "Office: +1 469.473.6655"}</span>
  `;
};

const renderAccount = () => {
  const customer = currentCustomer();
  if (!customer) return;
  elements.accountCard.innerHTML = `
    <strong>${customer.name}</strong>
    <span>${customer.city}</span>
    <span>${customer.email}</span>
    <span>${customer.cadence === "twice-weekly" ? "Twice weekly" : "Weekly"}: ${customer.orderDays.join(" / ")}</span>
    <span>Cutoff: ${customer.cutoff}</span>
  `;
  elements.orderDeadline.innerHTML = `<span>Order window</span><strong>${customer.orderDays.join(" / ")}</strong><small>Cutoff ${customer.cutoff}</small>`;
  renderHeaderAccount();
};

const renderFormTabs = () => {
  const customer = currentCustomer();
  if (!customer) return;
  const labels = { store: "Store order", restaurant: "Restaurant order" };
  state.formType = customer.allowedForms.includes(state.formType) ? state.formType : customer.allowedForms[0];
  elements.formTabs.innerHTML = ["store", "restaurant"]
    .map((type) => {
      const allowed = customer.allowedForms.includes(type);
      return `<button type="button" class="${state.formType === type ? "is-active" : ""}" data-form-type="${type}" ${allowed ? "" : "disabled"}>${labels[type]}</button>`;
    })
    .join("");
};

const renderCategories = () => {
  const selected = elements.category.value || "All";
  const categories = ["All", "Frozen", "Cooler", "Dry", ...new Set(productsForAccount().map((product) => product.subCategory).filter(Boolean).sort())];
  elements.category.innerHTML = categories.map((category) => `<option value="${category}">${category}</option>`).join("");
  elements.category.value = categories.includes(selected) ? selected : "All";
};

const renderBrands = () => {
  const selected = elements.brand.value || "All";
  const brands = ["All", ...new Set(productsForAccount().map((product) => product.brand).sort())];
  elements.brand.innerHTML = brands.map((brand) => `<option value="${brand}">${brand}</option>`).join("");
  elements.brand.value = brands.includes(selected) ? selected : "All";
};

const renderRevenueSections = () => {
  const lastLines = lastOrderLines();
  const frequent = frequentProducts();
  const deals = dealProducts();
  const recommended = recommendedProducts();
  const casesInLastOrder = lastLines.reduce((sum, line) => sum + line.qty, 0);
  elements.reorderGrid.innerHTML = `
    <article class="reorder-card primary-card">
      <span>Fastest path</span>
      <h3>Reorder last order</h3>
      <p>${lastLines.length ? `${lastLines.length} items and ${casesInLastOrder} cases from your last submitted order.` : "No previous order yet. Start with frequent Delta sellers."}</p>
      <button class="button primary" type="button" data-add-set="${lastLines.length ? "last" : "frequent"}">${lastLines.length ? "Add last order" : "Add frequent items"}</button>
    </article>
    <article class="reorder-card">
      <span>Repeat staples</span>
      <h3>Frequently ordered</h3>
      <p>${frequent.length} account staples and high-volume wholesale items.</p>
      <button class="button secondary" type="button" data-add-set="frequent">Add staples</button>
    </article>
    <article class="reorder-card">
      <span>Grow the order</span>
      <h3>Deals and short date</h3>
      <p>${deals.length || "No"} tagged deal items available for this account.</p>
      <button class="button secondary" type="button" data-add-set="deals">Add deals</button>
    </article>
  `;
  elements.upsellStrip.innerHTML = recommended.slice(0, 4).map((product) => `<button type="button" data-add-suggestion="${product.id}"><span>${product.brand}</span><strong>${product.name}</strong><small>${product.pack} | ${currency.format(product.price)}</small></button>`).join("");
  elements.merchNav.querySelectorAll("[data-order-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.orderView === state.orderView);
  });
};

const productLabelsHtml = (product) => {
  const labels = labelsForProduct(product)
    .map((label) => `<span class="product-label" style="--label-color:${label.color}">${label.name}</span>`)
    .join("");
  const synthetic = [
    state.orderView === "reorder" && lastOrderLines().some((line) => line.product.id === product.id) ? `<span class="product-label system-label">Last ordered</span>` : "",
    product.isNew ? `<span class="product-label system-label">New</span>` : ""
  ].join("");
  return labels || synthetic ? `<div class="product-labels">${synthetic}${labels}</div>` : "";
};

const productRow = (product) => {
  const qty = state.cart[product.id] || 0;
  return `
    <article class="order-product revenue-product ${qty ? "is-in-cart" : ""}">
      <div>
        <span>${product.brand} | ${product.sku}</span>
        <h3>${product.name}</h3>
        <p>${product.productCategory} | ${product.subCategory} | ${product.pack}</p>
        ${productLabelsHtml(product)}
      </div>
      <strong>${currency.format(product.price)}</strong>
      <div class="qty-stepper">
        <button type="button" data-qty-minus="${product.id}" aria-label="Decrease ${product.name}">-</button>
        <input type="number" min="0" value="${qty}" data-qty-input="${product.id}" aria-label="${product.name} cases" />
        <button type="button" data-qty-plus="${product.id}" aria-label="Increase ${product.name}">+</button>
      </div>
    </article>
  `;
};

const renderProducts = () => {
  if (!isAuthenticated()) return;
  const products = visibleProducts();
  const groupByBrand = elements.display.value === "brand" || state.orderView === "brands";
  if (groupByBrand && products.length) {
    const groups = new Map();
    products.forEach((product) => {
      if (!groups.has(product.brand)) groups.set(product.brand, []);
      groups.get(product.brand).push(product);
    });
    elements.productList.innerHTML = [...groups.entries()]
      .map(([brand, group]) => `<section class="brand-order-group revenue-brand-group"><h2>${brand}<span>${group.length} items</span></h2>${group.map(productRow).join("")}</section>`)
      .join("");
    return;
  }
  elements.productList.innerHTML = products.length ? products.map(productRow).join("") : `<div class="empty-state">No approved products match this view.</div>`;
};

const renderCartSuggestions = () => {
  const missed = missedProducts();
  const recs = recommendedProducts();
  const suggestions = [...missed, ...recs].filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index).slice(0, 5);
  elements.cartSuggestions.innerHTML = suggestions.length
    ? `<h3>Before checkout</h3>${suggestions.map((product) => `<button type="button" data-add-suggestion="${product.id}"><span>${missed.some((item) => item.id === product.id) ? "Ordered last time" : "Recommended"}</span><strong>${product.name}</strong><small>${product.brand} | ${product.pack}</small></button>`).join("")}`
    : "";
};

const renderCart = () => {
  const items = cartItems();
  const totalCases = items.reduce((sum, line) => sum + line.qty, 0);
  const totalPrice = items.reduce((sum, line) => sum + line.qty * line.product.price, 0);
  elements.cartCount.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
  elements.totalCases.textContent = String(totalCases);
  elements.totalPrice.textContent = currency.format(totalPrice);
  elements.mobileCartCount.textContent = `${totalCases} case${totalCases === 1 ? "" : "s"}`;
  elements.mobileCartTotal.textContent = currency.format(totalPrice);
  elements.cartLines.innerHTML = items.length
    ? items.map((line) => `<div class="cart-line"><div><strong>${line.product.name}</strong><span>${line.product.pack}</span></div><span>${line.qty} x ${currency.format(line.product.price)}</span></div>`).join("")
    : `<div class="empty-state compact">No cases added.</div>`;
  renderCartSuggestions();
};

const renderAll = () => {
  renderSession();
  if (!isAuthenticated()) return;
  renderHeaderAccount();
  renderAccount();
  renderFormTabs();
  renderCategories();
  renderBrands();
  renderRevenueSections();
  renderProducts();
  renderCart();
};

const login = (email, accessCode) => {
  state.db = loadDb();
  const customer = state.db.customers.find((item) => normalize(item.email) === normalize(email) && String(item.accessCode || "").trim() === String(accessCode || "").trim());
  if (!customer) return "No matching customer access was found.";
  if (!customer.active) return "This customer access is inactive. Contact Delta sales.";
  state.customerId = customer.id;
  state.formType = customer.allowedForms[0] || "store";
  state.orderView = "reorder";
  sessionStorage.setItem(SESSION_KEY, customer.id);
  elements.loginStatus.textContent = "";
  elements.loginForm.reset();
  renderAll();
  return "";
};

const logout = () => {
  state.customerId = "";
  state.cart = {};
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(DRAFT_KEY);
  renderAll();
};

const submitOrder = () => {
  const items = cartItems();
  const customer = currentCustomer();
  if (!items.length || !customer) {
    elements.status.textContent = "Add at least one case before submitting.";
    return;
  }
  saveDraft();
  window.location.href = "checkout.html";
};

renderAll();

elements.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(elements.loginForm);
  const error = login(formData.get("email"), formData.get("accessCode"));
  elements.loginStatus.textContent = error;
});

elements.showReset.addEventListener("click", () => {
  elements.loginForm.classList.add("is-hidden");
  elements.resetForm.classList.remove("is-hidden");
  elements.loginStatus.textContent = "";
});

elements.showLogin.addEventListener("click", () => {
  elements.resetForm.classList.add("is-hidden");
  elements.loginForm.classList.remove("is-hidden");
  elements.resetStatus.textContent = "";
});

elements.resetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(elements.resetForm);
  const email = String(formData.get("email") || "").trim();
  const exists = state.db.customers.some((customer) => normalize(customer.email) === normalize(email));
  elements.resetStatus.textContent = exists
    ? "Reset request received. Delta sales will verify the account and follow up."
    : "If this email belongs to an approved account, Delta sales will follow up.";
  elements.resetForm.reset();
});

elements.logoutButtons.forEach((button) => button.addEventListener("click", logout));
elements.accountToggle?.addEventListener("click", () => {
  const isOpen = !elements.accountDropdown.classList.contains("is-hidden");
  elements.accountDropdown.classList.toggle("is-hidden", isOpen);
  elements.accountToggle.setAttribute("aria-expanded", String(!isOpen));
});
elements.accountSettingsToggle?.addEventListener("click", () => {
  elements.accountSettingsPanel.classList.toggle("is-hidden");
});

elements.formTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-form-type]");
  if (!button || button.disabled) return;
  state.formType = button.dataset.formType;
  state.cart = {};
  state.orderView = "reorder";
  elements.search.value = "";
  renderAll();
});

elements.merchNav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order-view]");
  if (!button) return;
  state.orderView = button.dataset.orderView;
  elements.search.value = "";
  elements.category.value = "All";
  elements.brand.value = "All";
  renderAll();
});

elements.reorderGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-set]");
  if (button) addSetToCart(button.dataset.addSet);
});

elements.upsellStrip.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-suggestion]");
  if (!button) return;
  addProduct(button.dataset.addSuggestion, 1);
  saveDraft();
  renderAll();
});

elements.cartSuggestions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-suggestion]");
  if (!button) return;
  addProduct(button.dataset.addSuggestion, 1);
  saveDraft();
  renderAll();
});

elements.search.addEventListener("input", renderProducts);
elements.category.addEventListener("change", renderProducts);
elements.brand.addEventListener("change", renderProducts);
elements.display.addEventListener("change", renderProducts);

elements.productList.addEventListener("click", (event) => {
  const minus = event.target.closest("[data-qty-minus]");
  const plus = event.target.closest("[data-qty-plus]");
  if (minus) setQty(minus.dataset.qtyMinus, (state.cart[minus.dataset.qtyMinus] || 0) - 1);
  if (plus) setQty(plus.dataset.qtyPlus, (state.cart[plus.dataset.qtyPlus] || 0) + 1);
});

elements.productList.addEventListener("input", (event) => {
  const input = event.target.closest("[data-qty-input]");
  if (input) setQty(input.dataset.qtyInput, input.value);
});

elements.clearCart.addEventListener("click", () => {
  state.cart = {};
  sessionStorage.removeItem(DRAFT_KEY);
  elements.status.textContent = "";
  renderAll();
});

elements.submit.addEventListener("click", submitOrder);
elements.mobileSubmit.addEventListener("click", submitOrder);
