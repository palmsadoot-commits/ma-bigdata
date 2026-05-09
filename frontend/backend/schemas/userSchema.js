const { z } = require('zod');

const loginSchema = z.object({
    username: z.string().trim().min(1, { message: "กรุณาระบุชื่อผู้ใช้งาน" }),
    password: z.string().min(1, { message: "กรุณาระบุรหัสผ่าน" })
});

const createUserSchema = z.object({
    username: z.string().trim().min(4, { message: "ชื่อผู้ใช้งานต้องมีความยาวอย่างน้อย 4 ตัวอักษร" }).max(50),
    password: z.string().min(8, { message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" }).max(100),
    email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "รูปแบบอีเมลไม่ถูกต้อง" }).optional().or(z.literal('')),
    role: z.enum(['admin', 'head_technician', 'technician', 'user'], { message: "บทบาทผู้ใช้ไม่ถูกต้อง" }),
    first_name: z.string().trim().min(1, { message: "กรุณาระบุชื่อจริง" }).max(100),
    last_name: z.string().trim().min(1, { message: "กรุณาระบุนามสกุล" }).max(100),
    agency: z.string().trim().max(100).optional().or(z.literal('')),
    project_id: z.string().or(z.number()).transform(v => (v === '' || v === 'null' || v === null) ? null : Number(v)).optional().nullable()
});

const updateProfileSchema = z.object({
    user_id: z.string().or(z.number()).transform(v => Number(v)).optional(),
    first_name: z.string().trim().min(1, { message: "กรุณาระบุชื่อจริง" }).max(100).optional(),
    last_name: z.string().trim().min(1, { message: "กรุณาระบุนามสกุล" }).max(100).optional(),
    email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "รูปแบบอีเมลไม่ถูกต้อง" }).optional().or(z.literal('')),
    telephone: z.string().trim().max(20).optional().or(z.literal('')),
    mobile: z.string().trim().max(20).optional().or(z.literal('')),
    position: z.string().trim().max(100).optional().or(z.literal('')),
    department: z.string().trim().max(100).optional().or(z.literal(''))
});

const updatePasswordSchema = z.object({
    user_id: z.string().or(z.number()).transform(v => Number(v)).optional(),
    old_password: z.string().min(1, { message: "กรุณาระบุรหัสผ่านเดิม" }),
    new_password: z.string().min(6, { message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }).max(100)
});

// ✅ ปรับปรุงให้ตรงกับข้อมูลที่ UserManagement.jsx ส่งมาจริง
const adminUpdateUserSchema = z.object({
    username: z.string().optional(), 
    email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "รูปแบบอีเมลไม่ถูกต้อง" }).or(z.literal('')).optional().nullable(),
    role: z.enum(['admin', 'head_technician', 'technician', 'user']).optional(),
    first_name: z.string().trim().max(100).optional(),
    last_name: z.string().trim().max(100).optional(),
    agency: z.string().trim().max(100).optional().or(z.literal('')).nullable(),
    project_id: z.any().transform(v => (v === '' || v === 'null' || v === null || v === undefined) ? null : Number(v)).optional().nullable(),
    new_password: z.string().optional().or(z.literal('')),
    is_active: z.any().optional()
});


module.exports = {
    loginSchema,
    createUserSchema,
    updateProfileSchema,
    updatePasswordSchema,
    adminUpdateUserSchema
};
