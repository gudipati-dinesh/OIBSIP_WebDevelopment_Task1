const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendMail, mailConfigured } = require('../utils/mailer');

const CLIENT = () => process.env.CLIENT_URL || 'http://localhost:5173';
const sign = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || '');

async function sendVerification(user) {
  const link = `${CLIENT()}/verify-email/${user.verifyToken}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your email to start ordering',
    text: `Hi ${user.name}, verify your email: ${link}`,
    html: `<div style="font-family:Arial"><h2>Welcome to Slice 🍕</h2><p>Hi ${user.name}, confirm your email to start ordering.</p>
           <p><a href="${link}" style="background:#e23744;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none">Verify email</a></p>
           <p style="color:#888">Or paste this link: ${link}</p></div>`,
  });
  return link;
}

// Register (always a customer — admins can never be created here)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !emailOk(email) || !password || password.length < 6)
      return res.status(400).json({ message: 'Enter your name, a valid email and a password of at least 6 characters' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'An account with this email already exists' });
    const user = await User.create({
      name, email, password: await bcrypt.hash(password, 10),
      role: 'user', verifyToken: crypto.randomBytes(24).toString('hex'),
    });
    const link = await sendVerification(user);
    res.status(201).json({
      message: 'Account created. Check your email for the verification link.',
      devLink: mailConfigured ? undefined : link, // shown in UI only when SMTP is not configured
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/verify-email/:token', async (req, res) => {
  const user = await User.findOne({ verifyToken: req.params.token });
  if (!user) return res.status(400).json({ message: 'This verification link is invalid or expired' });
  user.isVerified = true; await user.save();
  res.json({ message: 'Email verified. You can log in now.' });
});

router.post('/resend-verification', async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase(), role: 'user' });
  let link;
  if (user && !user.isVerified) link = await sendVerification(user);
  res.json({ message: 'If the account exists, a new link has been sent.', devLink: mailConfigured ? undefined : link });
});

// Customer login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(401).json({ message: 'Incorrect email or password' });
  if (user.role === 'admin') return res.status(403).json({ message: 'Admins must sign in from the admin portal' });
  if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first', needsVerification: true });
  res.json({ token: sign(user), user: pub(user) });
});

// Admin login (separate endpoint, separate page)
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase(), role: 'admin' });
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(401).json({ message: 'Incorrect admin credentials' });
  res.json({ token: sign(user), user: pub(user) });
});

router.post('/forgot-password', async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase(), role: 'user' });
  let devLink;
  if (user) {
    const raw = crypto.randomBytes(24).toString('hex');
    user.resetToken = sha(raw); user.resetExpires = Date.now() + 3600 * 1000; await user.save();
    const link = `${CLIENT()}/reset-password/${raw}`;
    await sendMail({
      to: user.email, subject: 'Reset your password',
      text: `Reset your password (valid 1 hour): ${link}`,
      html: `<div style="font-family:Arial"><h2>Reset your password</h2><p>This link works for 1 hour.</p>
             <p><a href="${link}" style="background:#e23744;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none">Choose a new password</a></p>
             <p style="color:#888">${link}</p></div>`,
    });
    if (!mailConfigured) devLink = link;
  }
  res.json({ message: 'If that email is registered, a reset link is on its way.', devLink });
});

router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const user = await User.findOne({ resetToken: sha(req.params.token), resetExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' });
  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined; user.resetExpires = undefined; await user.save();
  res.json({ message: 'Password updated. You can log in now.' });
});

router.get('/me', protect, (req, res) => res.json({ user: pub(req.user) }));

module.exports = router;
