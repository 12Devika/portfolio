const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send({
        to: process.env.CONTACT_RECEIVER,
        from: process.env.CONTACT_SENDER || process.env.CONTACT_RECEIVER,
        subject: `Contact from ${name}`,
        text: `${message}\n\nReply-to: ${email}`,
      });
      return res.status(200).json({ ok: true });
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.CONTACT_SENDER || process.env.SMTP_USER,
        to: process.env.CONTACT_RECEIVER || process.env.SMTP_USER,
        subject: `Contact from ${name}`,
        text: `${message}\n\nReply-to: ${email}`,
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(500).json({ error: 'No mail transport configured (set SENDGRID_API_KEY or SMTP_*)' });
  } catch (err) {
    console.error('send error', err);
    return res.status(500).json({ error: 'send_failed' });
  }
};
