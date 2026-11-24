
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

exports.mailConfigured = !!(
  process.env.BREVO_API_KEY &&
  process.env.MAIL_FROM
);

exports.sendMail = async ({ to, subject, html, text }) => {
  if (!exports.mailConfigured) {
    console.log(
      `\n📧 [Brevo not configured — email printed here]\nTo: ${to}\nSubject: ${subject}\n${text || html}\n`
    );
    return { sent: false };
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Slice Pizza',
        email: process.env.MAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('Brevo email error:', result);
    throw new Error(
      result.message || `Brevo API failed with status ${response.status}`
    );
  }

  console.log('Email accepted by Brevo:', result.messageId);

  return { sent: true, messageId: result.messageId };
};
