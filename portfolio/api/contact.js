// api/contact.js
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

  try {
    // Prefer SendGrid
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: process.env.CONTACT_RECEIVER,
        from: process.env.CONTACT_SENDER || process.env.CONTACT_RECEIVER,
        subject: `Portfolio contact from ${name}`,
        text: `${message}\n\nReply-to: ${email}`,
        replyTo: email, // allow quick reply to the sender
      };

      await sgMail.send(msg);
      return res.status(200).json({ ok: true });
    }

    // Fallback to SMTP (nodemailer)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for others
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.CONTACT_SENDER || process.env.SMTP_USER,
        to: process.env.CONTACT_RECEIVER || process.env.SMTP_USER,
        subject: `Portfolio contact from ${name}`,
        text: `${message}\n\nReply-to: ${email}`,
        replyTo: email,
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(500).json({ error: 'No mail transport configured (set SENDGRID_API_KEY or SMTP_*)' });
  } catch (err) {
    console.error('contact send error', err);
    // return helpful error to client for debugging (not revealing secrets)
    return res.status(500).json({ error: 'send_failed', detail: err.message || String(err) });
  }
};
