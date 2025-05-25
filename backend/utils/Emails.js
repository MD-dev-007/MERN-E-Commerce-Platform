const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

exports.sendMail = async(receiverEmail, subject, body) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: receiverEmail,
      subject: subject,
      html: body
    });
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};
