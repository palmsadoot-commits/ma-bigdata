const { z } = require('zod');

const updateSettingsSchema = z.object({
    system_name: z.string().min(1, { message: "กรุณาระบุชื่อระบบ" }),
    agency_name: z.string().optional().nullable(),
    
    // LINE Settings
    enable_line: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 ? 1 : 0),
    line_notify_token: z.string().optional().nullable(),
    line_group_id: z.string().optional().nullable(),
    ngrok_authtoken: z.string().optional().nullable(),

    // Email Settings
    enable_email: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 ? 1 : 0),
    smtp_host: z.string().optional().nullable(),
    smtp_port: z.string().or(z.number()).optional().nullable().transform(v => v ? Number(v) : null),
    smtp_user: z.string().optional().nullable(),
    smtp_pass: z.string().optional().nullable(),
    admin_email: z.string().optional().nullable(),

    // Notifications
    notify_new_ticket: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 || v === true || v === 'true' ? 1 : 0),
    notify_status_change: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 || v === true || v === 'true' ? 1 : 0),
    notify_line_quota_low: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 || v === true || v === 'true' ? 1 : 0),
    notify_security_line: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 || v === true || v === 'true' ? 1 : 0),
    notify_security_email: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 || v === true || v === 'true' ? 1 : 0),
    msg_template_new: z.string().optional().nullable(),
    msg_template_update: z.string().optional().nullable(),

    // SLA & Policies
    default_sla_hours: z.string().or(z.number()).optional().transform(v => Number(v || 0)),
    default_penalty_rate: z.string().or(z.number()).optional().transform(v => Number(v || 0)),
    sla_hardware_hours: z.string().or(z.number()).optional().transform(v => Number(v || 0)),
    sla_software_hours: z.string().or(z.number()).optional().transform(v => Number(v || 0)),
    sla_app_hours: z.string().or(z.number()).optional().transform(v => Number(v || 0)),
    ack_limit_hours: z.string().or(z.number()).optional().transform(v => Number(v || 0)),

    // Security & Files
    max_file_size_mb: z.string().or(z.number()).optional().transform(v => Number(v || 0)),
    security_strict_mode: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 ? 1 : 0),
    allowed_file_types: z.string().optional().nullable(),

    // System Status
    maintenance_mode: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 ? 1 : 0),
    error_404_active: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 ? 1 : 0),
    error_500_active: z.string().or(z.number()).optional().transform(v => v === '1' || v === 1 ? 1 : 0),

    // Look & Feel
    theme_mode: z.string().optional().nullable(),
    primary_color: z.string().optional().nullable(),
    system_font: z.string().optional().nullable()
}).passthrough(); // Keep passthrough just in case for file uploads

module.exports = {
    updateSettingsSchema
};
