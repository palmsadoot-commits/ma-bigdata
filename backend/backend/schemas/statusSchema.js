const { z } = require('zod');

const statusSchema = z.object({
    status_name: z.string().trim().min(1, 'ระบุชื่อสถานะ').max(100).optional(),
    status_color: z.string().trim().max(50).optional(),
    sort_order: z.number().int().min(0).optional(),
    is_active: z.union([z.boolean(), z.number()]).transform(v => (v === true || v === 1) ? 1 : 0).optional()
});

module.exports = { statusSchema };
