const cron = require('node-cron');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { sendMail } = require('../utils/mailer');

// Finds items below their threshold and emails the admin(s).
// An item is re-alerted only after ALERT_REPEAT_HOURS; restocking resets its timer.
async function checkLowStock() {
  const repeatMs = (Number(process.env.ALERT_REPEAT_HOURS) || 24) * 3600 * 1000;
  const low = await Inventory.find({ $expr: { $lt: ['$quantity', '$threshold'] } });
  const due = low.filter((i) => !i.lastAlertAt || Date.now() - i.lastAlertAt.getTime() > repeatMs);
  if (!due.length) return { alerted: 0 };

  const admins = await User.find({ role: 'admin' }).select('email');
  const to = [process.env.ADMIN_EMAIL, ...admins.map((a) => a.email)].filter(Boolean);
  const recipients = [...new Set(to)].join(',');

  const rows = due.map((i) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.emoji} ${i.name} (${i.category})</td>
     <td style="padding:8px;border-bottom:1px solid #eee;color:#e23744"><b>${i.quantity}</b></td>
     <td style="padding:8px;border-bottom:1px solid #eee">${i.threshold}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif"><h2>⚠️ Low stock alert</h2>
    <p>These items are below their minimum level:</p>
    <table style="border-collapse:collapse"><tr><th align="left">Item</th><th align="left">In stock</th><th align="left">Minimum</th></tr>${rows}</table>
    <p>Log in to the admin dashboard to restock.</p></div>`;
  const text = due.map((i) => `${i.name} (${i.category}): ${i.quantity} left, minimum ${i.threshold}`).join('\n');

  await sendMail({ to: recipients, subject: `Low stock alert: ${due.length} item(s) need restocking`, html, text });
  await Inventory.updateMany({ _id: { $in: due.map((d) => d._id) } }, { lastAlertAt: new Date() });
  console.log(`📉 Low-stock email sent for ${due.length} item(s)`);
  return { alerted: due.length };
}

function startStockCron() {
  const expr = process.env.STOCK_CRON || '*/30 * * * *';
  if (!cron.validate(expr)) return console.error('Invalid STOCK_CRON expression:', expr);
  cron.schedule(expr, () => checkLowStock().catch((e) => console.error('Stock cron error:', e.message)));
  console.log(`⏰ Low-stock job scheduled (${expr})`);
}

module.exports = { checkLowStock, startStockCron };
