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

router.get("/reset-password/:token", (req, res) => {
  const { token } = req.params;
  console.log("Reset Password Token:", token); //debugging
  res.render("reset-password", {
    token,
    message: "",
  });
});

module.exports = router;
