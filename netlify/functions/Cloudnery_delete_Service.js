const cloudnery = require('cloudinary').v2;

exports.handler = async function(event, context){
  if (event.httpMethod !== 'Post'){
     return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
};
try {
  const {publicId , accountName} = JSON.parse(event.body);
  if (!publicId || !accountName){
    return {statusCode: 400, body: JSON.stringify({ error: 'public area account dalna jaruri hai' })};
   }
   let cloudname, apikey, apisecret
   if (accountName === 'schoolCloud1'){
     cloudname = process.env.schoolCloud1_Cloud_Name;
     apikey = process.env.schoolCloud1_API_Key;
     apisecret = process.env.schoolCloud1_API_Secret;
   } 
   else if (accountName === 'schoolCloud2'){
     cloudname = process.env.schoolCloud2_Cloud_Name;
     apikey = process.env.schoolCloud2_API_Key;
     apisecret = process.env.schoolCloud2_API_Secret;
   }  else {
     return{statusCode: 400, body: JSON.stringify({ error: 'account name nahin hai' })
     };
   }
  cloudinary.config({
    cloud_name: cloudname,
    api_key: apikey,
    api_secret: apisecret
  });
  const result = await cloudinary.uploader.destroy(publicId);
  
  return {statusCode: 200, body: JSON.stringify({ error: 'deleted successfully' })
    
  }
} 
catch (e) {
  return {statusCode: 500 ,
  body: JSON.stringify({ error: 'file udane ke liye kuchh error a raha hai', e })}
}