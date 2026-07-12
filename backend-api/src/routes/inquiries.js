import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateInquiry } from "../validate.js";
import { Inquiry } from "../models/Inquiry.js";
import { sendInquiryNotification } from "../email.js";
import { config } from "../config.js";

export const inquiriesRouter = Router();

// 10 submissions per 15 minutes per IP — generous for humans, hostile to bots.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, error: "Too many submissions — please try again later." },
});

/**
 * POST /api/inquiries
 * Body: { type, businessName, contactName, email, phone, city, businessType, message, _honey }
 */
inquiriesRouter.post("/", submitLimiter, async (req, res) => {
  const result = validateInquiry(req.body);

  // Honeypot hit: report success, store nothing.
  if (result.isBot) {
    return res.status(200).json({ ok: true });
  }
  if (!result.ok) {
    return res.status(400).json({ ok: false, errors: result.errors });
  }

  let saved = null;
  if (!config.skipDb) {
    saved = await Inquiry.create({
      ...result.data,
      userAgent: String(req.headers["user-agent"] || "").slice(0, 400),
    });
  }

  // Fire the notification but don't block or fail the request on email problems.
  sendInquiryNotification(result.data).then((sent) => {
    if (saved && sent) {
      Inquiry.updateOne({ _id: saved._id }, { emailSent: true }).catch(() => {});
    }
  });

  return res.status(201).json({ ok: true, id: saved ? saved._id : null });
});
