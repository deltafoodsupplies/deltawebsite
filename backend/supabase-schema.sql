create table staff_users (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  role text not null default 'Sales',
  active boolean not null default true,
  email_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  prefix text,
  first_name text,
  last_name text,
  main_phone text,
  alternative_phone text,
  city text not null,
  contact_name text,
  email text unique,
  second_email text,
  third_email text,
  access_code_hash text,
  phone text,
  company_type text,
  shipping_address_1 text,
  shipping_address_2 text,
  address_region text,
  zip_code text,
  sales_person_id uuid references staff_users(id),
  repeat_every integer not null default 1,
  repeat_unit text not null default 'Week',
  start_date date,
  cadence text not null default 'weekly' check (cadence in ('weekly', 'twice-weekly')),
  order_days text[] not null default array['Monday'],
  cutoff_time text not null default '10:00 AM',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table customer_order_forms (
  customer_id uuid not null references customers(id) on delete cascade,
  form_type text not null check (form_type in ('store', 'restaurant')),
  primary key (customer_id, form_type)
);

create table sub_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product_category text not null check (product_category in ('Dry', 'Cooler', 'Frozen')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  quickbook_code text,
  name text not null unique,
  sub_category_id uuid references sub_categories(id),
  territories text[] not null default array['TX'],
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  brand_id uuid references brands(id),
  brand text not null,
  category text not null check (category in ('Dry', 'Cooler', 'Frozen')),
  sub_category_id uuid references sub_categories(id),
  sub_category text,
  pack text not null,
  description text,
  searchable_tags text,
  case_price numeric(10, 2) not null check (case_price >= 0),
  available boolean not null default true,
  active boolean not null default true,
  hide_from_customer boolean not null default false,
  out_of_stock boolean not null default false,
  new_item boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_order_forms (
  product_id uuid not null references products(id) on delete cascade,
  form_type text not null check (form_type in ('store', 'restaurant')),
  primary key (product_id, form_type)
);

create table labels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#0f8a4b',
  territory text not null default 'All',
  start_date date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table product_labels (
  product_id uuid not null references products(id) on delete cascade,
  label_id uuid not null references labels(id) on delete cascade,
  primary key (product_id, label_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  form_type text not null check (form_type in ('store', 'restaurant')),
  fulfillment text not null check (fulfillment in ('Delta truck delivery', 'Warehouse pickup')),
  status text not null default 'Order Received' check (status in ('Order Received', 'Order Entered', 'Order Shipped')),
  order_date date not null default current_date,
  ship_date date,
  notes text,
  modified_at timestamptz not null default now(),
  submitted_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  sku text not null,
  name text not null,
  brand text not null,
  pack text not null,
  case_price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0)
);

create index orders_customer_id_idx on orders(customer_id);
create index order_items_order_id_idx on order_items(order_id);
create index products_category_idx on products(category);
create index products_brand_idx on products(brand);
create index products_sub_category_idx on products(sub_category);
create index brands_name_idx on brands(name);
create index product_labels_product_id_idx on product_labels(product_id);
