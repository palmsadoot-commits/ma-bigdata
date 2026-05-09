import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table, Card, Button, Modal, Form, Input, Select, InputNumber, 
  Switch, Space, Typography, Tag, App, Popconfirm, Row, Col, Divider, theme
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  MenuOutlined, ThunderboltOutlined, StarOutlined,
  AppstoreOutlined, LinkOutlined, ToolOutlined,
  SaveOutlined, CloseOutlined, InteractionOutlined,
  CompassOutlined, SafetyOutlined, BuildOutlined,
  FolderOpenOutlined, FolderOutlined, HomeOutlined
} from '@ant-design/icons';
import * as AntIcons from '@ant-design/icons';
import axiosInstance from '../services/api/axiosInstance';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { useToken } = theme;

const AVAILABLE_COMPONENTS = [
  'TicketDashboard', 'TicketForm', 'TicketList', 'TicketDetail', 
  'Profile', 'UserManagement', 'CategoryManagement', 'StatusManagement', 
  'VendorManagement', 'SystemLogDashboard', 'BackupManagement', 
  'SystemSettings', 'Settings', 'TicketPrint', 'MenuManagement',
  'AuditLog', 'ProjectSelection', 'Login', 'ErrorDisplay'
];

const PATH_MAP = {
  '/dashboard': 'TicketDashboard',
  '/': 'TicketForm',
  '/tickets': 'TicketList',
  '/profile': 'Profile',
  '/users': 'UserManagement',
  '/categories': 'CategoryManagement',
  '/statuses': 'StatusManagement',
  '/vendors': 'VendorManagement',
  '/system-logs': 'SystemLogDashboard',
  '/backup': 'BackupManagement',
  '/system-settings': 'SystemSettings',
  '/settings': 'Settings',
  '/navigation': 'MenuManagement',
  '/audit-logs': 'AuditLog'
};

export default function MenuManagement() {
  const { token } = useToken();
  const { message } = App.useApp(); 
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState([]); 
  const [form] = Form.useForm();

  const iconList = useMemo(() => Object.keys(AntIcons).filter(key => key.endsWith('Outlined')), []);

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/menus');
      setMenus(res.data);
      const parentIds = [];
      const collectParentIds = (items) => {
          items.forEach(item => {
              if (item.children && item.children.length > 0) {
                  parentIds.push(item.id);
                  collectParentIds(item.children);
              }
          });
      };
      collectParentIds(res.data);
      setExpandedKeys(parentIds);
    } catch (err) {
      message.error('ไม่สามารถโหลดข้อมูลเมนูได้');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const showModal = (menu = null) => {
    setEditingMenu(menu);
    if (menu) {
      form.setFieldsValue({
        ...menu,
        required_role: menu.required_role ? menu.required_role.split(',') : [],
        is_active: menu.is_active === 1
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ sort_order: 0, is_active: true });
    }
    setModalVisible(true);
  };

  const handlePathChange = (e) => {
      const path = e.target.value;
      if (PATH_MAP[path]) {
          form.setFieldsValue({ component_name: PATH_MAP[path] });
      }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        required_role: values.required_role ? values.required_role.join(',') : 'admin',
        is_active: values.is_active ? 1 : 0
      };

      if (editingMenu) {
        await axiosInstance.put(`/menus/${editingMenu.id}`, payload);
        message.success('อัปเดตเมนูเรียบร้อยแล้ว');
      } else {
        await axiosInstance.post('/menus', payload);
        message.success('สร้างเมนูใหม่เรียบร้อยแล้ว');
      }
      setModalVisible(false);
      fetchMenus();
    } catch (err) {
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/menus/${id}`);
      message.success('ลบเมนูเรียบร้อยแล้ว');
      fetchMenus();
    } catch (err) {
      message.error('ไม่สามารถลบเมนูได้');
    }
  };

  const columns = [
    {
      title: 'โครงสร้างเมนู',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (text, record) => (
        <Space size="large" style={{ paddingLeft: record.parent_id ? 20 : 0 }}>
          {record.icon && React.createElement(AntIcons[record.icon] || MenuOutlined, { 
            style: { color: !record.parent_id ? '#1e40af' : '#64748b', fontSize: !record.parent_id ? '22px' : '16px' }
          })}
          <Text strong={!record.parent_id} style={{ color: !record.parent_id ? '#1e293b' : '#475569', fontSize: !record.parent_id ? '17px' : '15px' }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'คอมโพเนนต์',
      dataIndex: 'component_name',
      key: 'component_name',
      width: 220,
      render: (name, record) => {
          if (record.children && record.children.length > 0) {
              return (
                <Tag color="blue" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', fontWeight: 'bold' }}>
                    <FolderOpenOutlined style={{ marginRight: 6 }} /> หัวข้อหลัก ({record.children.length})
                </Tag>
              );
          }
          if (!record.parent_id) {
            return (
                <Tag color="geekblue" style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #e0e7ff', borderRadius: '6px', padding: '4px 12px', fontSize: '12px' }}>
                    <HomeOutlined style={{ marginRight: 6 }} /> เมนูเดี่ยว
                </Tag>
              );
          }
          return name ? <Tag icon={<BuildOutlined />} color="cyan" style={{ borderRadius: '6px', fontSize: '13px' }}>{name}</Tag> : <Text type="secondary" italic style={{ fontSize: '13px' }}>N/A</Text>
      }
    },
    {
      title: 'เส้นทาง (Path)',
      dataIndex: 'path',
      key: 'path',
      width: 180,
      render: (path, record) => <Text code style={{ fontSize: '13px', padding: '2px 6px', opacity: !record.parent_id ? 1 : 0.7 }}>{path || 'N/A'}</Text>
    },
    {
      title: 'สิทธิ์เข้าใช้งาน',
      dataIndex: 'required_role',
      key: 'required_role',
      width: 200,
      render: (roles) => (
        <Space wrap size={[2, 2]}>
          {roles?.split(',').map(role => (
            <Tag key={role} style={{ fontSize: 10, borderRadius: '4px', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '1px 8px' }}>{role}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      align: 'center',
      render: (active, record) => (
        <div onClick={(e) => e.stopPropagation()}>
            <Switch 
                size="medium"
                checked={active === 1} 
                onChange={async (val) => {
                    try {
                        await axiosInstance.put(`/menus/${record.id}`, { ...record, is_active: val ? 1 : 0 });
                        message.success(`เปลี่ยนสถานะเมนู ${record.title} เรียบร้อย`);
                        fetchMenus();
                    } catch(e) { message.error('เปลี่ยนสถานะล้มเหลว'); }
                }} 
            />
        </div>
      )
    },
    {
      title: 'จัดการ',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="middle" onClick={(e) => e.stopPropagation()}>
          <Button type="text" size="large" icon={<EditOutlined style={{ color: '#3b82f6', fontSize: '20px' }} />} onClick={() => showModal(record)} />
          <Popconfirm title="ลบเมนูนี้?" onConfirm={() => handleDelete(record.id)} okText="ลบ" cancelText="ยกเลิก">
            <Button type="text" size="large" danger icon={<DeleteOutlined style={{ fontSize: '20px' }} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f1f5f9', borderRadius: '16px' }}>
      <style>{`
        .light-mgmt-card { background: #ffffff !important; border-radius: 20px !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05) !important; }
        .ant-table-wrapper { background: #ffffff !important; border-radius: 12px; }
        
        /* ✅ หัวตารางเด่นชัดขึ้น (16px) */
        .ant-table-thead > tr > th { 
          background: #e2e8f0 !important; 
          color: #1e293b !important; 
          font-size: 16px !important; 
          font-weight: 800 !important; 
          border-bottom: 2px solid #cbd5e1 !important;
          padding: 18px 16px !important;
        }

        /* ✅ เนื้อหาในตารางใหญ่ขึ้น (15px) */
        .ant-table-tbody > tr > td { 
          padding: 18px 16px !important; 
          border-bottom: 1px solid #f1f5f9 !important;
          font-size: 15px !important;
        }

        /* ✅ สีสำหรับเมนูหลัก */
        .main-menu-row td { 
          background-color: #f8faff !important; 
        }
        .main-menu-row {
          border-left: 6px solid #2563eb !important; 
        }
        
        /* ✅ สีสำหรับเมนูย่อย */
        .sub-menu-row td { 
          background-color: #ffffff !important; 
        }
        .sub-menu-row {
          border-left: 6px solid transparent !important;
        }

        /* ✅ บังคับสีช่องที่ถูกตรึง (Fixed Column) ให้ตรงกับแถว */
        .main-menu-row .ant-table-cell-fix-right {
          background-color: #f8faff !important;
        }
        .sub-menu-row .ant-table-cell-fix-right {
          background-color: #ffffff !important;
        }

        /* ✅ Hover Effect ที่แตกต่างชัดเจน */
        .clickable-row:hover > td { 
          background-color: #f1f5f9 !important; 
          box-shadow: inset 0 0 10px rgba(0,0,0,0.02);
        }
        
        .management-header { background: #fff; padding: 24px 32px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
        .ant-btn-primary { background: #1e293b !important; border: none !important; border-radius: 8px !important; height: 42px !important; }
        
        .clickable-row { cursor: pointer; transition: all 0.15s ease-in-out; }
        .ant-table-row-expand-icon { transform: scale(1.4); cursor: pointer !important; }
      `}</style>

      <div className="management-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="middle">
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}><CompassOutlined style={{ color: 'white', fontSize: '28px' }} /></div>
                <div><Title level={2} style={{ margin: 0, color: '#1e293b' }}>Navigation Center</Title><Text type="secondary" style={{ fontSize: 14 }}>บริหารจัดการโครงสร้างเมนูระดับสูง (Architect View)</Text></div>
            </Space>
          </Col>
          <Col><Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => showModal()}>เพิ่มเมนูใหม่</Button></Col>
        </Row>
      </div>

      <Card className="light-mgmt-card" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={menus} 
          rowKey="id" 
          loading={loading}
          pagination={false} 
          size="large" 
          scroll={{ x: 1000 }} // ✅ รองรับ Responsive
          expandedRowKeys={expandedKeys}
          onExpandedRowsChange={(keys) => setExpandedKeys(keys)}
          rowClassName={(record) => {
            let classes = 'clickable-row';
            if (!record.parent_id) {
              classes += ' main-menu-row';
            } else {
              classes += ' sub-menu-row';
            }
            return classes;
          }}
          onRow={(record) => ({
            onClick: () => {
              if (record.children && record.children.length > 0) {
                const key = record.id;
                const isExpanded = expandedKeys.includes(key);
                const newKeys = isExpanded ? expandedKeys.filter(k => k !== key) : [...expandedKeys, key];
                setExpandedKeys(newKeys);
              }
            }
          })}
          expandable={{ rowExpandable: (record) => record.children && record.children.length > 0 }} 
        />
      </Card>

      <Modal
        title={<Space size="middle"><InteractionOutlined style={{ color: '#3b82f6' }} /> <Text strong style={{ fontSize: 20 }}>{editingMenu ? 'แก้ไขข้อมูลเมนู' : 'เพิ่มเมนูใหม่'}</Text></Space>}
        open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} width={720}
        okText="บันทึกข้อมูล" cancelText="ยกเลิก" styles={{ body: { paddingTop: 30 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Row gutter={24}>
            <Col span={12}><Form.Item name="parent_id" label={<Text strong>เมนูหลัก (Parent Menu)</Text>}><Select placeholder="เลือกเมนูแม่" allowClear showSearch optionFilterProp="children">{menus.filter(m => !m.parent_id).map(m => (<Option key={m.id} value={m.id}>{m.title}</Option>))}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="title" label={<Text strong>ชื่อเมนู</Text>} rules={[{ required: true, message: 'กรุณาระบุชื่อเมนู' }]}><Input placeholder="เช่น การจัดการข้อมูล" /></Form.Item></Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}><Form.Item name="path" label={<Text strong>เส้นทางระบบ (Route Path)</Text>}><Input placeholder="/navigation" onChange={handlePathChange} prefix={<LinkOutlined />} /></Form.Item></Col>
            <Col span={12}><Form.Item name="component_name" label={<Text strong>คอมโพเนนต์ (Component)</Text>}><Select placeholder="เลือก Component" allowClear showSearch filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}>{AVAILABLE_COMPONENTS.map(c => <Option key={c} value={c}>{c}</Option>)}</Select></Form.Item></Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}><Form.Item name="icon" label={<Text strong>ไอคอน (Ant Design Icon)</Text>}><Select showSearch placeholder="ค้นหาไอคอน..." filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}>{iconList.map(icon => (<Option key={icon} value={icon}><Space>{React.createElement(AntIcons[icon])} {icon}</Space></Option>))}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="required_role" label={<Text strong>สิทธิ์การเข้าถึง (Roles)</Text>}><Select mode="multiple" placeholder="เลือกกลุ่มผู้ใช้"><Option value="admin">Admin</Option><Option value="head_technician">Head Tech</Option><Option value="technician">Technician</Option><Option value="user">User</Option></Select></Form.Item></Col>
          </Row>
          <Divider />
          <Row gutter={24} align="middle">
            <Col span={12}><Form.Item name="sort_order" label={<Text strong>ลำดับการเรียง (Order)</Text>}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}>
                <Form.Item name="is_active" label={<Text strong>สถานะระบบ</Text>} valuePropName="checked"><Switch checkedChildren="เปิด" unCheckedChildren="ปิด" /></Form.Item>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: -10 }}>แสดงผลเมนูนี้ในระบบ</Text>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
