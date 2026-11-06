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
      projectId: process.env.FIREBASE_PROJECT_ID || "bb-high-school-portal",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey()
    })
  });
}

const db = admin.firestore();

async function getUserdata(uid) {
  const doc = await db.collection('teachers').doc(uid).get();
  return doc.exists ? doc.data() : null;
}

async function validateToken(uid) {
  const tokenDoc = await db.collection('Tokens').doc(uid).get();
  

  if (!tokenDoc.exists) {
    console.log("Token not found! Generating a new one automatically...");
    const newToken = await tokenMaker(uid);
    const userData = await getUserdata(uid);
    return { valid: true, newToken, userData, message: "Token generated successfully" };
  } 

  const tokenData = tokenDoc.data();
  const tokenTimestamp = tokenData.createdAt; 

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const tokenTime = typeof tokenTimestamp === 'number' ? tokenTimestamp : (tokenTimestamp.toMillis ? tokenTimestamp.toMillis() : new Date(tokenTimestamp).getTime());
  const currentTime = Date.now();

  if ((currentTime - tokenTime) > TWENTY_FOUR_HOURS) {
    console.log("Token expired! Generating a fresh one...");
    const newToken = await tokenMaker(uid);
    const userData = await getUserdata(uid);
    return { valid: true, newToken, userData, message: "Token refreshed due to expiration" };
  }

  const userData = await getUserdata(uid);
  
  if (!userData) {
    return { valid: false, message: "User not found in database" };
  }


  if (userData.token !== tokenData.token) {
    console.log("Token mismatch! Generating a new one...");
    const newToken = await tokenMaker(uid);
    const updatedUserData = await getUserdata(uid);
    return { valid: true, newToken, userData: updatedUserData, message: "Token refreshed due to mismatch" };
  }

  console.log("Token is valid!");
  return { valid: true, userData };
}

async function tokenMaker(uid) {
  const alphabet = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    1, 2, 3, 4, 5
  ];
  
  let code = "B.B.H.S.TOKEN:";
  for (let i = 0; i < 20; i++) {
    const n = Math.floor(Math.random() * alphabet.length);
    code = code + alphabet[n];
  }
  
  let adminTokenVal = null;
  const roleref = await db.collection('role').doc(uid).get();
  
  if (!roleref.exists){
    await db.collection('role').doc(uid).set({
      role: 'teacher'
    });
  } else {
   const roleData = roleref.data();
   if (roleData.role === "admin"){
     adminTokenVal = code;
   }
  }

  await db.collection('teachers').doc(uid).set({
    token: code
  }, { merge: true }); 

  await db.collection('Tokens').doc(uid).set({
    token: code,
    admintoken: adminTokenVal,
    createdAt: Date.now()
  });

  return code;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { uid, userid } = JSON.parse(event.body);

    if (!uid || !userid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Both uid and userid are required' })
      };
    }

    
    const result = await validateToken(userid);

    if (!result.valid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: result.message || 'Unauthorized' })
      };
    }

    
    if (result.userData.role !== 'admin') {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, message: 'Access Denied: Admin only action!' })
      };
    }

    
    await admin.auth().deleteUser(uid);
    await db.collection('role').doc(uid).delete();
    await db.collection('Tokens').doc(uid).delete();

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'User deleted from Firebase Auth and Database successfully!' 
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
