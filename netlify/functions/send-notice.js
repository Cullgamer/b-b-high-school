const admin = require('firebase-admin');
let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY_B64 || '';
rawPrivateKey = rawPrivateKey.trim().replace(/^["']|["']$/g, ''); 

const privateKey = rawPrivateKey
  ? Buffer.from(rawPrivateKey, 'base64').toString('utf8')
  : undefined;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "bb-high-school-portal", 
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    })
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, body } = JSON.parse(event.body);

    // 1. Firestore 
    const tokensSnap = await db.collection('fcm_tokens').get();
    
    if (tokensSnap.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No registered tokens found." }),
      };
    }

    const tokens = tokensSnap.docs.map(doc => doc.id);

  
    const message = {
      notification: {
        title: "📢 " + (title || "School Notice"),
        body: body || "New notice uploaded!"
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          priority: "high",
          channelId: "high_importance_channel"
        }
      },
      data: {
        title: title || "New Notice",
        body: body || "Check student portal"
      },
      tokens: tokens
    };


    const response = await admin.messaging().sendEachForMulticast(message);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        successCount: response.successCount,
        failureCount: response.failureCount 
      }),
    };
  } catch (error) {
    console.error("FCM Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
