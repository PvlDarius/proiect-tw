const express = require("express");
const authController = require("../Controllers/auth");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.get("/forgot-password", (req, res) => {
  res.render("login-signup-frame", {
    body: "forgot-password",
    message: "",
  });
});

router.get("/reset-password", (req, res) => {
  const token = req.query.token;
  res.render("login-signup-frame", {
    body: "reset-password",
    layout: false,
    token: token,
    message: "",
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/login");
});

module.exports = router;
