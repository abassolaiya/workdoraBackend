const mongoose = require("mongoose");

const WaitlistUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
    maxlength: [100, "Name cannot be more than 100 characters"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email",
    ],
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, "Phone number cannot be more than 20 characters"],
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [100, "Job title cannot be more than 100 characters"],
  },
  organization: {
    type: String,
    trim: true,
    maxlength: [100, "Organization cannot be more than 100 characters"],
  },
  toolsUsed: [
    {
      type: String,
      trim: true,
    },
  ],
  desiredChanges: {
    type: String,
    maxlength: [500, "Desired changes cannot be more than 500 characters"],
  },
  idealLoi: {
    type: Boolean,
    default: false,
  },
  utmSource: {
    type: String,
    trim: true,
  },
  utmCampaign: {
    type: String,
    trim: true,
  },
  referrer: {
    type: String,
    trim: true,
  },
  referralCode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: String,
    trim: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  betaTester: {
    type: Boolean,
    default: false,
  },
  lifetimeDiscount: {
    type: Boolean,
    default: false,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate referral code before saving
WaitlistUserSchema.pre("save", async function (next) {
  if (this.isNew && !this.referralCode) {
    const prefix = this.email.split("@")[0];
    const random = Math.random().toString(36).substring(2, 8);
    this.referralCode = `${prefix}_${random}`;
  }
  next();
});

module.exports = mongoose.model("WaitlistUser", WaitlistUserSchema);
