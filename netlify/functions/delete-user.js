const admin = require('firebase-admin');

// Firebase Admin SDK Initialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private key में \n को सही से फॉर्मेट करने के लिए:
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 450, body: 'Method Not Allowed' };
  }

  try {
    const { uid } = JSON.parse(event.body);

    if (!uid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'UID is required' })
      };
    }

    // 🔐 Firebase Auth से यूज़र को परमानेंट डिलीट करें
    await admin.auth().deleteUser(uid);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User deleted from Firebase Auth successfully!' })
    };
  } catch (error) {
    console.error("Auth delete error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
