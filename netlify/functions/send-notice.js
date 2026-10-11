const admin = require('firebase-admin');

function getPrivateKey() {
  let rawKey = process.env.FIREBASE_PRIVATE_KEY_B64 || '';
  // एक्स्ट्रा कोट्स और स्पेसेस हटाओ
  console.log("Client Email Check:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("Private Key Length:", process.env.FIREBASE_PRIVATE_KEY_B64 ? process.env.FIREBASE_PRIVATE_KEY_B64.length : "MISSING!");
  
  rawKey = rawKey.trim().replace(/^["']|["']$/g, ''); 

  if (!rawKey) return undefined;

  try {
    // पहले Base64 डिकोड करो
    let decoded = Buffer.from(rawKey, 'base64').toString('utf8');
    
    // अगर की के अंदर लिटरल '\n' (backslash + n) रह गया हो, तो उसे असली न्यू-लाइन में बदलो
    decoded = decoded.replace(/\\n/g, '\n');
    
    return decoded;
  } catch (err) {
    console.error("Private key decoding error:", err);
    return undefined;
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "bb-high-school-portal", 
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey()
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

    // 1. Firestore के 'fcm_tokens' से सभी डिवाइस टोकन प्राप्त करें
    const tokensSnap = await db.collection('fcm_tokens').get();
    
    if (tokensSnap.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No registered tokens found." }),
      };
    }

    const tokens = tokensSnap.docs.map(doc => doc.id);

    // 2. High Priority + Android Channel Payload तैयार करें
    const message = {
      notification: {
        title: "📢 " + (title || "School Notice"),
        body: body || "New notice uploaded!"
      },
      // 🔥 APK (Android) को बंद ऐप में नोटिफिकेशन जगाने के लिए सेटिंग्स
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
      tokens: tokens // सभी डिवाइस टोकन्स
    };

    // 3. सभी डिवाइसेस पर नोटिफिकेशन भेजें
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
