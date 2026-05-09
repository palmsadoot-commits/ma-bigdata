import { describe, it, expect, vi, beforeEach } from 'vitest';
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        vi.clearAllMocks();
        req = {
            headers: {},
            method: 'GET',
            url: '/api/test'
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        next = vi.fn();
    });

    it('should return 401 if no token is provided', () => {
        authenticateToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
            status: 'error',
            code: 'UNAUTHORIZED',
            message: expect.stringContaining('กรุณาเข้าสู่ระบบ') 
        }));
    });

    it('should return 401 (NOT 403) if token verification fails', () => {
        req.headers['authorization'] = 'Bearer invalid-token';
        
        // Mock jwt.verify to call callback with error
        vi.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
            callback(new Error('invalid token'), null);
        });

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401); // Our fix!
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
            status: 'error',
            code: 'TOKEN_INVALID',
            message: expect.stringContaining('เซสชันหมดอายุหรือรหัสผ่านไม่ถูกต้อง') 
        }));
    });

    it('should call next() and set req.user if token is valid', () => {
        req.headers['authorization'] = 'Bearer valid-token';
        const mockUser = { user_id: 1, role: 'admin' };
        
        vi.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
            callback(null, mockUser);
        });

        authenticateToken(req, res, next);

        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
    });
});
