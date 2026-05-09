import { describe, it, expect, vi, beforeEach } from 'vitest';
const validate = require('../middleware/validate');
const { z } = require('zod');

describe('Validation Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { body: {}, query: {}, params: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        next = vi.fn();
    });

    it('should call next if data is valid', async () => {
        const schema = {
            body: z.object({ username: z.string() })
        };
        req.body = { username: 'test' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 if data is invalid', async () => {
        const schema = {
            body: z.object({ username: z.string().min(5) })
        };
        req.body = { username: 'abcd' }; // too short

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'ข้อมูลไม่ถูกต้อง'
        }));
    });

    it('should transform data based on schema', async () => {
        const schema = {
            body: z.object({
                age: z.string().transform(v => parseInt(v))
            })
        };
        req.body = { age: '25' };

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(req.body.age).toBe(25);
        expect(next).toHaveBeenCalled();
    });
});
