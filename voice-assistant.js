import { db } from "./firebase-config.js";
import { 
    addDoc, serverTimestamp, doc, setDoc, collection, query, orderBy, where, getDocs, onSnapshot,getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
const auth = getAuth();
let subC = JSON.parse(localStorage.getItem("Aicommand")) || null;
console.log(subC)
let subCo = subC?.data?.subCommand;
if (subCo){
    subcommand(subCo);
}

let username = "";
let userrole = "";
let userstatus = "";
let userfreeid = "";

onAuthStateChanged(auth, async (user) => {
    if (user) {
      userfreeid = user.uid
            const q = query(collection(db, "teachers"), where("uid", "==", user.uid));
        onSnapshot(q,async(querySnap) => {
        if (!querySnap.empty) {
          const teacherData = querySnap.docs[0].data();
          
          username = teacherData.fullName;
          userrole = teacherData.role;
          userstatus = teacherData.status
          
            
        }
          
  });
    }
})


// 1. पेज लोड होते ही स्क्रीन पर फ्लोटिंग माइक बटन बनाना
document.addEventListener("DOMContentLoaded", () => {
    const micButton = document.createElement("button");
    micButton.id = "globalVoiceMicBtn";
    micButton.innerHTML = "🎤 Speak...";
    micButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 20px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    `;

    // बटन क्लिक होने पर स्पीच-टू-टेक्स्ट चालू होगा
    micButton.onclick = startSpeechToText;
    document.body.appendChild(micButton);
});

// 2. Speech-to-Text (Voice Recognition) फंक्शन
function startSpeechToText() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("आपका ब्राउज़र वॉइस रिकग्निशन सपोर्ट नहीं करता है।");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const micBtn = document.getElementById("globalVoiceMicBtn");
    micBtn.innerHTML = "🎙️ listening...";
    micBtn.style.backgroundColor = "#dc3545";

    recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        

        micBtn.innerHTML = "🎤 Speak...";
        micBtn.style.backgroundColor = "#007bff";

        const inputBox = document.getElementById("userMessage");
        if (inputBox) {
            inputBox.value = spokenText;
        }

        // सीधे AI को प्रॉम्प्ट भेजें
        sendPrompt(spokenText); 
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        micBtn.innerHTML = "🎤 Speak...";
        micBtn.style.backgroundColor = "#007bff";
    };

    recognition.onend = () => {
        micBtn.innerHTML = "🎤 Speak...";
        micBtn.style.backgroundColor = "#007bff";
    };

    recognition.start();
}

// 3. AI API कॉल और रिस्पॉन्स हैंडलर
 export async function sendPrompt(promptai) {
    const prompt = promptai;


    if (!prompt) {
        alert("कृपया संदेश भरें!");
        return;
    }

    // स्वीट अलर्ट (Loading Indicator)
    Swal.fire({
      title: 'Ai',
      text: 'सोच रही हूँ...',
      confirmButtonColor: '#b83b19',
      confirmButtonText: 'Cancel'
    });

    // 🎯 आधिकारिक एवं सबसे उच्च कैपेसिटी वाले Gemini मॉडल्स (Line-by-Line Fallback Chain)
    const models = [
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'gemini-3-flash'
    ];

    // स्क्रीन का कॉन्टेक्स्ट निकालो
    const pageContext = getPageContext();
    console.log("Current Page Context:", pageContext);

    // 🧠 सारथी 1.0 का पूरा सिस्टम प्रॉम्प्ट
    const SYSTEM_PROMPT = `You are a School Web App AI. Your name is Sarthi 1.0. Return ONLY raw JSON (no markdown).

User details:
- User Name: '${username}'
- User Role: '${userrole}'
- User Status: '${userstatus}'

CURRENT PAGE CONTEXT:
- Page Title: '${pageContext.pageTitle}'
- File Name: '${pageContext.fileName}'
- Available Buttons on Screen: ${JSON.stringify(pageContext.availableButtons)}
- Page Headings: ${JSON.stringify(pageContext.pageHeadings)}
- Cards / Data Visible on Screen: ${JSON.stringify(pageContext.cardsOnScreen)}  

PERSONALIZATION & SECURITY RULES:
- If User Name is 'Rohan', always address the user as "Owner" respectfully in chat replies.
- IF userstatus is 'pending': DO NOT execute ANY command. Reply via "chat": "Aapka account abhi pending hai, kripya approval ka intzar karein."

COMMAND RULES:
1. GET_STUDENT_DATA:
   - If direct Student ID is available, return data: { "studentId": "ID" }.
   - If ID is missing, pass available details like name, dob, motherName.
   - If DOB/Mother's Name is not provided, ask the user in chat text to provide DOB or Mother's Name.
2. UPLOAD_NOTICE: Extract title and description. If missing, ask the user for details first.
3. NAVIGATION COMMANDS: OPEN_PRINCIPAL_DASHBOARD, OPEN_TEACHER_DASHBOARD, OPEN_ADMISSIONFROM, VIEW_NOTICE, VIEW_ADMISSION_FORM, STUDENT_MANAGEMENT.

OUTPUT FORMAT (JSON ONLY):
{
  "type": "chat" | "command",
  "reply": "Text response for user if type is chat",
  "intent": "COMMAND_NAME",
  "data": { ... }
}
/*
=====================================================
NESTED SUB-COMMAND ARCHITECTURE RULES
=====================================================
1. Whenever a request involves multiple or chained actions, use a nested sub-command structure.
2. Structure format:
   - Each layer MUST have an 'intent' and a 'data' object.
   - If there is a next action to perform after the current intent, put it inside 'data.subCommand'.
   
JSON OUTPUT SCHEMA:
{
  "type": "command",
  "intent": "PRIMARY_INTENT_NAME",
  "data": {
    "key1": "value1",
    "subCommand": {
      "intent": "NEXT_SUB_INTENT_NAME",
      "data": {
        "key2": "value2",
        "subCommand": {
          "intent": "DEEPER_SUB_INTENT_NAME",
          "data": { ... }
        }
      }
    }
  }
}

3. For GET_STUDENT_DATA specifically:
   - If Student ID is directly available:
     "intent": "GET_STUDENT_DATA", "data": { "studentId": "stu_101", "subCommand": { ... } }
   - If Student ID is missing but details (Name, DOB, Mother's Name) are present:
     "intent": "GET_STUDENT_DATA", "data": { "name": "Rahul", "dob": "2010-05-12", "subCommand": { ... } }
   - If critical search details are missing, DO NOT send a command; ask the user in 'reply' for DOB/Mother's name.
*/
/*
=====================================================
UPDATED NAVIGATION & AUTO-FILL WORKFLOW RULES
=====================================================
1. NAVIGATION & FORM FILLING CHECK:
   - Always check the "Current Page Context" provided in the prompt.
   - IF the user is NOT on the Admission Form page (i.e., filename is not admission/admission form):
     * Primary Intent MUST be: "OPEN_ADMISSIONFROM"
     * The actual form-filling data MUST be placed inside 'data.subCommand' with intent "AUTO_FILL_FORM".
   - IF the user IS already on the Admission Form page:
     * Primary Intent can directly be: "AUTO_FILL_FORM".

2. EXACT KEYS MAPPING FOR "AUTO_FILL_FORM":
   - "studentn"          -> Student Full Name (Required)
   - "mothern"           -> Mother's Name (Required)
   - "BOD"               -> Date of Birth (Required, e.g., "18/01/2010")
   - "st"                -> Class value: "8", "9", or "10" (Required)
   - "studentId"         -> Aadhaar / Apaar / Student ID
   - "guardian"          -> Father's / Guardian's Name
   - "Mobilenum"         -> 10-digit Contact Number
   - "datetoday"         -> Today's Date
   - "nationalityLang"   -> Nationality & Language (e.g., "Indian, Marathi")
   - "casteDetails"      -> Caste details (e.g., "OBC")
   - "birthPlace"        -> Place of birth
   - "address"           -> Full address
   - "leavingDate"       -> Leaving date
   - "leavingReason"     -> Leaving reason

=====================================================
EXAMPLE JSON OUTPUT (When NOT on Admission Page):
=====================================================
{
  "type": "command",
  "intent": "OPEN_ADMISSIONFROM",
  "data": {
    "subCommand": {
      "intent": "AUTO_FILL_FORM",
      "data": {
        "studentn": "Rahul Sharma",
        "mothern": "Sunita Devi",
        "BOD": "15/05/2012",
        "st": "10",
        "Mobilenum": "9876543210"
      }
    }
  }
}
*/`;

    // 📜 1. LocalStorage से चैट हिस्ट्री निकालकर AI Payload (contents) तैयार करना
    let chatHistory = [];
    try {
        chatHistory = JSON.parse(localStorage.getItem("aiCart")) || [];
    } catch (e) {
        chatHistory = [];
    }

    let contentsPayload = [];

    // पुरानी चैट हिस्ट्री को API के Format (role: 'user' / 'model') में स्ट्रक्चर करें
    chatHistory.forEach(chat => {
        if (chat.user) {
            contentsPayload.push({
                role: "user",
                parts: [{ text: chat.user }]
            });
        }
        if (chat.ai) {
            contentsPayload.push({
                role: "model",
                parts: [{ text: chat.ai }]
            });
        }
    });

    // वर्तमान नया प्रॉम्प्ट जोड़े
    contentsPayload.push({
        role: "user",
        parts: [{ text: prompt }]
    });

    let rawText = "";
    let success = false;

    // 🔥 Line-by-Line Model Fallback Execution Loop
    for (const model of models) {
        try {
            console.log(`Trying model: ${model}`);
          // const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
               // method: "POST",
              //  headers: { "Content-Type": "application/json" },
              //  body: JSON.stringify({
                    // system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                 //   contents: contentsPayload 
              //  })
           // });
            const apiResponse =await fetch('/.netlify/functions/gemini-proxy', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
               contentsPayload: contentsPayload,
          SYSTEM_PROMPT:SYSTEM_PROMPT,
                model: model
              
            })
        });
        const result = await apiResponse.json()

            if (!apiResponse.ok) {
                console.warn(`Model ${model} responded with status: ${result.statusCode}`);
                continue;
            }
            
            if (result.data.candidates && result.data.candidates[0]?.content?.parts[0]?.text) {
                rawText = result.data.candidates[0].content.parts[0].text.trim();
                success = true;
                break;
            }
        } catch (err) {
            console.warn(`Model ${model} network/parse error, trying next...`, err);
        }
    }

    Swal.close(); // लोडर बंद करें

    if (!success) {
        Swal.fire({
          title: 'Ai',
          text: 'सभी मॉडल्स का कोटा समाप्त हो चुका है या नेटवर्क त्रुटि आई है। कृपया कुछ समय बाद प्रयास करें।',
          confirmButtonColor: '#b83b19',
          confirmButtonText: 'OK',
        });
        return;
    }
console.log(rawText)
    // 📦 JSON Parsing, Notice Title, LocalStorage & Command Execution
    let noticeTitle = "";
    let parsedData = null;

    try {
        const cleanJsonText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsedData = JSON.parse(cleanJsonText);
console.log(parsedData)
        if (parsedData.reply) {
            noticeTitle = parsedData.reply;
        } else if (parsedData.data && parsedData.data.title) {
            noticeTitle = parsedData.data.title;
        } else if (parsedData.intent) {
            noticeTitle = `Command received: ${parsedData.intent}`;
        } else {
            noticeTitle = "Processing...";
        }
    } catch (e) {
        console.error("JSON Parsing Error:", e);
        noticeTitle = rawText;
    }

    // 🔊 2. AI आवाज़
    if (typeof speakText === "function") {
        speakText(userfreeid,noticeTitle);
    }

    // 💾 3. LocalStorage में चैट हिस्ट्री अपडेट करें (Last 10 messages)
    try {
        chatHistory.push({
            user: prompt,
            ai: noticeTitle
        });

        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(-10);
        }
        localStorage.setItem("aiCart", JSON.stringify(chatHistory));
    } catch (err) {
        console.error("LocalStorage save error:", err);
    }

    // ⚡ 4. कमांड रन करें
    if (parsedData && parsedData.type === "command") {
        if (typeof command === "function") {
            command(parsedData);
        }
    } else {
        localStorage.removeItem('Aicommand');
    }

    // 🔔 5. स्वीट अलर्ट से मैसेज दिखाएँ
    Swal.fire({
      title: 'Ai',
      text: noticeTitle,
      confirmButtonColor: '#b83b19',
      confirmButtonText: 'OK',
    });
}




// 4. Netlify पुश नोटिफिकेशन फंक्शन
async function sendPushNotification(title, desc) {
    try {
      await fetch('/.netlify/functions/send-notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title,
          body: desc
        })
      });
      console.log("Netlify Push Notification Triggered!");
    } catch (err) {
      console.error("Failed to send Netlify push notification:", err);
    }
}

// 5. Firestore में नोटिस सेव करने का शुद्ध फंक्शन (बिना Cloudinary)
async function notice(title, description) {
    const noticeTitle = title;
    const noticeDesc = description;
    
    try {
        // currentTeacherData या फ़ॉलबैक वैल्यूज़
        const teacherName = (typeof currentTeacherData !== 'undefined' && currentTeacherData.fullName) ? currentTeacherData.fullName : "Teacher";
        const teacherId = (typeof currentTeacherData !== 'undefined' && currentTeacherData.teacherId) ? currentTeacherData.teacherId : "SYSTEM";

        // Firestore में डेटा सहेजना
        await addDoc(collection(db, "notices"), {
            title: noticeTitle,
            desc: noticeDesc,
            postedBy: teacherName,
            postedById: teacherId,
            timestamp: serverTimestamp()
        });

        // पुश नोटिफिकेशन ट्रिगर करना
        await sendPushNotification(noticeTitle, noticeDesc);

        Swal.fire({
            title: 'सफलता!',
            text: 'नोटिस सफलतापूर्वक अपलोड हो गया और नोटिफिकेशन भेज दिया गया! 🎉',
            icon: 'success',
            confirmButtonColor: '#b83b19'
        });

        const noticeForm = document.getElementById("noticeForm");
        if (noticeForm) {
            noticeForm.reset();
        }

    } catch (error) {
        console.error("Firestore Upload Error:", error);
    }
} 
 async function command(parsedCommand){
    const check = parsedCommand.intent;
    
                        
                        if (check === "OPEN_PRINCIPAL_DASHBOARD") {
                            localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                            window.location.href = 'principal_home.html';
                        }
                        if (check === "UPLOAD_NOTICE") {
                         await  notice(parsedCommand.data?.title, parsedCommand.data?.description);
                      if (parsedCommand.data.subCommand){     subcommand(parsedCommand.data.subCommand)}
                        }
                if(check === "GET_STUDENT_DATA"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                   const studentData = parsedCommand.data
                    if(studentData && studentData?.studentId) {
                        window.location.href=`detail.html?id=${studentData.studentId}`
                    }
                 else if (studentData && studentData?.name){
                        
                    }
                    
                }
                if(check === "OPEN_TEACHER_DASHBOARD"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                    window.location.href='teacher_home.html';
                }
                if(check === "OPEN_ADMISSIONFROM"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                    window.location.href='admission.html';
                }
                if(check === "VIEW_NOTICE"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                    window.location.href='view.html';
                }
                if(check === "VIEW_ADMISSION_FORM"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                    window.location.href='viewaddmissions.html';
                }if(check === "STUDENT_MANAGEMENT"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                    window.location.href='student_m.html';
                }
                if(check === "AUTO_FILL_FORM")
                { console.log("command ko activate kar diya hai")
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                   await autofill(parsedCommand.data);
                }
}
async function subcommand(subCommand){
    let parsedCommand = subCommand;
    while (parsedCommand){
    const check = parsedCommand.intent;
                        
                        if (check === "OPEN_PRINCIPAL_DASHBOARD") {
                            localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                            window.location.href = 'principal_home.html';
                        }
                        if (check === "UPLOAD_NOTICE") {
                          await  notice(parsedCommand.data?.title, parsedCommand.data?.description);
                        }
                if(check === "GET_STUDENT_DATA"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                   const studentData = parsedCommand.data
                    if(studentData && studentData?.studentId) {
                        window.location.href=`detail.html?id=${studentData.studentId}`
                    }
                 else if (studentData && studentData?.name){
                        
                    }
                    
                }
                if(check === "OPEN_TEACHER_DASHBOARD"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                    window.location.href='teacher_home.html';
                }
                if(check === "OPEN_ADMISSIONFROM"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                    window.location.href='admission.html';
                }
                if(check === "VIEW_NOTICE"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                    window.location.href='view.html';
                }
                if(check === "VIEW_ADMISSION_FORM"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                    window.location.href='viewaddmissions.html';
                }if(check === "STUDENT_MANAGEMENT"){
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                    window.location.href='student_m.html';
                }
                if(check === "AUTO_FILL_FORM")
                {
                    localStorage.setItem('Aicommand',JSON.stringify(parsedCommand));
                   await autofill(parsedCommand.data);
                }
    parsedCommand = parsedCommand.data.subCommand;
}
}
function getPageContext() {
    // 1. स्क्रीन पर मौजूद सभी बटन्स और लिंक्स
    const buttons = Array.from(document.querySelectorAll('button, a.btn, input[type="button"], input[type="submit"]'))
        .map(el => el.innerText.trim() || el.value)
        .filter(text => text && text.length > 0);

    // 2. स्क्रीन की मुख्य हेडिंग्स
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
        .map(el => el.innerText.trim())
        .filter(text => text && text.length > 0);

    // 3. 🔥 DYNAMIC CARDS KA DATA (Firestore से आए हुए कार्ड्स और उनकी ID)
    const cards = Array.from(document.querySelectorAll('.card, .class-card, .student-card'))
        .map(card => {

            const cardId = card.getAttribute('data-id') || card.querySelector('[data-id]')?.getAttribute('data-id') || null;
            
            return {
                id: cardId,
                info: card.innerText.replace(/\s+/g, ' ').trim()
            };
        })
        .filter(card => card.info.length > 0); 

    return {
        pageTitle: document.title || "School Web App",
        fileName: window.location.pathname.split("/").pop() || "home.html",
        availableButtons: buttons,
        pageHeadings: headings,
        cardsOnScreen: cards
    };
}
//student form auto fil function start
function autofill(aiData){
    const allinput = document.querySelectorAll(".form-input")
    console.log(allinput);
    
    allinput.forEach(input => {
        let filekey = input.id || input.name;
        if (filekey && aiData[filekey] !== undefined){
            input.value = aiData[filekey];
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(aiData[filekey])
        }
    });
}

// टेक्स्ट-टू-स्पीच फंक्शन (डेटाबेस से सिर्फ सेटिंग्स और बाहर से टेक्स्ट/पिच/रेट)
async function speakText(userId, textToSpeak, customPitch = null, customRate = null) {
    if (!('speechSynthesis' in window)) {
        console.log("Speech synthesis not supported in this browser.");
        return;
    }

    try {
        let finalPitch = customPitch;
        let finalRate = customRate;

        // अगर बाहर से पिच या रेट नहीं भेजा गया है, तो डेटाबेस से चेक कर सकते हैं (ऑप्शनल)
        if (userId && (finalPitch === null || finalRate === null)) {
            const docRef = doc(db, "teachers", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const teacherData = docSnap.data();
                if (finalPitch === null) finalPitch = teacherData.speechPitch || 1.4;
                if (finalRate === null) finalRate = teacherData.speechRate || 1.05;
            }
        }

        // अगर फिर भी वैल्यू न मिले तो डिफ़ॉल्ट सेट कर दो
        finalPitch = finalPitch !== null ? finalPitch : 1.4;
        finalRate = finalRate !== null ? finalRate : 1.05;

        // पुरानी आवाज़ को बंद करो
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'hi-IN'; // भाषा हिंदी सेट है

        utterance.pitch = finalPitch;
        utterance.rate = finalRate;

        const setVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            
            const targetVoice = voices.find(v => {
                const name = v.name.toLowerCase();
                return (v.lang.includes('hi') || v.lang.includes('en')) && 
                       (name.includes('female') || name.includes('natural') || name.includes('heera') || name.includes('google हिन्दी'));
            });

            if (targetVoice) {
                utterance.voice = targetVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length !== 0) {
            setVoice();
        } else {
            window.speechSynthesis.onvoiceschanged = setVoice;
        }

    } catch (error) {
        console.error("Speech synthesis error:", error);
    }
}
