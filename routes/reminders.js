const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { Resend } = require('resend');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/send', async (req, res) => {
  const { name, amount, phone, email, dueDate } = req.body;

  if (!name || !amount) {
    return res.status(400).json({ error: 'name and amount are required.' });
  }

  const message = `Hi ${name}, just a friendly reminder that you have a pending amount of ₹${amount} due by ${dueDate}. Please let me know if you need any help. — Lendr`;

  const results = { sms: 'skipped', whatsapp: 'skipped', email: 'skipped' };
  const errors = [];

  // ── SMS ──────────────────────────────────────────────
  if (phone) {
    try {
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      results.sms = 'sent';
    } catch (err) {
      errors.push(`SMS: ${err.message}`);
      results.sms = 'failed';
    }
  }

  // ── WhatsApp ─────────────────────────────────────────
  if (phone) {
    try {
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${phone}`,
      });
      results.whatsapp = 'sent';
    } catch (err) {
      errors.push(`WhatsApp: ${err.message}`);
      results.whatsapp = 'failed';
    }
  }

  // ── Email ─────────────────────────────────────────────
  if (email) {
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: `Payment reminder — ₹${amount} due on ${dueDate}`,
        html: `
          <div style="font-family:monospace;max-width:520px;margin:40px auto;color:#1a1a1a;padding:0 20px;">
            <h2 style="font-family:Georgia,serif;font-size:24px;margin-bottom:4px;">Payment Reminder</h2>
            <p style="color:#aaa;font-size:11px;letter-spacing:0.1em;margin-bottom:36px;">via Lendr</p>
            <p style="font-size:15px;line-height:1.8;color:#333;">
              Hi <strong>${name}</strong>,<br/><br/>
              Just a friendly reminder that you have a pending amount of
              <strong style="color:#c09a3a;">₹${amount}</strong>
              due by <strong>${dueDate}</strong>.<br/><br/>
              Please let me know if you need any help or need to discuss repayment.
            </p>
            <div style="margin:36px 0;padding:20px;background:#f5f2ee;border-left:3px solid #c09a3a;">
              <p style="margin:0;font-size:13px;color:#666;">Amount due: <strong style="color:#1a1a1a;">₹${amount}</strong></p>
              <p style="margin:6px 0 0;font-size:13px;color:#666;">Due date: <strong style="color:#1a1a1a;">${dueDate}</strong></p>
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0;"/>
            <p style="font-size:11px;color:#bbb;">Sent via Lendr · Reply to this email to respond</p>
          </div>
        `,
      });
      results.email = 'sent';
    } catch (err) {
      errors.push(`Email: ${err.message}`);
      results.email = 'failed';
    }
  }

  res.json({ success: errors.length === 0, results, errors });
});

module.exports = router;

// ── VERIFY: Send OTP ─────────────────────────────────
router.post('/verify/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required.' });

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: phone, channel: 'sms' });

    res.json({ success: true, status: verification.status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── VERIFY: Check OTP ────────────────────────────────
router.post('/verify/check', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Phone and code required.' });

  try {
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: phone, code });

    if (result.status === 'approved') {
      res.json({ success: true, verified: true });
    } else {
      res.json({ success: false, verified: false, error: 'Incorrect code.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
