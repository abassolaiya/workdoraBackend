const validator = require("validator");

const validateWaitlistUser = (req, res, next) => {
  const { name, email, toolsUsed, desiredChanges } = req.body;

  let errors = [];

  // Validate name
  if (!name || validator.isEmpty(name)) {
    errors.push("Name is required");
  } else if (!validator.isLength(name, { min: 2, max: 100 })) {
    errors.push("Name must be between 2 and 100 characters");
  }

  // Validate email
  if (!email || validator.isEmpty(email)) {
    errors.push("Email is required");
  } else if (!validator.isEmail(email)) {
    errors.push("Please provide a valid email");
  }

  // Validate toolsUsed (if provided)
  if (toolsUsed && !Array.isArray(toolsUsed)) {
    errors.push("Tools used must be an array");
  }

  // Validate desiredChanges (if provided)
  if (desiredChanges && !validator.isLength(desiredChanges, { max: 500 })) {
    errors.push("Desired changes cannot exceed 500 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Export the function directly
module.exports = validateWaitlistUser;
