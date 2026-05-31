const db = require('../config/db');
const dayjs = require('dayjs');

/**
 * 📊 Report Controller
 * Handles data aggregation for the Maintenance Reporting Dashboard
 */
const reportController = {
    /**
     * 1. Get Executive KPIs
     */
    async getKpis(req, res, next) {
        try {
            const { start, end, project_id } = req.query;
            let queryParams = [];
            let dateFilter = '';
            
            if (start && end) {
                dateFilter = ' AND created_at BETWEEN ? AND ?';
                queryParams.push(start, end);
            }
            
            let projectFilter = '';
            if (project_id) {
                projectFilter = ' AND t.category_id IN (SELECT category_id FROM categories WHERE project_id = ?)';
                queryParams.push(project_id);
            }

            const kpiQuery = `
                SELECT 
                    COUNT(*) as total_tickets,
                    SUM(CASE WHEN status_id IN (1, 2, 3) THEN 1 ELSE 0 END) as active_tickets,
                    SUM(CASE WHEN status_id IN (4, 5, 6) THEN 1 ELSE 0 END) as resolved_tickets,
                    SUM(CASE WHEN is_sla_breached = 1 THEN 1 ELSE 0 END) as sla_breaches,
                    SUM(penalty_amount) as total_penalties
                FROM tickets t
                WHERE 1=1 ${dateFilter} ${projectFilter}
            `;

            const [rows] = await db.query(kpiQuery, queryParams);
            res.json(rows[0]);
        } catch (err) { next(err); }
    },

    /**
     * 2. Get Ticket Trend (Dynamic Daily/Monthly)
     */
    async getTrend(req, res, next) {
        try {
            const { start, end } = req.query;
            const startDate = dayjs(start || dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
            const endDate = dayjs(end || dayjs().format('YYYY-MM-DD'));
            
            const diffDays = endDate.diff(startDate, 'day');
            const isDaily = diffDays <= 60;
            const dateFormat = isDaily ? '%Y-%m-%d' : '%Y-%m';

            const query = `
                SELECT 
                    time_label as month,
                    SUM(created_count) as created,
                    SUM(resolved_count) as resolved
                FROM (
                    SELECT DATE_FORMAT(created_at, '${dateFormat}') as time_label, COUNT(*) as created_count, 0 as resolved_count
                    FROM tickets
                    WHERE created_at BETWEEN ? AND ?
                    GROUP BY time_label
                    UNION ALL
                    SELECT DATE_FORMAT(resolved_at, '${dateFormat}') as time_label, 0 as created_count, COUNT(*) as resolved_count
                    FROM tickets
                    WHERE status_id = 6 AND resolved_at BETWEEN ? AND ?
                    GROUP BY time_label
                ) combined
                GROUP BY month
                ORDER BY month ASC
            `;

            const [rows] = await db.query(query, [
                startDate.format('YYYY-MM-DD 00:00:00'), 
                endDate.format('YYYY-MM-DD 23:59:59'),
                startDate.format('YYYY-MM-DD 00:00:00'), 
                endDate.format('YYYY-MM-DD 23:59:59')
            ]);
            
            res.json(rows);
        } catch (err) { next(err); }
    },

    /**
     * 3. Get Issues by Category
     */
    async getCategoryDistribution(req, res, next) {
        try {
            const [rows] = await db.query(`
                SELECT c.category_name as name, COUNT(t.ticket_id) as value
                FROM categories c
                LEFT JOIN tickets t ON c.category_id = t.category_id
                GROUP BY c.category_id
                HAVING value > 0
                ORDER BY value DESC
            `);
            res.json(rows);
        } catch (err) { next(err); }
    },

    /**
     * 4. Get Vendor SLA Performance
     */
    async getVendorPerformance(req, res, next) {
        try {
            const [rows] = await db.query(`
                SELECT 
                    v.vendor_name as name,
                    COUNT(t.ticket_id) as total,
                    SUM(CASE WHEN t.is_sla_breached = 0 AND t.status_id >= 4 THEN 1 ELSE 0 END) as on_time,
                    SUM(CASE WHEN t.is_sla_breached = 1 THEN 1 ELSE 0 END) as breached
                FROM vendors v
                JOIN tickets t ON v.vendor_id = t.vendor_id
                GROUP BY v.vendor_id
                ORDER BY total DESC
            `);
            res.json(rows);
        } catch (err) { next(err); }
    },

    /**
     * 5. Get Status Breakdown
     */
    async getStatusBreakdown(req, res, next) {
        try {
            const { start, end, project_id } = req.query;
            let queryParams = [];
            let joinFilter = '';
            
            if (start && end) {
                joinFilter += ' AND t.created_at BETWEEN ? AND ?';
                queryParams.push(start, end);
            }
            if (project_id && project_id !== 'null') {
                joinFilter += ' AND t.category_id IN (SELECT category_id FROM categories WHERE project_id = ?)';
                queryParams.push(project_id);
            }

            const query = `
                SELECT ts.status_name as name, COUNT(t.ticket_id) as value, ts.status_color as color
                FROM ticket_statuses ts
                LEFT JOIN tickets t ON ts.status_id = t.status_id ${joinFilter}
                WHERE ts.is_active = 1
                GROUP BY ts.status_id
                ORDER BY ts.sort_order ASC
            `;
            const [rows] = await db.query(query, queryParams);
            res.json(rows);
        } catch (err) { next(err); }
    },

    /**
     * 6. Get Advanced Executive Summary (Combined BI Data)
     */
    async getAdvancedExecutiveSummary(req, res, next) {
        try {
            const { start, end, project_id } = req.query;
            let queryParams = [];
            let filter = ' WHERE 1=1 ';
            
            if (start && end) {
                filter += ' AND t.created_at BETWEEN ? AND ? ';
                queryParams.push(start, end);
            }
            if (project_id && project_id !== 'null') {
                filter += ' AND t.category_id IN (SELECT category_id FROM categories WHERE project_id = ?) ';
                queryParams.push(project_id);
            }

            const kpiQuery = `
                SELECT 
                    COUNT(*) as total_tickets,
                    SUM(CASE WHEN t.status_id = 6 THEN 1 ELSE 0 END) as closed_tickets,
                    SUM(CASE WHEN t.is_sla_breached = 1 THEN 1 ELSE 0 END) as sla_breaches,
                    SUM(t.penalty_amount) as total_penalty_cost,
                    AVG(TIMESTAMPDIFF(HOUR, t.created_at, IFNULL(t.resolved_at, NOW()))) as avg_resolution_hours,
                    AVG(TIMESTAMPDIFF(HOUR, t.created_at, IFNULL(t.acknowledged_at, NOW()))) as avg_ack_hours
                FROM tickets t
                ${filter}
            `;

            const priorityQuery = `
                SELECT 
                    CASE WHEN is_cm = 1 THEN 'Emergency (CM)' ELSE 'Routine (PM/Other)' END as name,
                    COUNT(*) as value
                FROM tickets t
                ${filter}
                GROUP BY is_cm
            `;

            const topCategoriesQuery = `
                SELECT c.category_name as name, COUNT(*) as count
                FROM tickets t
                JOIN categories c ON t.category_id = c.category_id
                ${filter}
                GROUP BY t.category_id
                ORDER BY count DESC
                LIMIT 5
            `;

            const [kpis] = await db.query(kpiQuery, queryParams);
            const [priorities] = await db.query(priorityQuery, queryParams);
            const [topCategories] = await db.query(topCategoriesQuery, queryParams);

            // D) Trend Data (Requests vs Resolutions)
            const startDate = dayjs(start || dayjs().subtract(12, 'month').format('YYYY-MM-DD'));
            const endDate = dayjs(end || dayjs().format('YYYY-MM-DD'));
            const trendQuery = `
                SELECT 
                    time_label as month,
                    SUM(created_count) as created,
                    SUM(resolved_count) as resolved
                FROM (
                    SELECT DATE_FORMAT(created_at, '%Y-%m') as time_label, COUNT(*) as created_count, 0 as resolved_count
                    FROM tickets
                    WHERE created_at BETWEEN ? AND ?
                    GROUP BY time_label
                    UNION ALL
                    SELECT DATE_FORMAT(resolved_at, '%Y-%m') as time_label, 0 as created_count, COUNT(*) as resolved_count
                    FROM tickets
                    WHERE status_id = 6 AND resolved_at BETWEEN ? AND ?
                    GROUP BY time_label
                ) combined
                GROUP BY month
                ORDER BY month ASC
            `;
            const [trend] = await db.query(trendQuery, [
                startDate.format('YYYY-MM-DD 00:00:00'), 
                endDate.format('YYYY-MM-DD 23:59:59'),
                startDate.format('YYYY-MM-DD 00:00:00'), 
                endDate.format('YYYY-MM-DD 23:59:59')
            ]);

            // Calculate Compliance Rate
            const total = kpis[0].total_tickets || 0;
            const breaches = kpis[0].sla_breaches || 0;
            const complianceRate = total > 0 ? (((total - breaches) / total) * 100).toFixed(2) : 100;

            res.json({
                kpis: { ...kpis[0], compliance_rate: parseFloat(complianceRate) },
                priorities,
                topCategories,
                trend
            });
        } catch (err) { next(err); }
    }
};

module.exports = reportController;
