const { z } = require('zod');

const createTicketSchema = z.object({
    reporter_id: z.string().or(z.number()).transform(v => Number(v)).optional(),
    category_id: z.string().or(z.number()).transform(v => Number(v)),

    equipment_no: z.string().trim().max(100).optional().default('ไม่มีข้อมูล'),
    problem_detail: z.string().trim().min(5, { message: "กรุณาระบุรายละเอียดปัญหาอย่างน้อย 5 ตัวอักษร" }).max(5000, { message: "รายละเอียดต้องไม่เกิน 5000 ตัวอักษร" }),
    is_cm: z.string().or(z.number()).transform(v => v === '1' || v === 1 ? 1 : 0),
    sla_hours: z.string().or(z.number()).transform(v => Number(v)).default(0)
});

const updateTicketStatusSchema = z.object({
    status: z.enum(['Pending', 'In Progress', 'Returned', 'Resolved', 'Closed'], { message: "สถานะไม่ถูกต้อง" }).optional(),
    status_id: z.string().or(z.number()).transform(v => Number(v)).optional(),
    technician_id: z.string().or(z.number()).transform(v => Number(v)).optional(),
    root_cause_and_solution: z.string().trim().max(5000).optional()
});

const createTicketLogSchema = z.object({
    action: z.string().trim().min(1).max(255),
    detail: z.string().trim().max(2000).optional()
});

module.exports = {
    createTicketSchema,
    updateTicketStatusSchema,
    createTicketLogSchema
};
