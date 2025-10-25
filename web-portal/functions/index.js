// functions/index.js
require('dotenv').config();

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onCall, setGlobalOptions } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Optional: support legacy functions.config() until March 2026
let legacyConfig = {};
try {
  // eslint-disable-next-line global-require
  const functionsV1 = require('firebase-functions');
  legacyConfig = functionsV1.config ? functionsV1.config() : {};
} catch (_) {
  legacyConfig = {};
}

// Read secrets from .env first (preferred), then legacy config
const EMAIL_USER =
  process.env.EMAIL_USER || legacyConfig.email?.user || '';
const EMAIL_PASS =
  process.env.EMAIL_PASS || legacyConfig.email?.pass || '';

if (!EMAIL_USER || !EMAIL_PASS) {
  logger.warn(
    'Missing EMAIL_USER / EMAIL_PASS. Configure .env or functions:config:set.'
  );
}

initializeApp();

// All functions default to us-central1 + sane limits
setGlobalOptions({
  region: 'us-central1',
  timeoutSeconds: 60,
  memory: '256MiB',
});

// Nodemailer (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Helper: 6-digit numeric code
 */
function createCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Helper: sha256 hash of code (store hash, not the code)
 */
function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Callable: requestEmailCode
 * data: { email: string }
 * auth: must be signed-in
 */
exports.requestEmailCode = onCall(async (req) => {
  const uid = req.auth?.uid;
  const email = (req.data?.email || '').trim().toLowerCase();

  if (!uid) {
    logger.warn('Unauthenticated call to requestEmailCode');
    throw new Error('UNAUTHENTICATED');
  }
  if (!email) {
    throw new Error('INVALID_ARGUMENT: email required');
  }

  const db = getFirestore();
  const userRef = db.collection('users').doc(uid);
  const verRef = userRef.collection('verification').doc('email');

  // Ensure user doc exists (idempotent)
  await userRef.set(
    {
      email,
      roles: ['user'],
      primaryRole: 'user',
      status: 'pending_email_verification',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Make new code + store its hash
  const code = createCode();
  const codeHash = hashCode(code);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  await verRef.set(
    {
      codeHash,
      expiresAt,
      attempts: 0,
    },
    { merge: true }
  );

  // Send email
  if (!EMAIL_USER || !EMAIL_PASS) {
    // Don’t try to send if secrets missing
    logger.error('EMAIL credentials missing; cannot send email');
    throw new Error('EMAIL_NOT_CONFIGURED');
  }

  const mail = {
    from: `NearNest <${EMAIL_USER}>`,
    to: email,
    subject: 'Your NearNest verification code',
    text: `Your code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;font-size:16px">
        <p>Use this code to verify your email:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  };

  await transporter.sendMail(mail);

  logger.info(`Verification code sent to ${email} for uid ${uid}`);
  return { ok: true };
});

/**
 * Callable: verifyEmailCode
 * data: { code: string }
 */
exports.verifyEmailCode = onCall(async (req) => {
  const uid = req.auth?.uid;
  const code = (req.data?.code || '').trim();

  if (!uid) throw new Error('UNAUTHENTICATED');
  if (!/^\d{6}$/.test(code)) throw new Error('INVALID_ARGUMENT: 6-digit code required');

  const db = getFirestore();
  const userRef = db.collection('users').doc(uid);
  const verRef = userRef.collection('verification').doc('email');

  const verSnap = await verRef.get();
  if (!verSnap.exists) throw new Error('NOT_FOUND');

  const ver = verSnap.data();
  const now = Date.now();
  const attemptCount = (ver.attempts || 0) + 1;

  // rate-limit / max attempts
  if (attemptCount > 5) {
    await verRef.delete();
    throw new Error('TOO_MANY_ATTEMPTS');
  }

  // expired?
  if (typeof ver.expiresAt !== 'number' || ver.expiresAt < now) {
    await verRef.delete();
    throw new Error('EXPIRED');
  }

  const matches = hashCode(code) === ver.codeHash;
  if (!matches) {
    await verRef.update({ attempts: attemptCount });
    throw new Error('CODE_MISMATCH');
  }

  // Success: set user active, clear verification doc
  await userRef.set(
    {
      status: 'email_verified',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await verRef.delete();

  logger.info(`Email verified for uid ${uid}`);
  return { ok: true, status: 'email_verified' };
});
