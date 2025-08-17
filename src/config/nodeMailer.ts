import nodemailer from "nodemailer";

const transporter = 
  nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: process.env.Mail_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.Mail_USER,
      pass: process.env.Mail_PASS,
    },
  });

export default transporter;
