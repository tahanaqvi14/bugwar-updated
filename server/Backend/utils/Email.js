// Email.js
import nodemailer from 'nodemailer';
import { isProduction } from '../config.js';

// The Gmail address and app password come from environment variables (EMAIL_USER / EMAIL_PASS).
// Never put them in the code: the repository is public.
let transporter = null;

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

export default async function Email(recipientEmail, otp) {
  const mailer = getTransporter();

  if (!mailer) {
    if (!isProduction) {
      // Local development without email credentials: print the code so sign up can still be tested.
      console.log(`[dev] OTP for ${recipientEmail}: ${otp}`);
      return { success: true };
    }
    console.error('EMAIL_USER / EMAIL_PASS are not set, cannot send OTP emails');
    return { success: false };
  }

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}\nIt expires in 10 minutes.`,
      html: `<h2>Your OTP code is: <strong>${otp}</strong></h2><p>It expires in 10 minutes.</p>`,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false };
  }
}
