const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// HTTP triggered function
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("👋 Hello from Firebase Functions!");
});
