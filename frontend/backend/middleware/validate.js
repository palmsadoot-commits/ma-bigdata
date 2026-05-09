const { ZodError } = require('zod');

/**
 * Generic Validation Middleware using Zod
 * @param {object} schemas - Object containing Zod schemas for body, query, and/or params
 */
const validate = (schemas) => async (req, res, next) => {
    try {
        if (schemas.body) {
            req.body = await schemas.body.parseAsync(req.body);
        }
        if (schemas.query) {
            req.query = await schemas.query.parseAsync(req.query);
        }
        if (schemas.params) {
            req.params = await schemas.params.parseAsync(req.params);
        }
        next();
    } catch (error) {
        // Check for ZodError by name or instance to be safe
        if (error instanceof ZodError || error.name === 'ZodError') {
            const issues = error.errors || error.issues || [];
            const errorDetails = issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            // ✅ Log to server console for debugging
            console.error('❌ Validation Error:', JSON.stringify(errorDetails, null, 2));
            console.error('📦 Request Body:', JSON.stringify(req.body, null, 2));

            return res.status(400).json({
                error: 'ข้อมูลไม่ถูกต้อง',
                details: errorDetails
            });
        }

        next(error);
    }
};

module.exports = validate;
