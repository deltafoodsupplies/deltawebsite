import mongoose from "mongoose";

const InquirySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["contact", "account-application"],
      default: "contact",
      index: true,
    },
    businessName: { type: String, required: true, trim: true, maxlength: 200 },
    contactName: { type: String, trim: true, maxlength: 200 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40 },
    city: { type: String, trim: true, maxlength: 200 },
    businessType: { type: String, trim: true, maxlength: 80 },
    message: { type: String, trim: true, maxlength: 4000 },

    status: {
      type: String,
      enum: ["new", "in-progress", "closed"],
      default: "new",
      index: true,
    },
    source: { type: String, default: "website" },
    userAgent: { type: String, maxlength: 400 },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

InquirySchema.index({ createdAt: -1 });

export const Inquiry = mongoose.model("Inquiry", InquirySchema);
