const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: process.env.EMAIL_PORT || 465,
  secure: true, // true para sa port 465, false para sa ibang ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
//   const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const url = `http://localhost:5000/verify-email?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: `"TESDA Centralized Schedule Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - COROPOTI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #007bff;">Welcome to TESDA Centralized Schedule Management System!</h2>
        <p>Thank you for registering. Please verify your email address to gain full access to the system.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="font-size: 0.8rem; color: #666;">If the button above doesn't work, please copy and paste this link into your browser:</p>
        <p style="font-size: 0.8rem; color: #007bff;">${url}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.75rem; color: #888;">This is an automated message, please do not reply to this email.</p>
        </div>
      `,
    });
    console.log(`✅ Verification email sent to: ${email}`);
  } catch (error) {
    console.error("❌ Hostinger Mail Error:", error);
    throw error; // I-throw para mahuli ng register route catch block
  }
};

module.exports = { sendVerificationEmail };