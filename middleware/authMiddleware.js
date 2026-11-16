
const jwt = require("jsonwebtoken");


const authMiddleware = (req, res, next) => {
  try {
    // Get token from request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication token is required."
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Store user ID in request
    req.userId = decoded.userId;

    // Continue to next middleware or API
    next();

  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token."
    });
  }
};

module.exports = authMiddleware;