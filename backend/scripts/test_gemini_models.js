const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './backend/.env' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found in .env");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("🔍 Fetching available models...");
        // The listModels method might not be directly on genAI in all versions, 
        // but let's try to find it or use an alternative way if possible.
        // Actually, the SDK might not expose listModels directly.
        // Let's try to send a test message to 'gemini-pro' as a fallback.
        
        const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
        
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("Hi");
                console.log(`✅ Model '${m}' is working!`);
                process.exit(0);
            } catch (e) {
                console.log(`❌ Model '${m}' failed: ${e.message}`);
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
