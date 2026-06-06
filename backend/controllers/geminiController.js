const db = require('../config/db');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { sysLog } = require('../utils/logger');
const agentTools = require('../utils/agentTools');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// นิยามเครื่องมือที่ Gemini สามารถเรียกใช้ได้
const tools = [
    {
        functionDeclarations: [
            {
                name: "run_command",
                description: "Execute a shell command in the project environment.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        command: { type: "STRING", description: "The shell command to run." }
                    },
                    required: ["command"]
                }
            },
            {
                name: "read_file",
                description: "Read the content of a file from the project directory.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        filePath: { type: "STRING", description: "Relative path to the file." }
                    },
                    required: ["filePath"]
                }
            },
            {
                name: "write_file",
                description: "Write or update a file in the project directory.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        filePath: { type: "STRING", description: "Relative path to the file." },
                        content: { type: "STRING", description: "Content to write." }
                    },
                    required: ["filePath", "content"]
                }
            }
        ]
    }
];

exports.getSessions = async (req, res) => {
    try {
        const [sessions] = await db.query(
            'SELECT * FROM gemini_sessions WHERE user_id = ? AND is_archived = FALSE ORDER BY updated_at DESC',
            [req.user.user_id]
        );
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
};

exports.createSession = async (req, res) => {
    const { title } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO gemini_sessions (user_id, title) VALUES (?, ?)',
            [req.user.user_id, title || 'New Chat Agent']
        );
        res.json({ id: result.insertId, title: title || 'New Chat Agent' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create session' });
    }
};

exports.getMessages = async (req, res) => {
    const { sessionId } = req.params;
    try {
        const [messages] = await db.query(
            'SELECT * FROM gemini_messages WHERE session_id = ? ORDER BY timestamp ASC',
            [sessionId]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

exports.sendMessage = async (req, res) => {
    const { sessionId, message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Gemini API Key not configured' });

    try {
        // 1. บันทึกข้อความ User
        await db.query('INSERT INTO gemini_messages (session_id, role, content) VALUES (?, ?, ?)', [sessionId, 'user', message]);
        await db.query('UPDATE gemini_sessions SET updated_at = NOW() WHERE id = ?', [sessionId]);

        // 2. เรียกใช้ Gemini พร้อม Tools
        const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({ model: modelName, tools });

        const [historyRows] = await db.query(
            'SELECT role, content FROM gemini_messages WHERE session_id = ? ORDER BY timestamp ASC',
            [sessionId]
        );

        const chat = model.startChat({
            history: historyRows.slice(0, -1).map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }],
            })),
        });

        let result = await chat.sendMessage(message);
        let response = result.response;
        let call = response.candidates[0].content.parts.find(p => p.functionCall);

        // 3. จัดการ Function Calling (ถ้า Gemini ต้องการใช้เครื่องมือ)
        while (call) {
            const { name, args } = call.functionCall;
            console.log(`🤖 Agent calling tool: ${name}`, args);

            let toolResult;
            if (name === 'run_command') toolResult = await agentTools.runCommand(args.command);
            if (name === 'read_file') toolResult = agentTools.readFile(args.filePath);
            if (name === 'write_file') toolResult = agentTools.writeFile(args.filePath, args.content);

            // ส่งผลลัพธ์เครื่องมือกลับให้ Gemini
            result = await chat.sendMessage([{
                functionResponse: {
                    name,
                    response: { result: toolResult }
                }
            }]);
            
            response = result.response;
            call = response.candidates[0].content.parts.find(p => p.functionCall);
        }

        const responseText = response.text();

        // 4. บันทึกคำตอบ Model
        await db.query('INSERT INTO gemini_messages (session_id, role, content) VALUES (?, ?, ?)', [sessionId, 'model', responseText]);

        res.json({ response: responseText });
    } catch (error) {
        console.error('Agent Error:', error);
        res.status(500).json({ error: 'Agent Error: ' + error.message });
    }
};

exports.deleteSession = async (req, res) => {
    const { sessionId } = req.params;
    try {
        await db.query('UPDATE gemini_sessions SET is_archived = TRUE WHERE id = ? AND user_id = ?', [sessionId, req.user.user_id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete session' });
    }
};
