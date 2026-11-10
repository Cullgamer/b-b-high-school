exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const apiKey = process.env.Gemini_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API Key is missing in environment variables!' }) };
    }

    const { contentsPayload, SYSTEM_PROMPT, model } = JSON.parse(event.body || '{}');

    if (!SYSTEM_PROMPT || !model) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'System instruction aur model hona jaruri hai!' }) 
      };
    }

    // Google Gemini API Call
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: contentsPayload 
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return {
        statusCode: apiResponse.status,
        body: JSON.stringify({ error: data.error?.message || 'Gemini API Error' })
      };
    }


    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: data
      })
    };

  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
