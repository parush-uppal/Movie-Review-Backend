const express = require("express");
const {
  create,
  verifyEmail,
  resendEmailVerificationToken,
  forgotPassword,
  sendResetPasswordTokenStatus,
  resetPassword,
  signIn,
} = require("../controllers/user");
const { isValidPassResetToken } = require("../middlewares/user");
const {
  userValidtor,
  validate,
  validatePassword,
  signInValidator,
} = require("../middlewares/validator");

const { isAuth } = require("../middlewares/auth");
const passwordResetToken = require("../models/passwordResetToken");

const router = express.Router();

router.post("/create", userValidtor, validate, create);
router.post("/sign-in", signInValidator, validate, signIn);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-verification-token", resendEmailVerificationToken);
router.post("/forgot-password", forgotPassword);
router.post(
  "/verify-pass-reset-token",
  isValidPassResetToken,
  sendResetPasswordTokenStatus
);
router.post(
  "/reset-password",
  validatePassword,
  validate,
  isValidPassResetToken,
  resetPassword
);

router.get("/is-auth", isAuth, (req, res) => {
  const { user } = req;
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      role:user.role,
    },
  });
});

module.exports = router;
