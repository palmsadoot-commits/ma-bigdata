const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.io
 */
const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Allow all for internal mol.go.th dev, adjust for prod if needed
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('📡 Socket connected:', socket.id);
        
        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected:', socket.id);
        });
    });

    return io;
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

/**
 * Broadcast event to all clients
 */
const emit = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = {
    init,
    getIO,
    emit
};
