import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.Mail_HOST,
  port: process.env.Mail_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.Mail_USER,
    pass: process.env.Mail_PASS,
  },
});

export default transporter;
