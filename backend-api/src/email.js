import nodemailer from "nodemailer";
import { config } from "./config.js";

let transporter = null;

export function emailConfigured() {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);
}

function getTransporter() {
  if (!transporter && emailConfigured()) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/**
 * Send the "new inquiry" notification to the sales inbox.
 * Never throws — email failure must not fail the API request
 * (the inquiry is already stored in MongoDB).
 */
export async function sendInquiryNotification(inquiry) {
  const t = getTransporter();
  if (!t) {
    console.warn("[email] SMTP not configured — skipping notification");
    return false;
  }
  const subjectPrefix =
    inquiry.type === "account-application" ? "New wholesale account application" : "Website inquiry";
  const rows = [
    ["Type", inquiry.type],
    ["Business", inquiry.businessName],
    ["Contact", inquiry.contactName],
    ["Email", inquiry.email],
    ["Phone", inquiry.phone],
    ["City", inquiry.city],
    ["Business type", inquiry.businessType],
    ["Message", inquiry.message],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;background:#f2f5fa;font-weight:bold">${esc(k)}</td><td style="padding:6px 12px">${esc(v)}</td></tr>`
    )
    .join("");

  try {
    await t.sendMail({
      from: `Delta Website <${config.smtp.from}>`,
      to: config.smtp.to,
      replyTo: inquiry.email,
      subject: `${subjectPrefix} — ${inquiry.businessName}`,
      html: `<h2 style="font-family:sans-serif">${esc(subjectPrefix)}</h2><table style="font-family:sans-serif;border-collapse:collapse">${rows}</table>`,
    });
    return true;
  } catch (err) {
    console.error("[email] send failed:", err.message);
    return false;
  }
}
