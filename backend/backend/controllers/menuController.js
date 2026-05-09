const db = require('../config/db');

/**
 * ดึงข้อมูลเมนูทั้งหมด (Tree Structure)
 */
exports.getMenus = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM system_menus ORDER BY sort_order ASC');
        
        const buildTree = (items, parentId = null) => {
            return items
                .filter(item => item.parent_id === parentId)
                .map(item => {
                    const children = buildTree(items, item.id);
                    const node = { ...item };
                    if (children.length > 0) {
                        node.children = children;
                    }
                    return node;
                });
        };

        const menuTree = buildTree(rows);
        res.json(menuTree);
    } catch (err) {
        console.error("Error fetching menus:", err);
        res.status(500).json({ error: 'Failed to fetch menus' });
    }
};

/**
 * เพิ่มเมนูใหม่
 */
exports.createMenu = async (req, res) => {
    try {
        const { parent_id, title, icon, path, component_name, required_role, sort_order, is_active } = req.body;
        // แปลง boolean เป็น integer หากจำเป็น
        const activeStatus = (is_active === true || is_active === 1 || is_active === '1') ? 1 : 0;
        
        const sql = `
            INSERT INTO system_menus 
            (parent_id, title, icon, path, component_name, required_role, sort_order, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [parent_id || null, title, icon, path, component_name, required_role, sort_order || 0, activeStatus]);
        res.status(201).json({ message: 'Menu created successfully', menuId: result.insertId });
    } catch (err) {
        console.error("Error creating menu:", err);
        res.status(500).json({ error: 'Failed to create menu' });
    }
};

/**
 * อัปเดตข้อมูลเมนู
 */
exports.updateMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const { parent_id, title, icon, path, component_name, required_role, sort_order, is_active } = req.body;
        
        // ✅ ปรับจูนสถานะให้แม่นยำก่อนลง DB
        const activeStatus = (is_active === true || is_active === 1 || is_active === '1') ? 1 : 0;
        
        console.log(`[Menu] Updating ID ${id} with status: ${activeStatus} (received: ${is_active})`);

        const sql = `
            UPDATE system_menus 
            SET parent_id = ?, title = ?, icon = ?, path = ?, 
                component_name = ?, required_role = ?, sort_order = ?, is_active = ? 
            WHERE id = ?
        `;
        await db.query(sql, [parent_id || null, title, icon, path, component_name, required_role, sort_order || 0, activeStatus, id]);
        res.json({ message: 'Menu updated successfully' });
    } catch (err) {
        console.error("Error updating menu:", err);
        res.status(500).json({ error: 'Failed to update menu' });
    }
};

/**
 * ลบเมนู
 */
exports.deleteMenu = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM system_menus WHERE id = ?', [id]);
        res.json({ message: 'Menu deleted successfully' });
    } catch (err) {
        console.error("Error deleting menu:", err);
        res.status(500).json({ error: 'Failed to delete menu' });
    }
};
