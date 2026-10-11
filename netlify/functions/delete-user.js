const admin = require('firebase-admin');


function getPrivateKey() {
  let rawKey = process.env.FIREBASE_PRIVATE_KEY_B64 || '';

  console.log("Client Email Check:", process.env.FIREBASE_CLIENT_EMAIL);
  console.log("Private Key Length:", process.env.FIREBASE_PRIVATE_KEY_B64 ? process.env.FIREBASE_PRIVATE_KEY_B64.length : "MISSING!");

  rawKey = rawKey.trim().replace(/^["']|["']$/g, ''); 

  if (!rawKey) return undefined;

  try {
    let decoded = Buffer.from(rawKey, 'base64').toString('utf8');
    decoded = decoded.replace(/\\n/g, '\n');
    return decoded;
  } catch (err) {
    console.error("Private key decoding error:", err);
    return undefined;
  }
}

// Firebase Admin SDK Initialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || "bb-high-school-portal",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey()
    })
  });
}

exports.handler = async (event) => {

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { uid } = JSON.parse(event.body);

    if (!uid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'UID is required' })
      };
    }


    await admin.auth().deleteUser(uid);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'User deleted from Firebase Auth successfully!' 
      })
    };
  } catch (error) {
    console.error("Auth delete error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
