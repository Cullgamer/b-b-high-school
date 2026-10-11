// ☁️ Cloudinary Upload Service with Failover (Backup System)
export async function uploadToCloudinary(file) {
    const cloudAccounts = [
        { name: "schoolCloud1", cloudName: "xwrqpiq3", uploadPreset: "Schoolp" },
        { name: "schoolCloud2", cloudName: "second_cloud_name", uploadPreset: "Schoolp" }
    ];

    let uploadResult = null;
    let successfulAccount = null;


    for (const account of cloudAccounts) {
        try {
            console.log(`Trying to upload on: ${account.name}...`);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", account.uploadPreset);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${account.cloudName}/auto/upload`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error(`${account.name} failed with status ${response.status}`);
            }

            const data = await response.json();
            
              uploadResult = {
                fileUrl: data.secure_url,
                publicId: data.public_id,
                cloudName: account.name,
                resourceType: data.resource_type
            };
            
            successfulAccount = account.name;
            console.log(`Successfully uploaded to ${successfulAccount}!`);
            break; 

        } catch (err) {
            console.warn(`⚠️ ${account.name} par upload fail ho gaya, switching to next cloud... Error:`, err.message);

        }
    }


    if (!uploadResult) {
        throw new Error("Sare cloud accounts full ya down hain! File upload nahi ho payi.");
    }

    return uploadResult;
}
