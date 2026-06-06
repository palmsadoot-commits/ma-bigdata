const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testDirect() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        console.log("🚀 Testing direct API call to gemini-1.5-flash (v1)...");
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hi" }] }]
        });
        console.log("✅ Success! Response:", JSON.stringify(response.data.candidates[0].content.parts[0].text));
    } catch (error) {
        console.error("❌ Direct call failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testDirect();
