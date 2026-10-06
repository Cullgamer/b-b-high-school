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
  const {studentId ,secretPin} = JSON.parse(event.body);
  
  const docRef = db.collection('admissionForms').doc(studentId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, message: 'Student not found!' })
            };
        }
const studentData = doc.data();

if (studentData.secretPin !== secretPin) {
    return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: 'Invalid Secret PIN!' })
    };
}


const { secretPin: removedPin, ...safeStudentData } = studentData;

return {
    statusCode: 200,
    body: JSON.stringify({
        success: true,
        data: safeStudentData 
    })
};
}
      