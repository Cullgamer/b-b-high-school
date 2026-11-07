import { db } from "./firebase-config.js";
import { 
    doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { uploadToCloudinary } from "./cloudinaryService.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Global Auth reference
const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
    // 1. सेटिंग्स / मेनू खोलने वाला बटन (गियर आइकॉन)
    const settingbut = document.createElement("button");
    settingbut.id = "SettingsBtn";
    settingbut.innerHTML = "⚙️";
    settingbut.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10;
        background: #ffffff;
        color: #b83b19;
        border: 2px solid #e2e8f0;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    // 2. साइड से खुलने वाला मेनू ड्रॉर
    const settingd = document.createElement("div");
    settingd.id = "settingD";
    
    settingd.innerHTML = `
        <div class="settings-header">
            <h3>⚙️ सारथी 1.0 - मेनू</h3>
            <button id="closePanelBtn" style="background:none; border:none; color: #fff; font-size:20px; cursor:pointer;">✕</button>
        </div>

        <div class="profile" id="profile_container" style="display: flex; justify-content: center; padding: 10px 0; flex-shrink: 0;">
            <div class="teacher-profile-card" style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px 16px; border-radius: 16px; width: 100%; max-width: 360px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.06); font-family: 'Segoe UI', sans-serif;">
                <div style="display: flex; justify-content: center; margin-bottom: 14px; position: relative; width: fit-content; margin-left: auto; margin-right: auto;">
                    <img id="teacher_logo" src="https://via.placeholder.com/80" 
                         alt="Teacher Profile" 
                         style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #b83b19; background: #f8fafc;"
                         onerror="this.src='https://via.placeholder.com/80';">
                    
                    <button onclick="openEditProfile()" style="position: absolute; bottom: 0; right: 0; background: #b83b19; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.2);" title="Edit Profile">
                        ✏️
                    </button>
                </div>
                
                <h3 id="teacher_name" style="color: #1e293b; margin: 0 0 4px 0; font-size: 17px; font-weight: 700;">
                    लोड हो रहा है...
                </h3>
                <p id="teacher_role" style="color: #64748b; margin: 0 0 16px 0; font-size: 12px; font-weight: 500;">
                    Teacher & Admin
                </p>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="openEditProfile()" style="flex: 1; background: #f1f5f9; color: #334155; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
                        ✏️ Edit Profile
                    </button>
                    <button onclick="logout()" style="flex: 1; background: #fef2f2; color: #dc2626; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
                        🚪 Logout
                    </button>
                </div>
            </div>
        </div>
        
        <div class="cards-container">
            <div class="card-s" onclick="openNotice()">
              <div class="card-s-icon">📢</div>
              <div class="card-s-content">
                  <div class="card-s-title">Notice Board</div>
                  <div class="card-s-desc">View / Upload Notices</div>
              </div>
            </div>

            <div class="card-s" onclick="openAttendance()">
              <div class="card-s-icon">📝</div>
              <div class="card-s-content">
                  <div class="card-s-title">Attendance & Student</div>
                  <div class="card-s-desc">Mark Student Attendance</div>
              </div>
            </div>

            <div class="card-s" onclick="openStudyMaterial()">
              <div class="card-s-icon">📁</div>
              <div class="card-s-content">
                  <div class="card-s-title">Study Material</div>
                  <div class="card-s-desc">Share PDFs / Files</div>
              </div>
            </div>

            <div class="card-s" onclick="openMarks()">
              <div class="card-s-icon">📊</div>
              <div class="card-s-content">
                  <div class="card-s-title">Marks / Results</div>
                  <div class="card-s-desc">Update Student Marks</div>
              </div>
            </div>

            <div class="card-s" onclick="videow()">
              <div class="card-s-icon">🎥</div>
              <div class="card-s-content">
                  <div class="card-s-title">Watch Lectures</div>
                  <div class="card-s-desc">Lectures Video</div>
              </div>
            </div>
            
            <div class="card-s" onclick="videou()">
              <div class="card-s-icon">📤</div>
              <div class="card-s-content">
                  <div class="card-s-title">Upload Video</div>
                  <div class="card-s-desc">Video Uploader & Links</div>
              </div>
            </div>

            <div class="card-s" onclick="calc()">
              <div class="card-s-icon">🧮</div>
              <div class="card-s-content">
                  <div class="card-s-title">Calculator</div>
                  <div class="card-s-desc">Quick Calculations</div>
              </div>
            </div>

            <div class="card-s" onclick="fromview()">
              <div class="card-s-icon">🪪</div>
              <div class="card-s-content">
                  <div class="card-s-title">View Admission Forms</div>
                  <div class="card-s-desc">View Forms</div>
              </div>
            </div>
            
            <div class="card-s" onclick="fromUp()">
              <div class="card-s-icon">📤</div>
              <div class="card-s-content">
                  <div class="card-s-title">Form Uploader</div>
                  <div class="card-s-desc">Form Uploader</div>
              </div>
            </div>
        </div>

        <div class="brand-credit-container">
            <div class="brand-monogram-logo">
                <span class="c-letter">C</span><span class="g-letter">G</span>
            </div>
            <div class="brand-text">
                <span class="brand-title">Cull Gamer</span>
                <span class="brand-subtitle">Developed with ❤️ & Code</span>
            </div>
        </div>
    `;

    settingd.style.cssText = `
        position: fixed; top: 0; right: 0; width: 85%; max-width: 400px; height: 100%;
        background: #0f172a; color: white; padding: 20px; transform: translateX(100%);
        transition: transform 0.4s ease-in-out; z-index: 20; box-sizing: border-box;
        display: flex; flex-direction: column; box-shadow: -2px 0 3px rgba(0,0,0,0.5);
    `;

    // 3. फुल-स्क्रीन एडिट प्रोफाइल ओवरले
    const editDrawer = document.createElement("div");
    editDrawer.id = "editProfileDrawer";
    editDrawer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #ff5722; font-size: 18px;">✏️ Edit Teacher Profile</h3>
            <button id="closeEditDrawer" style="background:none; border:none; color: white; font-size:22px; cursor:pointer;">✕</button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex-grow: 1; align-items: center;">
            
            <div style="position: relative; margin-top: 10px;">
                <img id="edit_preview_img" src="https://via.placeholder.com/100" 
                     style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #b83b19; background: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
                     onerror="this.src='https://via.placeholder.com/100';">
                
                <button type="button" onclick="document.getElementById('logoFileIn').click()" style="position: absolute; bottom: 0; right: 0; background: #ff5722; color: white; border: 2px solid #0f172a; border-radius: 50%; width: 34px; height: 34px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3);" title="Select Image">
                    📷
                </button>
            </div>

            <input type="file" id="logoFileIn" accept="image/*" style="display: none;">

            <div style="width: 100%; display: flex; flex-direction: column; gap: 6px; text-align: left;">
                <label style="font-size: 13px; color: #94a3b8;">Full Name</label>
                <input type="text" id="editFullName" style="padding: 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; font-size: 14px; width: 100%; box-sizing: border-box;">
            </div>
            
            <div style="width: 100%; display: flex; flex-direction: column; gap: 6px; text-align: left;">
                <label style="font-size: 13px; color: #94a3b8;">Subject</label>
                <input type="text" id="editSubject" style="padding: 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; font-size: 14px; width: 100%; box-sizing: border-box;">
            </div>

            <!-- TTS & Voice Settings Section inside Edit Profile -->
            <div style="width: 100%; display: flex; flex-direction: column; gap: 6px; text-align: left; border-top: 1px solid #334155; padding-top: 15px; margin-top: 5px;">
                <label style="font-size: 13px; color: #ff5722; font-weight: bold;">🗣️ TTS Voice Settings</label>
                
                <label style="font-size: 12px; color: #94a3b8;">Voice Gender</label>
                <select id="editGender" style="padding: 10px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; font-size: 14px; width: 100%;">
                    <option value="female">Female (फीमेल)</option>
                    <option value="male">Male (मेल)</option>
                </select>

                <label style="font-size: 12px; color: #94a3b8; margin-top: 5px;">Voice Style / Tone</label>
                <select id="editVoiceSelect" style="padding: 10px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; font-size: 14px; width: 100%;">
                    <option value="">Default Voice</option>
                </select>
            </div>

            <button id="saveProfileBtn" style="width: 100%; background: #b83b19; color: white; border: none; padding: 14px; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 10px; font-size: 15px;">Save Changes</button>
        </div>
    `;

    editDrawer.style.cssText = `
        position: fixed; top: 0; right: 0; width: 100%; height: 100%;
        background: #0f172a; color: white; padding: 20px; transform: translateX(100%);
        transition: transform 0.4s ease-in-out; z-index: 30; box-sizing: border-box;
        display: flex; flex-direction: column; box-shadow: -3px 0 4px rgba(0,0,0,0.7);
    `;

    // CSS Styling
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
        .settings-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px; flex-shrink: 0; }
        .settings-header h3 { margin: 0; font-size: 16px; color: #ff5722; }
        .cards-container { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex-grow: 1; padding-bottom: 20px; }
        .card-s { background: #1e293b; padding: 10px 14px; border-radius: 10px; cursor: pointer; border: 1px solid #334155; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .card-s:active { background: #334155; }
        .card-s-icon { font-size: 20px; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(255, 87, 34, 0.1); border-radius: 8px; }
        .card-s-content { display: flex; flex-direction: column; gap: 2px; }
        .card-s-title { font-size: 14px; font-weight: 600; color: #ffffff; }
        .card-s-desc { font-size: 12px; color: #94a3b8; }
        .brand-credit-container { display: flex; align-items: center; gap: 12px; padding-top: 15px; margin-top: 10px; border-top: 1px solid #334155; flex-shrink: 0; }
        .brand-monogram-logo { width: 36px; height: 36px; background: linear-gradient(135deg, #b83b19, #ff5722); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; color: white; }
        .c-letter { color: #fff; } .g-letter { color: #ffd54f; }
        .brand-text { display: flex; flex-direction: column; }
        .brand-title { font-size: 14px; font-weight: bold; color: #ffffff; }
        .brand-subtitle { font-size: 11px; color: #888888; }
    `;
    document.head.appendChild(styleTag);

    document.body.appendChild(settingbut);
    document.body.appendChild(settingd);
    document.body.appendChild(editDrawer);

    // Load available voices into dropdown
    function loadVoicesIntoDropdown() {
        const voiceSelect = document.getElementById("editVoiceSelect");
        if (!voiceSelect) return;
        const voices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = '<option value="">Default Voice</option>';
        voices.forEach((voice, index) => {
            if (voice.lang.includes('hi') || voice.lang.includes('en')) {
                const option = document.createElement("option");
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            }
        });
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadVoicesIntoDropdown;
        loadVoicesIntoDropdown();
    }

    // Panels open/close logic
    settingbut.onclick = () => { settingd.style.transform = "translateX(0)"; };
    document.getElementById("closePanelBtn").onclick = () => { settingd.style.transform = "translateX(100%)"; };

    window.openEditProfile = () => {
        settingd.style.transform = "translateX(100%)";
        const drawer = document.getElementById("editProfileDrawer");
        if (drawer) { drawer.style.transform = "translateX(0)"; loadVoicesIntoDropdown(); }
    };

    document.getElementById("closeEditDrawer").onclick = () => {
        const drawer = document.getElementById("editProfileDrawer");
        if (drawer) { drawer.style.transform = "translateX(100%)"; }
    };

    let selectedFile = null; 
    const logoFileIn = document.getElementById("logoFileIn");
    if (logoFileIn) {
        logoFileIn.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedFile = file;
                const previewUrl = URL.createObjectURL(file);
                document.getElementById("edit_preview_img").src = previewUrl;
            }
        });
    }

    // Firebase Auth & Data Fetching
    onAuthStateChanged(auth, async (cuser) => {
        if (cuser && cuser.uid) {
            const docreft = doc(db, "teachers", cuser.uid);
            getdatapro(docreft);
        }
    });

    async function getdatapro(docreft) {
        try {
            const profile = await getDoc(docreft);
            if (profile.exists()) {
                let profiledata = profile.data();
                
                document.getElementById("editFullName").value = profiledata.fullName || "";
                document.getElementById("editSubject").value = profiledata.subject || "";
                if (document.getElementById("editGender")) {
                    document.getElementById("editGender").value = profiledata.speechGender || "female";
                }
                if (document.getElementById("editVoiceSelect") && profiledata.speechVoiceName) {
                    document.getElementById("editVoiceSelect").value = profiledata.speechVoiceName;
                }

                if (profiledata.logo) {
                    document.getElementById("edit_preview_img").src = profiledata.logo;
                }

                const profileContainer = document.getElementById("profile_container");
                if (profileContainer) {
                    profileContainer.innerHTML = `
                    <div class="teacher-profile-card" style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px 16px; border-radius: 16px; width: 100%; max-width: 360px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.06); font-family: 'Segoe UI', sans-serif;">
                        <div style="display: flex; justify-content: center; margin-bottom: 14px; position: relative; width: fit-content; margin-left: auto; margin-right: auto;">
                            <img id="teacher_logo" src="${profiledata.logo || 'https://via.placeholder.com/80'}"
                                 alt="Teacher Profile" 
                                 style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #b83b19; background: #f8fafc;"
                                 onerror="this.src='https://via.placeholder.com/80';">
                            
                            <button onclick="openEditProfile()" style="position: absolute; bottom: 0; right: 0; background: #b83b19; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.2);" title="Edit Profile">
                                ✏️
                            </button>
                        </div>
                        <h3 id="teacher_name" style="color: #1e293b; margin: 0 0 4px 0; font-size: 17px; font-weight: 700;">
                            ${profiledata.fullName || "अमित शर्मा"}
                        </h3>
                        <p style="color: #64748b; margin: 0 0 16px 0; font-size: 12px; font-weight: 500;">
                            Subject: ${profiledata.subject || 'N/A'} | Role: ${profiledata.role || 'Teacher'}
                        </p>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="openEditProfile()" style="flex: 1; background: #f1f5f9; color: #334155; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
                                ✏️ Edit Profile
                            </button>
                            <button onclick="logout()" style="flex: 1; background: #fef2f2; color: #dc2626; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
                                🚪 Logout
                            </button>
                        </div>
                    </div>`;
                }
            }
        } catch (err) {
            console.error("Error fetching profile data:", err);
        }
    }

    // Save Changes Button Logic
    document.getElementById("saveProfileBtn").onclick = async () => {
        const cuser = auth.currentUser;
        if (!cuser) {
            Swal.fire('Error', 'User not authenticated!', 'error');
            return;
        }

        const docreft = doc(db, "teachers", cuser.uid);
        const newName = document.getElementById("editFullName").value;
        const newSubject = document.getElementById("editSubject").value;
        const newGender = document.getElementById("editGender").value;
        const newVoiceName = document.getElementById("editVoiceSelect").value;

        // Auto pitch and rate calculation based on gender
        const newPitch = newGender === 'male' ? 0.8 : 1.4;
        const newRate = 1.05;

        let finalLogo = "";
        let finalResourceType = "";
        let finalPublicid = "";
        let finalCloudName = "";

        let pPublicid = "";
        let pcloudName = "";
        let dataurl = "";

        try {
            const datap = await getDoc(docreft);
            if (datap.exists()) {
                let dataf = datap.data();
                finalLogo = dataf.logo || "";
                finalResourceType = dataf.resourceType || "";
                finalPublicid = dataf.Publicid || "";
                finalCloudName = dataf.cloudName || "";
                
                dataurl = dataf.logo || "";
                pPublicid = dataf.Publicid || "";
                pcloudName = dataf.cloudName || "";
                let presourceType = dataf.resourceType || "";

                if (selectedFile) {
                    Swal.fire({ title: 'Uploading photo...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    const uploadResult = await uploadToCloudinary(selectedFile);
                    
                    if (uploadResult) {
                        finalLogo = uploadResult.fileUrl || uploadResult.secure_url;
                        finalResourceType = uploadResult.resourceType || "image";
                        finalPublicid = uploadResult.Publicid || uploadResult.public_id || "";
                        finalCloudName = uploadResult.cloudName || "";
                    }
                }

                if (selectedFile && dataurl.trim() !== "" && pPublicid) {
                    console.log("delete function activate for photo");
                    cloudinaryDelete(pPublicid, pcloudName, presourceType);
                }
            }
        } catch (e) {
            console.error("Error during fetch/upload process:", e);
        }

        try {
            await updateDoc(docreft, {
                fullName: newName,
                subject: newSubject,
                logo: finalLogo,
                resourceType: finalResourceType,
                Publicid: finalPublicid,
                cloudName: finalCloudName,
                speechGender: newGender,
                speechVoiceName: newVoiceName,
                speechPitch: newPitch,
                speechRate: newRate
            });
            Swal.fire('Success', 'Profile and TTS settings updated successfully!', 'success');
            document.getElementById("editProfileDrawer").style.transform = "translateX(100%)";
            selectedFile = null;
            getdatapro(docreft);
        } catch (error) {
            Swal.fire('Error', 'Failed to update profile.', 'error');
            console.error(error);
        }
    };
});

// Global Logout Function
window.logout = async function() {
    const confirmLogout = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b83b19',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Log out!',
      cancelButtonText: 'Cancel'
    });

    if (confirmLogout.isConfirmed) {
      await signOut(auth);
      window.location.href = "index.html";
    }
};


async function verifySessionOnLoad() {
    function getCurrentUserUid() {
    return new Promise((resolve, reject) => {
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user && user.uid) {
                resolve(user.uid);
            } else {
                resolve(null);
            }
        }, (error) => {
            reject(error);
        });
    });
}
    const lastChecked = sessionStorage.getItem('lastTokenCheck');
    const currentTime = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;


    if (lastChecked && (currentTime - lastChecked < ONE_HOUR)) {
        console.log("Session already verified recently. Skipping backend call.");
        return; 
    }

    const userid = await getCurrentUserUid()
    if (!userid) {
    window.location.href = '/indexk.html'
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/token-maker-checker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: userid })
});

const result = await response.json();

if (!response.ok || !result.success) {
    alert("Session expired. Please login again.");
    setTimeout(() => {
        window.location.href = "/login.html";
    }, 1500);
}
 else {

            sessionStorage.setItem('lastTokenCheck', currentTime);
        }
    } catch (err) {
        console.error("Network or server error:", err);
    }
}


verifySessionOnLoad();


async function cloudinaryDelete(publicId, accountName, resourceType) {
    try {
        const response = await fetch('/.netlify/functions/Cloudnery_delete_Service', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId, accountName, resourceType })
        });
        const data = await response.json();
        console.log("Server ka jawab:", data);
    } catch (err) {
        console.error("Request fail ho gayi:", err);
    }
}

// Navigation Links
window.calc = () => window.location.href = "calculator.html";
window.openNotice = () => window.location.href = "notice.html";
window.videow = () => window.location.href = "video-view.html";
window.videou = () => window.location.href = "video.html";
window.fromview = () => window.location.href = "viewaddmissions.html";
window.fromUp = () => window.location.href = "admission.html";
window.openAttendance = () => window.location.href = "student_m.html";
window.openStudyMaterial = () => window.location.href = "files.html";
window.openMarks = () => window.location.href = "marks.html";
