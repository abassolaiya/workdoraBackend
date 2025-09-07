const express = require("express");
const router = express.Router();
const WaitlistUser = require("../models/WaitlistUser");
const validateWaitlistUser = require("../middleware/validation");
const rateLimit = require("express-rate-limit");

// Rate limiting
const waitlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message:
      "Too many waitlist submissions from this IP, please try again after 15 minutes",
  },
});

// Add to waitlist
router.post("/", waitlistLimiter, validateWaitlistUser, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      jobTitle,
      organization,
      toolsUsed,
      desiredChanges,
      utmSource,
      utmCampaign,
      referrer,
      referredBy,
    } = req.body;

    // Check if user already exists
    const existingUser = await WaitlistUser.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists in our waitlist",
      });
    }

    // Calculate score based on form completeness
    let score = 0;
    if (organization) score += 2;
    if (desiredChanges) score += 1;

    // Check if user qualifies for design partner program
    const designPartnerTools = ["Slack", "Harvest", "QuickBooks"];
    const matchingTools = toolsUsed
      ? toolsUsed.filter((tool) => designPartnerTools.includes(tool))
      : [];
    const idealLoi = matchingTools.length >= 2;

    if (idealLoi) score += 3;

    // Create new waitlist user
    const waitlistUser = new WaitlistUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      jobTitle: jobTitle ? jobTitle.trim() : undefined,
      organization: organization ? organization.trim() : undefined,
      toolsUsed: toolsUsed || [],
      desiredChanges: desiredChanges ? desiredChanges.trim() : undefined,
      idealLoi,
      utmSource: utmSource || undefined,
      utmCampaign: utmCampaign || undefined,
      referrer: referrer || undefined,
      referredBy: referredBy || undefined,
      score,
      lifetimeDiscount: idealLoi, // Grant lifetime discount to design partners
    });

    await waitlistUser.save();

    res.status(201).json({
      success: true,
      message: "Successfully joined the waitlist!",
      data: {
        referralCode: waitlistUser.referralCode,
        lifetimeDiscount: waitlistUser.lifetimeDiscount,
        idealLoi: waitlistUser.idealLoi,
      },
    });
  } catch (error) {
    console.error("Waitlist submission error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing your request",
    });
  }
});

// Get waitlist stats (for admin purposes)
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await WaitlistUser.countDocuments();
    const designPartners = await WaitlistUser.countDocuments({
      idealLoi: true,
    });
    const recentSignups = await WaitlistUser.countDocuments({
      joinedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    // Get tools usage statistics
    const toolsStats = await WaitlistUser.aggregate([
      { $unwind: "$toolsUsed" },
      { $group: { _id: "$toolsUsed", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        designPartners,
        recentSignups,
        toolsStats,
      },
    });
  } catch (error) {
    console.error("Error fetching waitlist stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching waitlist statistics",
    });
  }
});

// Get user by referral code
router.get("/referral/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const user = await WaitlistUser.findOne({ referralCode: code });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Referral code not found",
      });
    }

    // Return limited information
    res.json({
      success: true,
      data: {
        name: user.name,
        hasDiscount: user.lifetimeDiscount,
      },
    });
  } catch (error) {
    console.error("Error fetching referral info:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching referral information",
    });
  }
});

// Export the router directly
module.exports = router;
