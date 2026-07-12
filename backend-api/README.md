# Delta Food Supplies — Backend API (Phase 1)

Node.js + Express + MongoDB API, built to run on **Google Cloud Run** with
**MongoDB Atlas**. Phase 1 handles website inquiries (contact form + new
wholesale account applications): stored in your database, emailed to your
sales inbox, rate-limited and spam-trapped.

Phases 2–3 (products, customer auth, orders) build on this same service —
the ordering portal frontend already exists in the website repo.

## What's here

```
backend-api/
├── src/
│   ├── server.js          Express app: security headers, CORS, health check
│   ├── config.js          All settings via environment variables
│   ├── validate.js        Input validation (dependency-free, unit-tested)
│   ├── email.js           Notification emails (optional, never blocks a request)
│   ├── models/Inquiry.js  MongoDB schema
│   └── routes/inquiries.js POST /api/inquiries (rate-limited, honeypot)
├── test/validate.test.js  Run with: node test/validate.test.js
├── site/api-forms.js      Website patch — activate after deploy (step 7)
├── scripts/deploy.sh      One-command Cloud Run deploy
├── Dockerfile
└── .env.example
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Health/uptime check |
| POST | `/api/inquiries` | Store + email a contact form or account application |

## Setup (one time, ~30 minutes)

### 1. MongoDB Atlas (free)
1. Create an account at mongodb.com/cloud/atlas → build a **free M0 cluster**
   (choose AWS/GCP region near Dallas, e.g. us-south/us-central).
2. Database Access → add a database user (username + strong password).
3. Network Access → allow access from anywhere (0.0.0.0/0) — Cloud Run IPs
   rotate; security comes from the credential, or upgrade later for VPC peering.
4. Copy the connection string ("Connect your application"), fill in the
   password, and add a database name: `...mongodb.net/delta?retryWrites=true&w=majority`

### 2. Google Cloud project
1. console.cloud.google.com → create project (e.g. `delta-food-supplies`).
2. Enable billing (Cloud Run has a generous free tier; this API will cost
   ~$0–2/month at your traffic).
3. Install the gcloud CLI locally: cloud.google.com/sdk → `gcloud auth login`.

### 3. Email (choose one)
- **Google Workspace** (if sales@deltafoodsupplies.com is on Workspace):
  create an App Password (Google Account → Security → 2-Step → App passwords).
  SMTP_HOST=smtp.gmail.com, SMTP_USER=sales@deltafoodsupplies.com, SMTP_PASS=the app password.
- **SendGrid** (free 100/day): create an API key.
  SMTP_HOST=smtp.sendgrid.net, SMTP_USER=apikey, SMTP_PASS=the key.
  Verify your sending domain in SendGrid for best deliverability.

### 4. Store secrets in Secret Manager
```bash
gcloud services enable secretmanager.googleapis.com run.googleapis.com cloudbuild.googleapis.com
printf 'YOUR_CONNECTION_STRING' | gcloud secrets create MONGODB_URI --data-file=-
printf 'smtp.gmail.com'         | gcloud secrets create SMTP_HOST   --data-file=-
printf 'sales@deltafoodsupplies.com' | gcloud secrets create SMTP_USER --data-file=-
printf 'YOUR_APP_PASSWORD'      | gcloud secrets create SMTP_PASS   --data-file=-
```

### 5. Deploy
```bash
cd backend-api
PROJECT_ID=your-project-id ./scripts/deploy.sh
```
First deploy takes a few minutes (Cloud Build builds the container).
Test: `curl <service-url>/healthz` → `{"ok":true,"db":"connected"}`

Test an inquiry:
```bash
curl -X POST <service-url>/api/inquiries \
  -H 'Content-Type: application/json' \
  -d '{"type":"contact","businessName":"Test Store","email":"you@example.com","message":"Hello"}'
```
You should get `{"ok":true,"id":"..."}`, see the document in Atlas
(Collections → delta → inquiries), and receive the email.

### 6. Custom domain (optional, nice)
Cloud Run → Manage custom domains → map `api.deltafoodsupplies.com`,
then add the CNAME it gives you at your DNS provider.

### 7. Switch the website forms
Copy `site/api-forms.js` into the website repo and add to `index.html`,
`contact.html`, and `become-a-customer.html` before `</body>`:
```html
<script src="api-forms.js" data-api="https://api.deltafoodsupplies.com" defer></script>
```
Forms now post to YOUR backend; if it's ever unreachable they automatically
fall back to FormSubmit, so no lead is lost. Once you're confident, the
FormSubmit action can be removed entirely.

## Local development
```bash
cp .env.example .env   # fill in values (or set SKIP_DB=1)
npm install
npm run dev
curl localhost:8080/healthz
```

## Security notes
- Rate limit: 10 submissions / 15 min / IP on the inquiry endpoint.
- Honeypot field silently discards bot submissions.
- Input length-capped and control-characters stripped; email HTML-escaped.
- CORS locked to deltafoodsupplies.com origins.
- Container runs as non-root; secrets only via Secret Manager.

## Phase 2 roadmap (when you're ready)
1. `products` collection seeded from the website's `pdf-products.js`.
2. Firebase Authentication for customer/staff logins (managed, don't roll your own).
3. `orders` endpoints + wire up the existing order portal frontend.
4. Admin role via Firebase custom claims; the admin.html tools move onto real data.
