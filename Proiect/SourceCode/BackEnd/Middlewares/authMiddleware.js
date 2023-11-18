const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // Get the token from the request cookies
  const token = req.cookies.jwt;

  // Check if there is no token
  if (!token) {
    // If the user is trying to access a protected route (not the login page), redirect to login
    if (!req.originalUrl.startsWith("/login")) {
      return res.redirect("/login?errorMessage=Unauthorized. Please log in.");
    }
  } else {
    try {
      // Verify the token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the decoded user information to the request for further use
      req.user = decodedToken;

      // Continue to the next middleware or route handler
      return next();
    } catch (error) {
      // If the token is invalid, redirect to the login page
      return res.redirect("/login?errorMessage=Unauthorized. Please log in.");
    }
  }

  // If the user is on the login page or has a valid token, proceed to the next middleware or route handler
  return next();
}

module.exports = authMiddleware;
