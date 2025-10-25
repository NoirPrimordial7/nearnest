/* eslint-env node */
"use strict";

// CommonJS is fine:
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// >>> New way: use Functions Secrets (no more functions.config())
const { defineSecret } = require("firebase-functions/params");
const EMAIL_USER = defineSecret("EMAIL_USER");
const EMAIL_PASS = defineSecret("EMAIL_PASS");

admin.initializeApp();
const db = admin.firestore();

const APP_NAME = "NearNest";

// util
function makeCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function sha(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function makeTransport(user, pass) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/**
 * On new auth user -> create Firestore profile + email code
 */
exports.onAuthCreate = functions
  .runWith({ secrets: [EMAIL_USER, EMAIL_PASS] })
  .auth.user()
  .onCreate(async (user) => {
    const uid = user.uid;
    const profileRef = db.collection("users").doc(uid);

    await profileRef.set(
      {
        email: user.email || null,
        phone: user.phoneNumber || null,
        displayName: user.displayName || null,
        status: "pending_email_verification",
        roles: ["user"],
        primaryRole: "user",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // create 6-digit code
    const code = makeCode();
    const hash = sha(code);
    const expires = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 1000 * 60 * 15)
    );

    await profileRef.collection("verification").doc("email").set({
      codeHash: hash,
      expiresAt: expires,
      attempts: 0,
    });

    if (user.email) {
      const transporter = makeTransport(EMAIL_USER.value(), EMAIL_PASS.value());
      await transporter.sendMail({
        from: `${APP_NAME} <${EMAIL_USER.value()}>`,
        to: user.email,
        subject: `${APP_NAME} – Verify your email`,
        html: `
          <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto">
            <h2>${APP_NAME}</h2>
            <p>Your verification code is:</p>
            <p style="font-size:22px;font-weight:800;letter-spacing:8px;">${code}</p>
            <p>This code expires in 15 minutes.</p>
          </div>`,
      });
    }
  });

/**
 * Request a new email code
 */
exports.requestEmailCode = functions
  .runWith({ secrets: [EMAIL_USER, EMAIL_PASS] })
  .https.onCall(async (data, context) => {
    if (!context.auth)
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    const uid = context.auth.uid;

    const profileRef = db.collection("users").doc(uid);
    const u = await admin.auth().getUser(uid);
    if (!u.email)
      throw new functions.https.HttpsError(
        "failed-precondition",
        "No email on account."
      );

    const code = makeCode();
    const hash = sha(code);
    const expires = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 1000 * 60 * 15)
    );

    await profileRef.collection("verification").doc("email").set({
      codeHash: hash,
      expiresAt: expires,
      attempts: 0,
    });

    const transporter = makeTransport(EMAIL_USER.value(), EMAIL_PASS.value());
    await transporter.sendMail({
      from: `${APP_NAME} <${EMAIL_USER.value()}>`,
      to: u.email,
      subject: `${APP_NAME} – New verification code`,
      html: `<p>Your new code:</p>
             <p style="font-size:22px;font-weight:800;letter-spacing:8px;">${code}</p>`,
    });

    return { ok: true };
  });

/**
 * Verify email code
 */
exports.verifyEmailCode = functions.https.onCall(async (data, context) => {
  const code = String(data?.code || "");
  if (!context.auth)
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  if (!/^\d{6}$/.test(code))
    throw new functions.https.HttpsError("invalid-argument", "Invalid code");

  const uid = context.auth.uid;
  const vRef = db.collection("users").doc(uid).collection("verification").doc("email");
  const snap = await vRef.get();
  if (!snap.exists)
    throw new functions.https.HttpsError("failed-precondition", "No request.");
  const v = snap.data();

  const now = admin.firestore.Timestamp.now();
  if (v.expiresAt.toMillis() < now.toMillis())
    throw new functions.https.HttpsError("deadline-exceeded", "Code expired.");

  if (v.attempts >= 6)
    throw new functions.https.HttpsError("resource-exhausted", "Too many attempts.");

  const match = sha(code) === v.codeHash;
  await vRef.update({ attempts: v.attempts + 1 });

  if (!match)
    throw new functions.https.HttpsError("permission-denied", "Wrong code.");

  await admin.auth().updateUser(uid, { emailVerified: true });
  await db.collection("users").doc(uid).update({
    status: "email_verified",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

/**
 * Admin: set user roles and mirror to custom claims
 */
exports.setUserRoles = functions.https.onCall(async (data, context) => {
  const callerUid = context.auth?.uid;
  if (!callerUid)
    throw new functions.https.HttpsError("unauthenticated", "Login required.");

  const caller = await admin.auth().getUser(callerUid);
  const claims = caller.customClaims || {};
  if (!claims.admin)
    throw new functions.https.HttpsError("permission-denied", "Admin only.");

  const { uid, roles } = data || {};
  if (!uid || !Array.isArray(roles))
    throw new functions.https.HttpsError("invalid-argument", "uid & roles required");

  await db.collection("users").doc(uid).update({
    roles,
    primaryRole: roles[0] || "user",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const roleMap = {};
  roles.forEach((r) => (roleMap[r] = true));
  await admin.auth().setCustomUserClaims(uid, { ...roleMap });

  return { ok: true };
});
