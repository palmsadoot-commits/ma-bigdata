import { describe, it, expect, vi, beforeEach } from 'vitest';
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userController = require('../controllers/userController');

// Mock loggers to avoid DB calls inside them
vi.mock('../utils/logger', () => ({
    logAction: vi.fn().mockResolvedValue(true),
    sysLog: vi.fn().mockResolvedValue(true)
}));

describe('User Controller - Login', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Reset spies
        vi.spyOn(db, 'query').mockReset();
        vi.spyOn(bcrypt, 'compare').mockReset();
        vi.spyOn(jwt, 'sign').mockReset();

        req = {
            body: { username: 'testuser', password: 'password123' },
            headers: {},
            socket: { remoteAddress: '127.0.0.1' }
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
    });

    it('should return 401 if user is not found', async () => {
        vi.spyOn(db, 'query').mockResolvedValue([[]]); 

        await userController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'ชื่อผู้ใช้งานไม่ถูกต้อง!' });
    });

    it('should return 401 if password does not match', async () => {
        const mockUser = { user_id: 1, username: 'testuser', password_hash: 'hashed_pass' };
        vi.spyOn(db, 'query').mockResolvedValue([[mockUser]]);
        vi.spyOn(bcrypt, 'compare').mockResolvedValue(false);

        await userController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'รหัสผ่านไม่ถูกต้อง!' });
    });

    it('should return 200 and token if login is successful', async () => {
        const mockUser = { user_id: 1, username: 'testuser', password_hash: 'hashed_pass', role: 'admin' };
        vi.spyOn(db, 'query').mockResolvedValue([[mockUser]]);
        vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        vi.spyOn(jwt, 'sign').mockReturnValue('mocked_token');

        await userController.login(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            user: expect.objectContaining({
                username: 'testuser',
                token: 'mocked_token'
            })
        }));
    });

    it('should block after 5 failed attempts (Brute-force protection)', async () => {
        vi.spyOn(db, 'query').mockResolvedValue([[]]); // User not found triggers failure
        
        // Use a unique IP for this test
        req.socket.remoteAddress = '10.10.10.10';

        // 5 failed attempts
        for (let i = 0; i < 5; i++) {
            await userController.login(req, res);
        }

        // 6th attempt should return 429
        await userController.login(req, res);
        
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('ตรวจพบการสุ่มรหัสผ่าน')
        }));
    });
});
