# Delta Food Supplies Order Backend

GitHub Pages can host the public site and the order UI, but it cannot run a private backend or database. Use this folder when connecting the portal to Supabase, Firebase, or a custom API.

Recommended production stack:

- GitHub Pages for the public marketing site and order UI.
- Supabase Auth for customer and sales login.
- Supabase Auth password reset emails for customer and staff users.
- Supabase Postgres using `supabase-schema.sql`.
- Row-level security so customers only see their own account, approved order forms, approved products, and submitted orders.
- Sales role access for product pricing, customer form access, order cadence, and order status.
- Staff users are modeled separately from customers so Delta can manage internal roles, active status, and email confirmation.
- Customer records include company/contact details, optional secondary emails, shipping address, company type, assigned salesperson, and delivery schedule.
- Brands and subcategories are managed as first-class records so the customer ordering UI can filter by brand, category, and subcategory.
- Product records include customer visibility, active status, out-of-stock, new-item, and hide-from-customer controls.
- Tags support color, territory, active status, and optional start/end dates, then assign to products through `product_labels`.

Core production rules:

- Store customers can only see products mapped to `store`.
- Restaurant customers can only see restaurant products when their account has `restaurant` in `customer_order_forms`.
- Customer login must be enforced by the backend, not only by JavaScript in GitHub Pages.
- Store access codes as hashes or use Supabase Auth passwords/magic links. Do not store plain access codes in production.
- Password reset requests in the static prototype are only UI messages. Production reset must send email through the auth provider.
- Product prices are read from `products.case_price` at checkout and copied into `order_items.case_price` so old orders keep historical pricing.
- Product labels such as low stock, on sale, short date, and custom tags are stored in `labels` and joined through `product_labels`.
- CSV import/export should run through a staff-only backend endpoint that validates SKU, category, brand, price, and form visibility before writing to the database.
- Order cadence and cutoff are account-level settings on `customers`.
- Order status should be managed by staff users only, with customers limited to their own submitted order history. The admin workflow is `Order Received` → `Order Entered` → `Order Shipped`.
- Public search engines should not index `order.html` or `admin.html`.
