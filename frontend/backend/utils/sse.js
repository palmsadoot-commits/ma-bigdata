let clients = [];

const addClient = (req, res) => {
    // ตั้งค่า Header สำหรับ Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // ป้องกัน Proxy (เช่น Nginx) บัฟเฟอร์ข้อมูล
    res.flushHeaders();

    // 💓 ส่ง Heartbeat ทันทีที่เชื่อมต่อ และส่งทุก 30 วินาที เพื่อป้องกันสายหลุด
    res.write(': heartbeat\n\n');
    const keepAlive = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 30000);

    clients.push(res);

    // เมื่อ Client ปิดการเชื่อมต่อ
    req.on('close', () => {
        clearInterval(keepAlive);
        clients = clients.filter(client => client !== res);
        res.end();
    });
};

// ฟังก์ชันกระจายสัญญาณ
const broadcastAlert = (level, category, message, metadata) => {
    // ส่งเฉพาะเหตุการณ์สำคัญ
    if (level === 'CRITICAL' || level === 'ERROR' || (level === 'WARN' && category === 'SECURITY')) {
        const payload = JSON.stringify({ level, category, message, metadata });
        clients.forEach(client => {
            try {
                client.write(`data: ${payload}\n\n`);
            } catch (err) {
                console.error("❌ Failed to write to SSE client:", err.message);
            }
        });
    }
};

module.exports = { addClient, broadcastAlert };
