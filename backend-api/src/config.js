// Environment configuration — every value comes from env vars (Cloud Run-friendly).
const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    console.warn(`[config] Missing env var ${name}`);
  }
  return value;
};

export const config = {
  port: parseInt(process.env.PORT || "8080", 10),
  env: process.env.NODE_ENV || "production",

  // MongoDB Atlas connection string, e.g. mongodb+srv://user:pass@cluster0.x.mongodb.net/delta
  mongoUri: required("MONGODB_URI"),
  skipDb: process.env.SKIP_DB === "1", // local testing without a database

  // Comma-separated list of allowed browser origins
  corsOrigins: (process.env.CORS_ORIGINS ||
    "https://deltafoodsupplies.com,https://www.deltafoodsupplies.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // SMTP for notification emails (optional — inquiries are still stored if unset)
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "website@deltafoodsupplies.com",
    to: process.env.MAIL_TO || "sales@deltafoodsupplies.com",
  },
};
