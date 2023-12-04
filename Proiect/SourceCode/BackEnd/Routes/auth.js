const express = require("express");
const authController = require("../Controllers/auth");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", {
    message: "",
  });
});

router.get("/reset-password", (req, res) => {
  const token = req.query.token; // Use req.query to get the token from query parameters
  console.log("Reset Password Token:", token); // Debugging
  res.render("reset-password", {
    token,
    message: "",
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/login");
});

module.exports = router;
