const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');




// Ensure that the environment variable is set correctly
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('Environment variable GOOGLE_APPLICATION_CREDENTIALS is not set');
}

// Resolve the path to the service account key file
const serviceAccountPath = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS);

console.log('Service account path:', serviceAccountPath);

// Check if the file exists at the resolved path
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Service account file not found at path: ${serviceAccountPath}`);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://keytour-b91d0.firebaseio.com"
});

module.exports = admin;