const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
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
