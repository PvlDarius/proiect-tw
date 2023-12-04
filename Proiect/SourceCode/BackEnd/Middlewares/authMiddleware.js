const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.cookies.jwt;

  if (!token) {
    console.log("No token found");
    if (
      !req.originalUrl.startsWith("/login") &&
      !req.originalUrl.startsWith("/auth/reset-password")
    ) {
      return res.redirect("/login?errorMessage=Unauthorized. Please log in.");
    }
  } else {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      // Ensure that decodedToken contains user role
      if (decodedToken.userRole) {
        req.user = decodedToken;
        return next();
      } else {
        console.error("No user role found in decoded token");
        return res.redirect("/login?errorMessage=Unauthorized. Please log in.");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      return res.redirect("/login?errorMessage=Unauthorized. Please log in.");
    }
  }

  return next();
}

module.exports = authMiddleware;
