const User = require("../models/user");
const jwt = require("jsonwebtoken");
const EmailVerificationToken = require("../models/emailVerificationToken");
const PasswordResetToken = require("../models/passwordResetToken");
const { isValidObjectId } = require("mongoose");
const {
  generateOTP,
  generateMailTransporter,
  sendMail,
} = require("../utils/mail");
const { sendError, generateRandomBytes } = require("../utils/helper");

exports.create = async (req, res) => {
  const { name, email, password } = req.body;

  const oldUser = await User.findOne({ email });

  if (oldUser) return sendError(res, "This email is already in use!");

  const newUser = new User({ name, email, password });
  await newUser.save();

  // generate 6 digit otp
  let OTP = generateOTP();

  // store otp inside our db
  const newEmailVerificationToken = new EmailVerificationToken({
    owner: newUser._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();

  // send that otp to our user

  const htmlContent = `
  <p>You verification OTP</p>
    <h1>${OTP}</h1>
  `;

  await sendMail(
    newUser.name,
    newUser.email,
    "Email Verification",
    htmlContent
  );

  // var transport = generateMailTransporter();

  // transport.sendMail({
  //   from: "verification@reviewapp.com",
  //   to: newUser.email,
  //   subject: "Email Verification",
  //   html: `
  //     <p>You verification OTP</p>
  //     <h1>${OTP}</h1>
  //   `,
  // });

  res.status(201).json({
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
  });
};

exports.verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body;

  if (!isValidObjectId(userId)) return sendError(res, "Invalid user!");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "user not found!", 404);

  if (user.isVerified) return sendError(res, "user is already verified!");

  const token = await EmailVerificationToken.findOne({ owner: userId });
  if (!token) return sendError(res, "token not found!");

  const isMatched = await token.compareToken(OTP);
  if (!isMatched) return sendError(res, "Please submit a valid OTP!");

  user.isVerified = true;
  await user.save();

  await EmailVerificationToken.findByIdAndDelete(token._id);

  
  const htmlContent = `
  <p>Welcome to our app and thanks for choosing us</p>
  `;

  await sendMail(
    user.name,
    user.email,
    "Welcome to The Film Feed",
    htmlContent
  );

  // var transport = generateMailTransporter();

  // transport.sendMail({
  //   from: "verification@reviewapp.com",
  //   to: user.email,
  //   subject: "Welcome Email",
  //   html: "<h1>Welcome to our app and thanks for choosing us.</h1>",
  // });
  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      token: jwtToken,
      isVerified: user.isVerified,
      role: user.role,
    },
    message: "Your email is verified.",
  });
};

exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) return sendError(res, "user not found!");

  if (user.isVerified)
    return sendError(res, "This email id is already verified!");

  const alreadyHasToken = await EmailVerificationToken.findOne({
    owner: userId,
  });
  if (alreadyHasToken)
    return sendError(
      res,
      "Only after one hour you can request for another token!"
    );

  // generate 6 digit otp
  let OTP = generateOTP();

  // store otp inside our db
  const newEmailVerificationToken = new EmailVerificationToken({
    owner: user._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();

  // send that otp to our user

   
  const htmlContent = `
  <p>You verification OTP</p>
    <h1>${OTP}</h1>
  `;

  await sendMail(
    user.name,
    user.email,
    "Email Verification",
    htmlContent
  );
  

  // var transport = generateMailTransporter();

  // transport.sendMail({
  //   from: "verification@reviewapp.com",
  //   to: user.email,
  //   subject: "Email Verification",
  //   html: `
  //     <p>You verification OTP</p>
  //     <h1>${OTP}</h1>
  //   `,
  // });

  res.json({
    message: "New OTP has been sent to your registered email accout.",
  });
};
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return sendError(res, "email is missing!");

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found!", 404);

  const alreadyHasToken = await PasswordResetToken.findOne({ owner: user._id });
  if (alreadyHasToken)
    return sendError(
      res,
      "Only after one hour you can request for another token!"
    );

  const token = await generateRandomBytes();
  const newPasswordResetToken = await PasswordResetToken({
    owner: user._id,
    token,
  });
  await newPasswordResetToken.save();

  const resetPasswordUrl = `https://the-film-feed.onrender.com/auth/reset-password?token=${token}&id=${user._id}`;
  // var transport = generateMailTransporter();


  const htmlContent = `
  <p>Click here to reset password</p>
  <a href='${resetPasswordUrl}'>Change Password</a>
  `;

  await sendMail(
    user.name,
    user.email,
    "Reset Password Link",
    htmlContent
  );
  

  // transport.sendMail({
  //   from: "security@reviewapp.com",
  //   to: user.email,
  //   subject: "Reset Password Link",
  //   html: `
  //     <p>Click here to reset password</p>
  //     <a href='${resetPasswordUrl}'>Change Password</a>
  //   `,
  // });

  res.json({ message: "Link sent to your email!" });
};

exports.sendResetPasswordTokenStatus = (req, res) => {
  res.json({ valid: true });
};

exports.resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body;
  const user = await User.findById(userId);

  const matched = await user.comparePassword(newPassword);
  if (matched)
    return sendError(res, "The new password must be diffrent from old one!");

  user.password = newPassword;
  await user.save();

  await PasswordResetToken.findByIdAndDelete(req.resetToken._id);

  const transport = generateMailTransporter();

  transport.sendMail({
    from: "security@reviewapp.com",
    to: user.email,
    subject: "Password Reset Successfully",
    html: `
      <p>Password Rest Successfully</p>
      <p>Now you can use new password</p>
    `,
  });
  res.json({ message: "Password Reset Successfully" });
};

exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "Email/Password mismatch!");

  const matched = await user.comparePassword(password);
  if (!matched) return sendError(res, "Email/Password mismatch!");

  const { _id, name, role, isVerified } = user;

  const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);

  res.json({
    user: { id: _id, name, email, role, token: jwtToken, isVerified },
  });
};
