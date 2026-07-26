const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendMail({ to, subject, text, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("Missing SMTP_USER or SMTP_PASSWORD environment variables");
  }

  return transporter.sendMail({
    from: `"HMS Team" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

const sendEmail = async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    if (!to) {
      return res.status(400).send("Please provide a recipient email address");
    }

    await sendMail({
      to,
      subject: subject || "Hello from HMS",
      text: text || "Hello world?",
      html: html || `<b>${text || "Hello world?"}</b>`,
    });

    res.send("Email sent successfully");
  } catch (err) {
    console.error("Error while sending mail:", err);
    res.status(500).send(`Failed to send email: ${err.message}`);
  }
};

sendEmail.sendMail = sendMail;
module.exports = sendEmail;
