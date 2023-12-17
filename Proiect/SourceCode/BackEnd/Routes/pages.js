const express = require("express");
const path = require("path");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("../Home/main");
});

router.get("/login", (req, res) => {
  res.render("login-signup-frame", {
    body: "login",
    message: "",
  });
});

router.get("/signup", (req, res) => {
  res.render("login-signup-frame", {
    body: "signup",
    message: "",
  });
});

module.exports = router;
