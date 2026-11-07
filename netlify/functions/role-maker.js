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
const {uid} = JSON.parse(event.body);
const docreft = db.collection('role').doc(uid);
await docreft.set({
  role: "teacher",
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});
return {
  statusCode: 200,
  body: JSON.stringify({
    status: "success",
    message: "Default role assigned successfully."
  })
};

}catch (error){
  console.error("Role Maker Error:", error)
}
return {
  statusCode: 500,
  body: JSON.stringify({
    status: "error",
    message: "Internal Server Error",
    error: error.message
  })
};
 }
