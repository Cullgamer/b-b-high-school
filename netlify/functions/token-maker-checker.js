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

async function getUserdata(uid) {
  const doc = await db.collection('teachers').doc(uid).get();
  return doc.exists ? doc.data() : null;
}

async function validateToken(uid) {
  const tokenDoc = await db.collection('Tokens').doc(uid).get();
  
  if (!tokenDoc.exists) {
    console.log("Token not found!");
    tokenMaker(uid);
    return { valid: false, message: "Token missing" };
  } 

  const tokenData = tokenDoc.data();
  const tokenTimestamp = tokenData.createdAt; 

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  const tokenTime = typeof tokenTimestamp === 'number' ? tokenTimestamp : (tokenTimestamp.toMillis ? tokenTimestamp.toMillis() : new Date(tokenTimestamp).getTime());
  const currentTime = Date.now();

  if ((currentTime - tokenTime) > TWENTY_FOUR_HOURS) {
    console.log("Token expired!");
    tokenMaker(uid);
    return { valid: false, message: "Token Expired" };
  }


  const userData = await getUserdata(uid);
  
  if (!userData) {
    return { valid: false, message: "User not found in database" };
  }

  if (userData.token !== tokenData.token) {
    console.log("Token mismatch!");
    tokenMaker(uid);
    return { valid: false, message: "Token does not match" };
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
  let admin = null;
  const roleref = await db.collection('role').doc(uid).get();
  if (!roleref.exists){
    await db.collection('role').doc(uid).set({
      role: 'teacher'
    })
  } else {
   const role =  roleref.data();
   const currentrole = role.role;
   if (currentrole === "admin"){
     admin = code;
   }
  }

  await db.collection('teachers').doc(uid).set({
    token: code
  }, { merge: true }); 

  await db.collection('Tokens').doc(uid).set({
    token: code,
    admintoken: admin,
    createdAt: Date.now()
  });

  return code;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { uid } = JSON.parse(event.body);

    if (!uid) {
      return { statusCode: 400, body: JSON.stringify({ error: 'UID is required' }) };
    }

    const authResult = await validateToken(uid);

    if (!authResult.valid) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ success: false, message: authResult.message }) 
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Token verified successfully!', 
        data: authResult.userData 
      })
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
