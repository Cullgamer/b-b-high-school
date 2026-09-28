// ☁️ Cloudinary Upload Service
export async function uploadToCloudinary(file) {
    const cloudName = "xwrqpiq3"; 
    const uploadPreset = "Schoolp"; 

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Cloudinary upload failed");
    }

    const data = await response.json();
    
    return {
      fileUrl: data.secure_url,
      publicId: data.public_id,
      cloudName: "schoolCloud1"
    };
}
