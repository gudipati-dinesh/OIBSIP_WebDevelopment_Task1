const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}
exports.mailConfigured = !!transporter;

exports.sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log(`\n📧 [SMTP not configured — email printed here]\nTo: ${to}\nSubject: ${subject}\n${text || html}\n`);
    return { sent: false };
  }
  await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html, text });
  return { sent: true };
};
