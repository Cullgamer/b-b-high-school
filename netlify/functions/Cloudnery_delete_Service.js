const cloudinary = require('cloudinary').v2;

exports.handler = async function(event, context){
  if (event.httpMethod !== 'POST'){
     return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {

    const { publicId, accountName, resourceType } = JSON.parse(event.body);
    
    if (!publicId || !accountName){
      return { statusCode: 400, body: JSON.stringify({ error: 'public ID aur account name dalna jaruri hai' }) };
    }
    
    let cloudname, apikey, apisecret;
    
    if (accountName === 'schoolCloud1'){
      cloudname = 'xwrqpiq3';
      apikey = process.env.schoolCloud1_API_Key;
      apisecret = process.env.schoolCloud1_API_Secret;
    } 
    else if (accountName === 'schoolCloud2'){
      cloudname = process.env.schoolCloud2_Cloud_Name;
      apikey = process.env.schoolCloud2_API_Key;
      apisecret = process.env.schoolCloud2_API_Secret;
    }  
    else {
      return { statusCode: 400, body: JSON.stringify({ error: 'account name galat hai' }) };
    }

    cloudinary.config({
      cloud_name: cloudname,
      api_key: apikey,
      api_secret: apisecret
    });


    const fileType = resourceType || 'image'; 

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: fileType
    });
    
     return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'deleted successfully', result }) 
    };

  } 
  catch (e) {
    return { 
      statusCode: 500,
      body: JSON.stringify({ error: 'file udane ke liye kuchh error a raha hai', details: e.message }) 
    };
  }
};
