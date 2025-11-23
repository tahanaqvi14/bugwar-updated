// Email.js
import nodemailer from 'nodemailer';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function Email(recipientEmail) {
  try {
    const otp = generateOTP();

    // Create transporter (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'competitivecodingarena@gmail.com', // your email
        pass: 'lzgq ttbh dxbr hrrn',              // Gmail app password
      },
    });

    // Email options
    const mailOptions = {
      from: 'competitivecodingarena@gmail.com',
      to: recipientEmail,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
      html: `<h2>Your OTP code is: <strong>${otp}</strong></h2>`  
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', info.accepted);

    return {
      success: true,
      message: `${otp}`,
  }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: `${error}`,
  }
  }
}