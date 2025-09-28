// smartpass-backend/firebase.js

const admin = require('firebase-admin');
require('dotenv').config();

// Parse the private key from the .env file format

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'); 

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  console.log('Firebase Admin SDK Initialized Successfully.');
} catch (error) {
  // Catch error if app is already initialized (e.g., in hot-reloading)
  if (!/already exists/.test(error.message)) {
    console.error('Firebase initialization error:', error.stack);
  }
}

const db = admin.firestore();

// Export the database instance for use in our server logic
module.exports = { db };