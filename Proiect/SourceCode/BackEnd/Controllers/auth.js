const { signup } = require("./signup");
const { login } = require("./login");
const { forgotPassword, resetPassword } = require("./password");

exports.signup = signup;
exports.login = login;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
