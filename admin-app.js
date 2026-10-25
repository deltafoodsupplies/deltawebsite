const STORAGE_KEY = "deltaOrderPortal";
const ADMIN_SESSION_KEY = "deltaAdminSession";
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const cloneSeed = () => JSON.parse(JSON.stringify(window.DeltaOrderSeed || {}));
const slugify = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const normalize = (value) => String(value || "").trim().toLowerCase();
const todayIso = () => new Date().toISOString().slice(0, 10);
const displayDate = (value) => value ? new Intl.DateTimeFormat("en-US").format(new Date(value)) : "";
const ORDER_STATUSES = ["Order Received", "Order Entered", "Order Shipped"];

const normalizeOrderStatus = (status) => {
  const value = normalize(status);
  if (["open", "new", "received", "order received"].includes(value)) return "Order Received";
  if (["processing", "entered", "order entered"].includes(value)) return "Order Entered";
  if (["shipped", "order shipped"].includes(value)) return "Order Shipped";
  return ORDER_STATUSES.includes(status) ? status : "Order Received";
};

const categoryForProduct = (product) => {
  const text = `${product.productCategory || ""} ${product.category || ""} ${product.name || ""}`.toLowerCase();
  if (text.includes("frozen") || text.includes("frz") || text.includes("samosa") || text.includes("momo")) return "Frozen";
  if (text.includes("dairy") || text.includes("paneer") || text.includes("yogurt") || text.includes("lassi") || text.includes("cooler")) return "Cooler";
  return "Dry";
};

const subCategoryForProduct = (product) => {
  if (product.subCategory) return product.subCategory;
  const text = `${product.category || ""} ${product.name || ""}`.toLowerCase();
  if (text.includes("momo")) return "Momo's";
  if (text.includes("paneer")) return "Paneer";
  if (text.includes("sweet") || text.includes("rasmalai") || text.includes("burfi") || text.includes("ladoo")) return "Sweets";
  if (text.includes("spice") || text.includes("masala")) return "Spices";
  if (text.includes("tea") || text.includes("drink") || text.includes("syrup")) return "Beverages";
  if (text.includes("bread") || text.includes("naan") || text.includes("parotta")) return "Frozen Breads";
  if (text.includes("vegetable") || text.includes("okra")) return "Frozen Vegetables";
  return product.category || "General";
};

const defaultSubCategories = () => [
  { id: "momos", name: "Momo's", category: "Frozen", active: true },
  { id: "samosa", name: "Samosa", category: "Frozen", active: true },
  { id: "frozen-breads", name: "Frozen Breads", category: "Frozen", active: true },
  { id: "frozen-vegetables", name: "Frozen Vegetables", category: "Frozen", active: true },
  { id: "paneer", name: "Paneer", category: "Cooler", active: true },
  { id: "dairy", name: "Dairy", category: "Cooler", active: true },
  { id: "sweets", name: "Sweets", category: "Cooler", active: true },
  { id: "spices", name: "Spices", category: "Dry", active: true },
  { id: "beverages", name: "Beverages", category: "Dry", active: true },
  { id: "sauces", name: "Sauces", category: "Dry", active: true },
  { id: "general", name: "General", category: "Dry", active: true }
];

const fullSeed = () => {
  const seed = cloneSeed();
  const imported = JSON.parse(JSON.stringify(window.DeltaPdfProducts || []));
  const byId = new Map((seed.products || []).map((product) => [product.id, product]));
  imported.forEach((product) => {
    if (!byId.has(product.id)) byId.set(product.id, product);
  });
  seed.products = [...byId.values()];
  seed.labels ||= [];
  seed.users ||= [];
  seed.customers ||= [];
  seed.orders ||= [];
  return seed;
};

const normalizeProduct = (product) => {
  const productCategory = categoryForProduct(product);
  const subCategory = subCategoryForProduct(product);
  const outOfStock = Boolean(product.outOfStock);
  const hide = Boolean(product.hide || product.available === false);
  const active = typeof product.active === "boolean" ? product.active : product.available !== false;
  return {
    ...product,
    id: product.id || `${slugify(product.brand)}-${slugify(product.name)}-${Date.now()}`,
    sku: product.sku || product.code || product.id || "",
    brand: product.brand || "Unassigned",
    category: product.category || productCategory,
    productCategory,
    subCategory,
    pack: product.pack || product.caseSize || "",
    price: Number(product.price || 0),
    description: product.description || "",
    tagText: product.tagText || "",
    forms: product.forms?.length ? product.forms : ["store", "restaurant"],
    labelIds: product.labelIds || [],
    outOfStock,
    isNew: Boolean(product.isNew),
    hide,
    active,
    available: active && !hide && !outOfStock
  };
};

const normalizeLabel = (label) => ({
  id: label.id || slugify(label.name),
  name: label.name || "Label",
  color: label.color || "#0f8a4b",
  territory: label.territory || "All",
  startDate: label.startDate || "",
  endDate: label.endDate || "",
  active: typeof label.active === "boolean" ? label.active : true
});

const sampleOrder = (customer, products) => ({
  id: "5000",
  customerId: customer?.id || "patel-grocery",
  customerName: customer?.name || "Patel Grocery",
  customerEmail: customer?.email || "buyer@patelgrocery.com",
  companyName: customer?.name || "Patel Grocery",
  territory: `DFS_${customer?.state || "TX"}`,
  salesPerson: customer?.salesPerson || "Delta Sales",
  status: "Order Received",
  formType: "store",
  fulfillment: "Delivery",
  orderDate: todayIso(),
  shipDate: "",
  submittedAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  items: products.slice(0, 5).map((product, index) => ({
    productId: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.productCategory || product.category,
    subCategory: product.subCategory || product.category,
    pack: product.pack,
    price: product.price,
    qty: index === 0 ? 2 : 1
  })),
  notes: ""
});

const deriveBrands = (products) => {
  const byName = new Map();
  products.forEach((product) => {
    const name = product.brand || "Unassigned";
    if (!byName.has(name)) {
      byName.set(name, {
        id: slugify(name),
        code: slugify(name).slice(0, 12).toUpperCase(),
        name,
        subCategory: product.subCategory || "General",
        territories: ["TX", "NM", "OK", "AR", "LA"]
      });
    }
  });
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
};

const withDefaults = (db) => {
  const seed = fullSeed();
  const productMap = new Map((db.products || []).map((product) => [product.id, normalizeProduct(product)]));
  seed.products.forEach((product) => {
    if (!productMap.has(product.id)) productMap.set(product.id, normalizeProduct(product));
  });
  db.products = [...productMap.values()].map(normalizeProduct);

  const subMap = new Map((db.subCategories || []).map((item) => [item.id, item]));
  defaultSubCategories().forEach((item) => {
    if (!subMap.has(item.id)) subMap.set(item.id, item);
  });
  [...new Set(db.products.map((product) => product.subCategory).filter(Boolean))].forEach((name) => {
    const id = slugify(name);
    if (!subMap.has(id)) subMap.set(id, { id, name, category: db.products.find((product) => product.subCategory === name)?.productCategory || "Dry", active: true });
  });
  db.subCategories = [...subMap.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const labelMap = new Map((db.labels || db.tags || []).map((label) => [label.id, normalizeLabel(label)]));
  seed.labels.forEach((label) => {
    if (!labelMap.has(label.id)) labelMap.set(label.id, normalizeLabel(label));
  });
  db.labels = [...labelMap.values()];
  db.tags = db.labels;

  const brandSeed = deriveBrands(db.products);
  const brandMap = new Map((db.brands || []).map((brand) => [brand.id, { ...brand, territories: brand.territories || ["TX"] }]));
  brandSeed.forEach((brand) => {
    if (!brandMap.has(brand.id)) brandMap.set(brand.id, brand);
  });
  db.brands = [...brandMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const userMap = new Map((db.users || []).map((user) => [user.id, user]));
  seed.users.forEach((user) => {
    if (!userMap.has(user.id)) userMap.set(user.id, user);
  });
  db.users = [...userMap.values()].map((user) => ({
    ...user,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    role: user.role || "Sales",
    accessCode: user.accessCode || "",
    active: typeof user.active === "boolean" ? user.active : true,
    emailConfirmed: typeof user.emailConfirmed === "boolean" ? user.emailConfirmed : false
  }));

  const seedCustomers = seed.customers || [];
  const customerMap = new Map((db.customers || []).map((customer) => [customer.id, customer]));
  seedCustomers.forEach((customer) => {
    if (!customerMap.has(customer.id)) customerMap.set(customer.id, customer);
  });
  db.customers = [...customerMap.values()].map((customer) => {
    const fallback = seedCustomers.find((item) => item.id === customer.id) || {};
    const contactParts = String(customer.contact || "").split(" ");
    return {
      ...customer,
      prefix: customer.prefix || fallback.prefix || "",
      firstName: customer.firstName || fallback.firstName || contactParts[0] || "",
      lastName: customer.lastName || fallback.lastName || contactParts.slice(1).join(" "),
      mainPhone: customer.mainPhone || fallback.mainPhone || "",
      altPhone: customer.altPhone || fallback.altPhone || "",
      email: customer.email || fallback.email || "",
      secondEmail: customer.secondEmail || fallback.secondEmail || "",
      thirdEmail: customer.thirdEmail || fallback.thirdEmail || "",
      accessCode: customer.accessCode || fallback.accessCode || "",
      companyType: customer.companyType || fallback.companyType || "Retailer",
      shippingAddress1: customer.shippingAddress1 || fallback.shippingAddress1 || "",
      shippingAddress2: customer.shippingAddress2 || fallback.shippingAddress2 || "",
      city: customer.city || fallback.city || "",
      state: customer.state || fallback.state || "TX",
      zip: customer.zip || fallback.zip || "",
      salesPerson: customer.salesPerson || fallback.salesPerson || "Delta Sales",
      active: typeof customer.active === "boolean" ? customer.active : true,
      allowedForms: customer.allowedForms?.length ? customer.allowedForms : ["store"],
      orderDays: customer.orderDays?.length ? customer.orderDays : ["Monday"],
      repeatEvery: customer.repeatEvery || fallback.repeatEvery || 1,
      repeatUnit: customer.repeatUnit || fallback.repeatUnit || "Week",
      startDate: customer.startDate || fallback.startDate || "",
      cutoff: customer.cutoff || fallback.cutoff || "10:00 AM",
      cadence: customer.cadence || fallback.cadence || "weekly"
    };
  });

  db.orders = (db.orders || []).map((order) => ({
    ...order,
    status: normalizeOrderStatus(order.status),
    orderDate: order.orderDate || todayIso(),
    modifiedAt: order.modifiedAt || order.submittedAt || new Date().toISOString()
  }));
  if (!db.orders.length && db.customers.length && db.products.length) db.orders = [sampleOrder(db.customers[0], db.products)];
  return db;
};

const loadDb = () => withDefaults(JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(fullSeed())));
const saveDb = (nextDb) => localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDb));
let db = loadDb();
let activeAssignLabelId = "";
let activeAssignProductId = "";
let activeOrderId = db.orders[0]?.id || "";
saveDb(db);

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const adminLoginShell = $("[data-admin-login-shell]");
const adminLoginForm = $("[data-admin-login-form]");
const adminResetForm = $("[data-admin-reset-form]");
const adminLoginStatus = $("[data-admin-login-status]");
const adminResetStatus = $("[data-admin-reset-status]");
const adminShowReset = $("[data-admin-show-reset]");
const adminShowLogin = $("[data-admin-show-login]");
const adminShell = $("[data-admin-shell]");
const adminLogout = $("[data-admin-logout]");
const adminSessionLabel = $("[data-admin-session-label]");
const views = $$("[data-admin-view]");
const tabs = $$("[data-admin-tab]");
const userForm = $("[data-user-form]");
const productForm = $("[data-product-form]");
const customerForm = $("[data-customer-access-form]");
const labelForm = $("[data-label-form]");
const subCategoryForm = $("[data-subcategory-form]");
const brandForm = $("[data-brand-form]");
const userBody = $("[data-admin-users]");
const productBody = $("[data-admin-products]");
const customerBody = $("[data-admin-customers]");
const orderBody = $("[data-admin-orders]");
const labelBody = $("[data-admin-labels]");
const subCategoryBody = $("[data-admin-subcategories]");
const brandBody = $("[data-admin-brands]");
const productLabelBox = $("[data-product-labels]");
const salesPersonSelect = $("[data-salesperson-options]");
const orderCount = $("[data-order-count]");
const orderDetail = $("[data-order-detail]");
const assignModal = $("[data-tag-assign-modal]");
const assignTree = $("[data-tag-assign-tree]");

const formValues = (form) => new FormData(form);
const optionHtml = (items, selected = "") => items.map((item) => `<option value="${item}"${item === selected ? " selected" : ""}>${item}</option>`).join("");
const selectedOrderDays = (form) => [...form.querySelectorAll('input[name="orderDays"]:checked')].map((input) => input.value);
const currentStaff = () => db.users.find((user) => normalize(user.email) === normalize(sessionStorage.getItem(ADMIN_SESSION_KEY)) && user.active);
const isAdminAuthenticated = () => Boolean(currentStaff());

const setActiveView = (name) => {
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.adminTab === name));
  views.forEach((view) => view.classList.toggle("is-active", view.dataset.adminView === name));
};

const renderAdminSession = () => {
  const staff = currentStaff();
  adminLoginShell.classList.toggle("is-hidden", Boolean(staff));
  adminShell.classList.toggle("is-locked", !staff);
  if (staff) adminSessionLabel.textContent = `Signed in as ${staff.firstName} ${staff.lastName}`;
};

const renderSalesPeople = () => {
  const current = salesPersonSelect.value;
  const names = db.users.filter((user) => user.active).map((user) => `${user.firstName} ${user.lastName}`.trim()).filter(Boolean);
  salesPersonSelect.innerHTML = optionHtml(names);
  if (names.includes(current)) salesPersonSelect.value = current;
};

const renderOptionLists = () => {
  const brands = db.brands.map((brand) => brand.name);
  const subCategories = db.subCategories.filter((item) => item.active).map((item) => item.name);
  $$("[data-product-brand-options]").forEach((select) => {
    const current = select.value;
    select.innerHTML = optionHtml(brands, current);
  });
  $$("[data-product-subcategory-options], [data-brand-subcategory-options]").forEach((select) => {
    const current = select.value;
    select.innerHTML = optionHtml(subCategories, current);
  });
  const brandFilter = $('[data-product-filter="brand"]');
  const subFilter = $('[data-product-filter="subCategory"]');
  if (brandFilter) brandFilter.innerHTML = `<option value="">All</option>${optionHtml(brands, brandFilter.value)}`;
  if (subFilter) subFilter.innerHTML = `<option value="">All</option>${optionHtml(subCategories, subFilter.value)}`;
};

const renderUsers = () => {
  userBody.innerHTML = db.users.map((user, index) => `<tr><td>${index + 1}</td><td><strong>${user.firstName} ${user.lastName}</strong><span>${user.phone || "No phone"}</span></td><td>${user.email}</td><td>${user.role}</td><td><span class="status-text ${user.active ? "is-good" : "is-muted"}">${user.active ? "Active" : "Inactive"}</span></td><td><span class="status-text ${user.emailConfirmed ? "is-good" : "is-muted"}">${user.emailConfirmed ? "Confirmed" : "Pending"}</span></td><td><button class="button mini" type="button" data-edit-user="${user.id}">Edit</button></td></tr>`).join("");
};

const renderCustomers = () => {
  customerBody.innerHTML = db.customers.map((customer) => `<tr><td><strong>${customer.name}</strong><span>${customer.companyType}</span></td><td>${customer.firstName || ""}</td><td>${customer.lastName || ""}</td><td>${customer.email}</td><td>${customer.state || ""}</td><td>${customer.mainPhone || ""}</td><td><span class="status-text ${customer.active ? "is-good" : "is-muted"}">${customer.active ? "Active" : "Inactive"}</span></td><td><button class="button mini" type="button" data-edit-customer="${customer.id}">Edit</button></td></tr>`).join("");
};

const renderSubCategories = () => {
  const search = normalize($("[data-subcategory-search]")?.value || "");
  subCategoryBody.innerHTML = db.subCategories
    .filter((item) => !search || normalize(`${item.name} ${item.category}`).includes(search))
    .map((item) => `<tr><td><strong>${item.name}</strong></td><td>${item.category}</td><td><span class="status-text ${item.active ? "is-good" : "is-muted"}">${item.active ? "Active" : "Inactive"}</span></td><td><button class="button mini" type="button" data-edit-subcategory="${item.id}">Edit</button></td></tr>`)
    .join("");
};

const renderBrands = () => {
  const search = normalize($("[data-brand-search]")?.value || "");
  brandBody.innerHTML = db.brands
    .filter((brand) => !search || normalize(`${brand.name} ${brand.subCategory} ${brand.territories?.join(" ")}`).includes(search))
    .map((brand) => `<tr><td><strong>${brand.name}</strong><span>${brand.code || ""}</span></td><td>${brand.subCategory || "General"}</td><td>${(brand.territories || []).join(", ")}</td><td><div class="table-actions"><button class="button mini" type="button" data-edit-brand="${brand.id}">Edit</button><button class="button mini danger" type="button" data-delete-brand="${brand.id}">Delete</button></div></td></tr>`)
    .join("");
};

const productMatchesFilters = (product) => {
  const filters = Object.fromEntries($$("[data-product-filter]").map((input) => [input.dataset.productFilter, input.value]));
  const global = normalize($("[data-product-global-search]")?.value || "");
  const haystack = normalize(`${product.sku} ${product.name} ${product.brand} ${product.pack} ${product.productCategory} ${product.subCategory} ${product.description} ${product.tagText}`);
  if (global && !haystack.includes(global)) return false;
  if (filters.sku && !normalize(product.sku).includes(normalize(filters.sku))) return false;
  if (filters.name && !normalize(product.name).includes(normalize(filters.name))) return false;
  if (filters.brand && product.brand !== filters.brand) return false;
  if (filters.productCategory && product.productCategory !== filters.productCategory) return false;
  if (filters.subCategory && product.subCategory !== filters.subCategory) return false;
  if (filters.visibility === "visible" && (product.hide || !product.available)) return false;
  if (filters.visibility === "hidden" && !product.hide && product.available) return false;
  if (filters.active === "active" && !product.active) return false;
  if (filters.active === "inactive" && product.active) return false;
  return true;
};

const renderProducts = () => {
  const labelById = new Map((db.labels || []).map((label) => [label.id, label]));
  productLabelBox.innerHTML = (db.labels || []).map((label) => `<label><input name="labelIds" type="checkbox" value="${label.id}" /> <span class="product-label" style="--label-color:${label.color}">${label.name}</span></label>`).join("");
  const rows = db.products.filter(productMatchesFilters).slice(0, 250);
  productBody.innerHTML = rows.map((product) => {
    const visibility = product.hide || !product.available ? "Hidden" : "Yes";
    return `<tr><td><strong>${product.sku}</strong></td><td><strong>${product.name}</strong><span>${(product.labelIds || []).map((id) => labelById.get(id)).filter(Boolean).map((label) => `<span class="product-label" style="--label-color:${label.color}">${label.name}</span>`).join(" ")}</span></td><td>${product.brand}</td><td>${product.pack}</td><td>${product.productCategory}</td><td>${product.subCategory}</td><td><span class="status-text ${visibility === "Yes" ? "is-good" : "is-muted"}">${visibility}</span></td><td><span class="status-text ${product.active ? "is-good" : "is-muted"}">${product.active ? "Active" : "Inactive"}</span></td><td><div class="table-actions"><button class="button mini" type="button" data-edit-product="${product.id}">Edit</button><button class="button mini success" type="button" data-assign-product="${product.id}">Assign</button><button class="button mini danger" type="button" data-delete-product="${product.id}">Delete</button></div></td></tr>`;
  }).join("") || `<tr><td colspan="9">No matching products found.</td></tr>`;
};

const renderLabels = () => {
  const search = normalize($("[data-tag-search]")?.value || "");
  labelBody.innerHTML = (db.labels || [])
    .filter((label) => !search || normalize(`${label.name} ${label.color} ${label.territory}`).includes(search))
    .map((label) => `<tr><td><strong>${label.name}</strong><span>${label.territory || "All"}</span></td><td>${label.endDate ? displayDate(label.endDate) : "No expiration"}</td><td><span class="product-label" style="--label-color:${label.color}">${label.color}</span></td><td><span class="status-text ${label.active ? "is-good" : "is-muted"}">${label.active ? "Active" : "Inactive"}</span></td><td><div class="table-actions"><button class="button mini success" type="button" data-assign-label="${label.id}">Assign</button><button class="button mini" type="button" data-edit-label="${label.id}">Edit</button><button class="button mini danger" type="button" data-delete-label="${label.id}">Delete</button></div></td></tr>`)
    .join("");
};

const filteredOrders = () => {
  const status = $("[data-order-status-filter]")?.value || "All";
  const global = normalize($("[data-order-global-search]")?.value || "");
  return db.orders.filter((order) => {
    if (status !== "All" && order.status !== status) return false;
    if (!global) return true;
    return normalize(`${order.id} ${order.customerName} ${order.customerEmail} ${order.companyName} ${order.territory} ${order.salesPerson} ${order.status}`).includes(global);
  });
};

const orderItemKey = (item) => item.productId || item.sku || `${item.brand}-${item.name}-${item.pack}`;

const mergeOrderItems = (order) => {
  const merged = new Map();
  (order.items || []).forEach((item) => {
    const key = orderItemKey(item);
    if (!merged.has(key)) {
      merged.set(key, { ...item, qty: Number(item.qty || item.quantity || 0) });
      return;
    }
    const existing = merged.get(key);
    existing.qty += Number(item.qty || item.quantity || 0);
  });
  order.items = [...merged.values()].filter((item) => item.qty > 0);
};

const orderProductOptions = (group) => db.products
  .filter((product) => product.active !== false && product.available !== false && product.productCategory === group)
  .sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name))
  .slice(0, 300)
  .map((product) => `<option value="${product.id}">${product.brand} - ${product.name} (${product.pack})</option>`)
  .join("");

const renderOrderDetail = () => {
  const order = db.orders.find((item) => item.id === activeOrderId);
  if (!order) {
    orderDetail.innerHTML = "";
    return;
  }
  mergeOrderItems(order);
  const orderTotal = order.items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || item.casePrice || 0), 0);
  const groups = ["Cooler", "Frozen", "Dry"].map((group) => {
    const items = order.items.filter((item) => (item.category || item.productCategory || "Dry") === group);
    const rows = items.length
      ? items.map((item) => {
          const price = Number(item.price || item.casePrice || 0);
          const qty = Number(item.qty || 0);
          return `<tr><td>${item.sku}</td><td>${item.name}</td><td>${item.brand}</td><td>${item.subCategory}</td><td>${item.pack}</td><td>${currency.format(price)}</td><td><input class="qty-admin-input" data-order-item-qty="${orderItemKey(item)}" value="${item.qty}" type="number" min="0" /></td><td>${currency.format(price * qty)}</td></tr>`;
        }).join("")
      : `<tr><td colspan="8">No ${group.toLowerCase()} items in this order yet.</td></tr>`;
    return `<section class="order-detail-group"><h3>${group}</h3><table class="admin-table compact-table"><thead><tr><th>Product Code</th><th>Product Name</th><th>Brand Name</th><th>Sub Category</th><th>Case Size</th><th>Case Price</th><th>QTY</th><th>Line Total</th></tr></thead><tbody>${rows}</tbody></table><div class="order-add-row"><select data-order-product-picker="${group}">${orderProductOptions(group)}</select><input data-order-add-qty="${group}" type="number" min="1" value="1" aria-label="${group} item quantity" /><button class="button mini dark" type="button" data-add-order-item="${group}">Add Selected Item</button></div></section>`;
  }).join("");
  const statusButtons = ORDER_STATUSES.map((status) => `<button class="button mini ${order.status === status ? "primary" : "secondary"}" type="button" data-set-order-status="${status}">${status}</button>`).join("");
  orderDetail.innerHTML = `<div class="order-detail-head"><h2>Order #: ${order.id}</h2><div class="admin-actions"><strong class="order-detail-total">${currency.format(orderTotal)}</strong><label>Order Status:<select data-order-detail-status>${optionHtml(ORDER_STATUSES, order.status)}</select></label><button class="button secondary" type="button" data-print-order="${order.id}">Print PDF</button><button class="button primary" type="button" data-update-order="${order.id}">Update</button></div></div><div class="order-status-steps">${statusButtons}</div><div class="order-detail-meta"><label>Customer Name:<select><option>${order.customerName}</option></select></label><label>Order Date<input value="${order.orderDate || todayIso()}" type="date" /></label><p><strong>About Order:</strong> Placed on ${displayDate(order.submittedAt)} by ${order.customerName}<br />Last Modified on ${displayDate(order.modifiedAt)} by ${currentStaff()?.firstName || "Delta"} ${currentStaff()?.lastName || "Sales"}</p></div>${groups}`;
};

const renderOrders = () => {
  const orders = filteredOrders();
  orderCount.textContent = `${orders.length} orders found.`;
  orderBody.innerHTML = orders.map((order) => `<tr><td><button class="text-button" type="button" data-view-order="${order.id}">${order.id}</button></td><td>${order.customerName}</td><td>${order.customerEmail || ""}</td><td>${order.companyName || order.customerName}</td><td>${order.territory || "DFS_TX"}</td><td>${order.salesPerson || ""}</td><td>${order.status}</td><td>${order.orderDate || ""}</td><td>${order.shipDate || ""}</td><td><div class="table-actions"><button class="button mini success" type="button" data-view-order="${order.id}">View</button><button class="button mini secondary" type="button" data-print-order="${order.id}">Print PDF</button><button class="button mini" type="button" data-view-order="${order.id}">Edit</button></div></td></tr>`).join("") || `<tr><td colspan="10">No matching orders.</td></tr>`;
  renderOrderDetail();
};

const renderAll = () => {
  if (!isAdminAuthenticated()) return;
  renderSalesPeople();
  renderOptionLists();
  renderOrders();
  renderUsers();
  renderCustomers();
  renderSubCategories();
  renderBrands();
  renderProducts();
  renderLabels();
};

const loginAdmin = (email, accessCode) => {
  db = loadDb();
  const staff = db.users.find((user) => normalize(user.email) === normalize(email) && user.accessCode === String(accessCode || "").trim());
  if (!staff || !staff.active) {
    adminLoginStatus.textContent = "No matching active staff access was found.";
    return;
  }
  sessionStorage.setItem(ADMIN_SESSION_KEY, staff.email);
  adminLoginStatus.textContent = "";
  adminLoginForm.reset();
  renderAdminSession();
  renderAll();
};

const fillUserForm = (user) => {
  userForm.elements.id.value = user.id;
  userForm.elements.firstName.value = user.firstName;
  userForm.elements.lastName.value = user.lastName;
  userForm.elements.email.value = user.email;
  userForm.elements.phone.value = user.phone || "";
  userForm.elements.role.value = user.role;
  userForm.elements.accessCode.value = user.accessCode || "";
  userForm.elements.active.checked = user.active;
  userForm.elements.emailConfirmed.checked = user.emailConfirmed;
  userForm.elements.firstName.focus();
};

const fillCustomerForm = (customer) => {
  customerForm.elements.id.value = customer.id;
  customerForm.elements.name.value = customer.name;
  customerForm.elements.prefix.value = customer.prefix || "";
  customerForm.elements.firstName.value = customer.firstName || "";
  customerForm.elements.lastName.value = customer.lastName || "";
  customerForm.elements.mainPhone.value = customer.mainPhone || "";
  customerForm.elements.altPhone.value = customer.altPhone || "";
  customerForm.elements.email.value = customer.email || "";
  customerForm.elements.secondEmail.value = customer.secondEmail || "";
  customerForm.elements.thirdEmail.value = customer.thirdEmail || "";
  customerForm.elements.companyType.value = customer.companyType || "Retailer";
  customerForm.elements.shippingAddress1.value = customer.shippingAddress1 || "";
  customerForm.elements.shippingAddress2.value = customer.shippingAddress2 || "";
  customerForm.elements.city.value = customer.city || "";
  customerForm.elements.state.value = customer.state || "TX";
  customerForm.elements.zip.value = customer.zip || "";
  customerForm.elements.salesPerson.value = customer.salesPerson || salesPersonSelect.value;
  customerForm.elements.accessCode.value = customer.accessCode || "";
  customerForm.elements.store.checked = customer.allowedForms.includes("store");
  customerForm.elements.restaurant.checked = customer.allowedForms.includes("restaurant");
  customerForm.elements.repeatEvery.value = customer.repeatEvery || 1;
  customerForm.elements.repeatUnit.value = customer.repeatUnit || "Week";
  customerForm.querySelectorAll('input[name="orderDays"]').forEach((input) => {
    input.checked = (customer.orderDays || []).includes(input.value);
  });
  customerForm.elements.startDate.value = customer.startDate || "";
  customerForm.elements.cutoff.value = customer.cutoff || "10:00 AM";
  customerForm.elements.active.checked = customer.active;
  customerForm.elements.name.focus();
};

const fillSubCategoryForm = (item) => {
  subCategoryForm.elements.id.value = item.id;
  subCategoryForm.elements.category.value = item.category;
  subCategoryForm.elements.name.value = item.name;
  subCategoryForm.elements.active.checked = item.active;
  subCategoryForm.elements.name.focus();
};

const fillBrandForm = (brand) => {
  brandForm.elements.id.value = brand.id;
  brandForm.elements.code.value = brand.code || "";
  brandForm.elements.name.value = brand.name;
  brandForm.elements.subCategory.value = brand.subCategory || "General";
  [...brandForm.elements.territories.options].forEach((option) => {
    option.selected = (brand.territories || []).includes(option.value);
  });
  brandForm.elements.name.focus();
};

const fillProductForm = (product) => {
  productForm.elements.id.value = product.id;
  productForm.elements.sku.value = product.sku;
  productForm.elements.name.value = product.name;
  productForm.elements.brand.value = product.brand;
  productForm.elements.subCategory.value = product.subCategory;
  productForm.elements.productCategory.value = product.productCategory;
  productForm.elements.pack.value = product.pack;
  productForm.elements.price.value = product.price;
  productForm.elements.description.value = product.description || "";
  productForm.elements.tagText.value = product.tagText || "";
  productForm.elements.store.checked = product.forms.includes("store");
  productForm.elements.restaurant.checked = product.forms.includes("restaurant");
  productForm.elements.outOfStock.checked = product.outOfStock;
  productForm.elements.isNew.checked = product.isNew;
  productForm.elements.hide.checked = product.hide;
  productForm.elements.active.checked = product.active;
  productForm.querySelectorAll('input[name="labelIds"]').forEach((input) => {
    input.checked = (product.labelIds || []).includes(input.value);
  });
  productForm.elements.sku.focus();
};

const fillLabelForm = (label) => {
  labelForm.elements.id.value = label.id;
  labelForm.elements.name.value = label.name;
  labelForm.elements.color.value = label.color;
  labelForm.elements.territory.value = label.territory || "All";
  labelForm.elements.startDate.value = label.startDate || "";
  labelForm.elements.endDate.value = label.endDate || "";
  labelForm.elements.active.checked = label.active;
  labelForm.elements.name.focus();
};

const openAssignModal = ({ labelId = "", productId = "" }) => {
  activeAssignLabelId = labelId;
  activeAssignProductId = productId;
  const modalTitle = document.querySelector("#assignTagsTitle");
  if (productId) {
    const product = db.products.find((item) => item.id === productId);
    modalTitle.textContent = `Assign Tags${product ? `: ${product.name}` : ""}`;
    const assigned = new Set(product?.labelIds || []);
    assignTree.innerHTML = `<div class="assign-label-list">${db.labels.map((label) => `<label><input type="checkbox" value="${label.id}" ${assigned.has(label.id) ? "checked" : ""} /> <span class="product-label" style="--label-color:${label.color}">${label.name}</span><span>${label.territory || "All"}</span></label>`).join("")}</div>`;
    assignModal.classList.remove("is-hidden");
    return;
  }
  modalTitle.textContent = "Assign Tags";
  const selectedLabelIds = productId ? db.products.find((product) => product.id === productId)?.labelIds || [] : [labelId];
  const grouped = db.products.reduce((acc, product) => {
    const category = product.productCategory || "Dry";
    const sub = product.subCategory || "General";
    acc[category] ||= {};
    acc[category][sub] ||= [];
    acc[category][sub].push(product);
    return acc;
  }, {});
  assignTree.innerHTML = ["Cooler", "Frozen", "Dry"].map((category) => {
    const subGroups = grouped[category] || {};
    const count = Object.values(subGroups).flat().length;
    return `<details class="assign-category" open><summary>${category}<span>${count}</span></summary>${Object.entries(subGroups).map(([sub, products]) => `<details class="assign-subcategory" open><summary>${sub}<span>${products.length}</span></summary>${products.slice(0, 120).map((product) => {
      const checked = productId ? selectedLabelIds.some(Boolean) && product.id === productId : (product.labelIds || []).includes(labelId);
      return `<label><input type="checkbox" value="${product.id}" ${checked ? "checked" : ""} /> ${product.name} <span>${product.brand} | ${product.pack}</span></label>`;
    }).join("")}</details>`).join("")}</details>`;
  }).join("");
  assignModal.classList.remove("is-hidden");
};

const saveAssignments = () => {
  const selectedProductIds = [...assignTree.querySelectorAll("input:checked")].map((input) => input.value);
  if (activeAssignLabelId) {
    db.products = db.products.map((product) => {
      const ids = new Set(product.labelIds || []);
      if (selectedProductIds.includes(product.id)) ids.add(activeAssignLabelId);
      else ids.delete(activeAssignLabelId);
      return { ...product, labelIds: [...ids] };
    });
  }
  if (activeAssignProductId) {
    db.products = db.products.map((product) => product.id === activeAssignProductId ? { ...product, labelIds: selectedProductIds } : product);
  }
  saveDb(db);
  assignModal.classList.add("is-hidden");
  renderAll();
};

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const exportProducts = () => {
  const headers = ["sku", "name", "brand", "productCategory", "subCategory", "pack", "price", "forms", "active", "hide", "outOfStock"];
  const csv = [headers.join(","), ...db.products.map((product) => headers.map((key) => csvCell(Array.isArray(product[key]) ? product[key].join("|") : product[key])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "delta-products.csv";
  link.click();
  URL.revokeObjectURL(link.href);
};

const parseCsvLine = (line) => {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
};

const importProducts = async (file) => {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift()).map((header) => header.trim());
  lines.forEach((line) => {
    const row = Object.fromEntries(parseCsvLine(line).map((cell, index) => [headers[index], cell]));
    const product = normalizeProduct({
      id: row.id || `${slugify(row.brand)}-${slugify(row.name)}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      sku: row.sku,
      name: row.name,
      brand: row.brand,
      productCategory: row.productCategory,
      subCategory: row.subCategory,
      pack: row.pack,
      price: Number(row.price || 0),
      forms: row.forms ? row.forms.split("|") : ["store", "restaurant"],
      active: row.active !== "false",
      hide: row.hide === "true",
      outOfStock: row.outOfStock === "true"
    });
    const existing = db.products.findIndex((item) => item.sku === product.sku && item.name === product.name);
    if (existing >= 0) db.products[existing] = product;
    else db.products.unshift(product);
  });
  db = withDefaults(db);
  saveDb(db);
  renderAll();
};

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = formValues(adminLoginForm);
  loginAdmin(data.get("email"), data.get("accessCode"));
});

adminShowReset.addEventListener("click", () => {
  adminLoginForm.classList.add("is-hidden");
  adminResetForm.classList.remove("is-hidden");
  adminLoginStatus.textContent = "";
});

adminShowLogin.addEventListener("click", () => {
  adminResetForm.classList.add("is-hidden");
  adminLoginForm.classList.remove("is-hidden");
  adminResetStatus.textContent = "";
});

adminResetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = String(formValues(adminResetForm).get("email") || "").trim();
  const exists = db.users.some((user) => normalize(user.email) === normalize(email));
  adminResetStatus.textContent = exists ? "Staff reset request received. Ownership should verify before issuing a new credential." : "If this email belongs to a staff account, ownership should verify and follow up.";
  adminResetForm.reset();
});

adminLogout.addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  renderAdminSession();
});

tabs.forEach((tab) => tab.addEventListener("click", () => setActiveView(tab.dataset.adminTab)));

userForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = formValues(userForm);
  const user = {
    id: data.get("id") || `${slugify(data.get("firstName"))}-${slugify(data.get("lastName"))}-${Date.now()}`,
    firstName: data.get("firstName").trim(),
    lastName: data.get("lastName").trim(),
    email: data.get("email").trim(),
    phone: data.get("phone").trim(),
    role: data.get("role"),
    accessCode: data.get("accessCode").trim(),
    active: userForm.elements.active.checked,
    emailConfirmed: userForm.elements.emailConfirmed.checked
  };
  const index = db.users.findIndex((item) => item.id === user.id);
  if (index >= 0) db.users[index] = user;
  else db.users.unshift(user);
  saveDb(db);
  userForm.reset();
  userForm.elements.active.checked = true;
  userForm.elements.emailConfirmed.checked = true;
  renderAll();
});

customerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = formValues(customerForm);
  const allowedForms = [];
  if (customerForm.elements.store.checked) allowedForms.push("store");
  if (customerForm.elements.restaurant.checked) allowedForms.push("restaurant");
  const orderDays = selectedOrderDays(customerForm);
  const customer = {
    id: data.get("id") || `${slugify(data.get("name"))}-${Date.now()}`,
    name: data.get("name").trim(),
    prefix: data.get("prefix").trim(),
    firstName: data.get("firstName").trim(),
    lastName: data.get("lastName").trim(),
    contact: `${data.get("firstName").trim()} ${data.get("lastName").trim()}`.trim(),
    mainPhone: data.get("mainPhone").trim(),
    altPhone: data.get("altPhone").trim(),
    email: data.get("email").trim(),
    secondEmail: data.get("secondEmail").trim(),
    thirdEmail: data.get("thirdEmail").trim(),
    accessCode: data.get("accessCode").trim(),
    companyType: data.get("companyType"),
    shippingAddress1: data.get("shippingAddress1").trim(),
    shippingAddress2: data.get("shippingAddress2").trim(),
    city: data.get("city").trim(),
    state: data.get("state"),
    zip: data.get("zip").trim(),
    salesPerson: data.get("salesPerson"),
    active: customerForm.elements.active.checked,
    allowedForms: allowedForms.length ? allowedForms : ["store"],
    cadence: orderDays.length > 1 ? "twice-weekly" : "weekly",
    orderDays: orderDays.length ? orderDays : ["Monday"],
    repeatEvery: Number(data.get("repeatEvery")) || 1,
    repeatUnit: data.get("repeatUnit"),
    startDate: data.get("startDate"),
    cutoff: data.get("cutoff").trim()
  };
  const index = db.customers.findIndex((item) => item.id === customer.id);
  if (index >= 0) db.customers[index] = customer;
  else db.customers.unshift(customer);
  saveDb(db);
  customerForm.reset();
  customerForm.elements.store.checked = true;
  customerForm.elements.active.checked = true;
  renderAll();
});

subCategoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = formValues(subCategoryForm);
  const item = { id: data.get("id") || slugify(data.get("name")), name: data.get("name").trim(), category: data.get("category"), active: subCategoryForm.elements.active.checked };
  const index = db.subCategories.findIndex((sub) => sub.id === item.id);
  if (index >= 0) db.subCategories[index] = item;
  else db.subCategories.push(item);
  saveDb(db);
  subCategoryForm.reset();
  subCategoryForm.elements.active.checked = true;
  renderAll();
});

brandForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = formValues(brandForm);
  const brand = { id: data.get("id") || slugify(data.get("name")), code: data.get("code").trim(), name: data.get("name").trim(), subCategory: data.get("subCategory"), territories: data.getAll("territories") };
  const index = db.brands.findIndex((item) => item.id === brand.id);
  if (index >= 0) db.brands[index] = brand;
  else db.brands.push(brand);
  saveDb(db);
  brandForm.reset();
  renderAll();
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = formValues(productForm);
  const forms = [];
  if (productForm.elements.store.checked) forms.push("store");
  if (productForm.elements.restaurant.checked) forms.push("restaurant");
  const active = productForm.elements.active.checked;
  const hide = productForm.elements.hide.checked;
  const outOfStock = productForm.elements.outOfStock.checked;
  const product = normalizeProduct({
    id: data.get("id") || `${slugify(data.get("brand"))}-${slugify(data.get("name"))}-${Date.now()}`,
    sku: data.get("sku").trim(),
    name: data.get("name").trim(),
    brand: data.get("brand"),
    subCategory: data.get("subCategory"),
    productCategory: data.get("productCategory"),
    category: data.get("subCategory"),
    pack: data.get("pack").trim(),
    price: Number(data.get("price")),
    description: data.get("description").trim(),
    tagText: data.get("tagText").trim(),
    forms: forms.length ? forms : ["store"],
    labelIds: data.getAll("labelIds"),
    outOfStock,
    isNew: productForm.elements.isNew.checked,
    hide,
    active,
    available: active && !hide && !outOfStock
  });
  const index = db.products.findIndex((item) => item.id === product.id);
  if (index >= 0) db.products[index] = product;
  else db.products.unshift(product);
  db = withDefaults(db);
  saveDb(db);
  productForm.reset();
  productForm.elements.active.checked = true;
  renderAll();
});

labelForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = formValues(labelForm);
  const label = normalizeLabel({ id: data.get("id") || slugify(data.get("name")), name: data.get("name").trim(), color: data.get("color"), territory: data.get("territory"), startDate: data.get("startDate"), endDate: data.get("endDate"), active: labelForm.elements.active.checked });
  const index = db.labels.findIndex((item) => item.id === label.id);
  if (index >= 0) db.labels[index] = label;
  else db.labels.push(label);
  db.tags = db.labels;
  saveDb(db);
  labelForm.reset();
  labelForm.elements.color.value = "#0f8a4b";
  labelForm.elements.active.checked = true;
  renderAll();
});

userBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-user]");
  if (!button) return;
  const user = db.users.find((item) => item.id === button.dataset.editUser);
  if (user) fillUserForm(user);
});

customerBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-customer]");
  if (!button) return;
  const customer = db.customers.find((item) => item.id === button.dataset.editCustomer);
  if (customer) fillCustomerForm(customer);
});

subCategoryBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-subcategory]");
  if (!button) return;
  const item = db.subCategories.find((sub) => sub.id === button.dataset.editSubcategory);
  if (item) fillSubCategoryForm(item);
});

brandBody.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-brand]");
  const remove = event.target.closest("[data-delete-brand]");
  if (edit) {
    const brand = db.brands.find((item) => item.id === edit.dataset.editBrand);
    if (brand) fillBrandForm(brand);
  }
  if (remove) {
    db.brands = db.brands.filter((item) => item.id !== remove.dataset.deleteBrand);
    saveDb(db);
    renderAll();
  }
});

productBody.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-product]");
  const assign = event.target.closest("[data-assign-product]");
  const remove = event.target.closest("[data-delete-product]");
  if (edit) {
    const product = db.products.find((item) => item.id === edit.dataset.editProduct);
    if (product) fillProductForm(product);
  }
  if (assign) openAssignModal({ productId: assign.dataset.assignProduct });
  if (remove) {
    db.products = db.products.filter((product) => product.id !== remove.dataset.deleteProduct);
    saveDb(db);
    renderAll();
  }
});

labelBody.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-label]");
  const assign = event.target.closest("[data-assign-label]");
  const remove = event.target.closest("[data-delete-label]");
  if (edit) {
    const label = db.labels.find((item) => item.id === edit.dataset.editLabel);
    if (label) fillLabelForm(label);
  }
  if (assign) openAssignModal({ labelId: assign.dataset.assignLabel });
  if (remove) {
    db.labels = db.labels.filter((label) => label.id !== remove.dataset.deleteLabel);
    db.products = db.products.map((product) => ({ ...product, labelIds: (product.labelIds || []).filter((id) => id !== remove.dataset.deleteLabel) }));
    saveDb(db);
    renderAll();
  }
});

orderBody.addEventListener("click", (event) => {
  const view = event.target.closest("[data-view-order]");
  const print = event.target.closest("[data-print-order]");
  if (view) {
    activeOrderId = view.dataset.viewOrder;
    renderOrderDetail();
    orderDetail.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (print) window.print();
});

orderDetail.addEventListener("click", (event) => {
  const update = event.target.closest("[data-update-order]");
  const print = event.target.closest("[data-print-order]");
  const add = event.target.closest("[data-add-order-item]");
  const setStatus = event.target.closest("[data-set-order-status]");
  const order = db.orders.find((item) => item.id === activeOrderId);
  if (print) window.print();
  if (setStatus && order) {
    order.status = normalizeOrderStatus(setStatus.dataset.setOrderStatus);
    order.modifiedAt = new Date().toISOString();
    saveDb(db);
    renderAll();
  }
  if (update && order) {
    order.status = normalizeOrderStatus($("[data-order-detail-status]").value);
    order.modifiedAt = new Date().toISOString();
    order.items = order.items.map((item) => ({ ...item, qty: Number($(`[data-order-item-qty="${orderItemKey(item)}"]`)?.value || item.qty) }));
    mergeOrderItems(order);
    saveDb(db);
    renderAll();
  }
  if (add && order) {
    const group = add.dataset.addOrderItem;
    const selectedId = $(`[data-order-product-picker="${group}"]`)?.value;
    const qty = Math.max(1, Number($(`[data-order-add-qty="${group}"]`)?.value || 1));
    const product = db.products.find((item) => item.id === selectedId);
    if (!product) return;
    const existing = order.items.find((item) => orderItemKey(item) === product.id || item.sku === product.sku);
    if (existing) existing.qty = Number(existing.qty || 0) + qty;
    else order.items.push({ productId: product.id, sku: product.sku, name: product.name, brand: product.brand, category: product.productCategory, subCategory: product.subCategory, pack: product.pack, price: product.price, qty });
    mergeOrderItems(order);
    order.modifiedAt = new Date().toISOString();
    saveDb(db);
    renderAll();
  }
});

$$("[data-product-filter], [data-product-global-search]").forEach((input) => input.addEventListener("input", renderProducts));
$("[data-order-status-filter]").addEventListener("input", renderOrders);
$("[data-order-global-search]").addEventListener("input", renderOrders);
$("[data-subcategory-search]").addEventListener("input", renderSubCategories);
$("[data-brand-search]").addEventListener("input", renderBrands);
$("[data-tag-search]").addEventListener("input", renderLabels);
$("[data-export-products]").addEventListener("click", exportProducts);
$("[data-import-products]").addEventListener("change", (event) => {
  if (event.target.files?.[0]) importProducts(event.target.files[0]);
});
$("[data-close-assign-modal]").addEventListener("click", () => assignModal.classList.add("is-hidden"));
$("[data-save-tag-assignments]").addEventListener("click", saveAssignments);
$("[data-reset-demo]").addEventListener("click", () => {
  db = withDefaults(fullSeed());
  activeOrderId = db.orders[0]?.id || "";
  saveDb(db);
  renderAll();
});

renderAdminSession();
renderAll();
