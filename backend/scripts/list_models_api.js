const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function listAllModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

    try {
        console.log("🚀 Fetching all available models from /v1/models...");
        const response = await axios.get(url);
        console.log("✅ Models found:");
        response.data.models.forEach(m => {
            console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
        });
    } catch (error) {
        console.error("❌ Failed to list models!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data));
        } else {
            console.error("Error:", error.message);
        }
    }
}

listAllModels();
