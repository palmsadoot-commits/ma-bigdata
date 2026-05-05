import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, Select, Popconfirm, Avatar, message, Row, Col } from 'antd';
import { UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, ProjectOutlined, MailOutlined } from '@ant-design/icons';
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError } from '../utils/alert';
import { API_BASE_URL } from '../utils/config';

const { Title, Text } = Typography;
const { Option } = Select;
const BACKEND_URL = API_BASE_URL;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, projRes] = await Promise.all([
        axiosInstance.get('/users'),
        axiosInstance.get('/projects')
      ]);
      setUsers(userRes.data);
      setProjects(projRes.data);
    } catch (error) {
      alertError('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ✅ แก้ไขปัญหา Warning useForm: ใช้ useEffect ติดตามการเปิด Modal เพื่อ Set ค่า
  useEffect(() => {
    if (isModalVisible && editingUser) {
      form.setFieldsValue({
        ...editingUser,
        new_password: '' 
      });
    } else if (isModalVisible && !editingUser) {
      form.resetFields();
    }
  }, [isModalVisible, editingUser, form]);

  const handleAdd = () => {
    setEditingUser(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      alertSuccess('ลบสำเร็จ', 'ผู้ใช้งานถูกลบออกจากระบบแล้ว');
      fetchData();
    } catch (error) {
      alertError('ลบไม่สำเร็จ', 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingUser) {
        await axiosInstance.put(`/users/${editingUser.user_id}`, values);
        alertSuccess('อัปเดตสำเร็จ', 'แก้ไขข้อมูลผู้ใช้งานเรียบร้อย');
      } else {
        await axiosInstance.post('/register', values);
        alertSuccess('เพิ่มสำเร็จ', 'ลงทะเบียนผู้ใช้งานใหม่เรียบร้อย');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      alertError('บันทึกไม่สำเร็จ', error.response?.data?.error || 'ข้อมูลไม่ถูกต้องตาม Schema');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTag = (role) => {
    const roles = {
      admin: { color: 'magenta', text: 'ผู้ดูแลระบบ' },
      head_technician: { color: 'volcano', text: 'หัวหน้าช่าง' },
      technician: { color: 'blue', text: 'ช่างเทคนิค' },
      user: { color: 'green', text: 'ผู้ใช้งานทั่วไป' }
    };
    const r = roles[role] || { color: 'default', text: role };
    return <Tag color={r.color} style={{ borderRadius: 10, padding: '2px 10px' }}>{r.text}</Tag>;
  };

  const columns = [
    {
      title: 'ผู้ใช้งาน',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.user_photo && record.user_photo !== 'noimg.jpg' ? `${BACKEND_URL}/uploads/avatars/${record.user_photo}` : null}
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.first_name} {record.last_name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>@{record.username}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'สิทธิ์การใช้งาน',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role)
    },
    {
      title: 'หน่วยงาน / สังกัด',
      dataIndex: 'agency',
      key: 'agency',
      render: (text) => text || '-'
    },
    {
      title: 'โครงการที่ดูแล',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text) => text ? <Tag icon={<ProjectOutlined />} color="processing">{text}</Tag> : <Text type="disabled">ทั้งหมด</Text>
    },
    {
      title: 'จัดการ',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button type="primary" ghost icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="ยืนยันการลบผู้ใช้งาน?"
            onConfirm={() => handleDelete(record.user_id)}
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger ghost icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <TeamOutlined style={{ marginRight: 10, color: '#1890ff' }} /> จัดการผู้ใช้งานระบบ
        </Title>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAdd} style={{ borderRadius: 8 }}>
          เพิ่มผู้ใช้งาน
        </Button>
      </div>

      <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="user_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingUser ? <><EditOutlined /> แก้ไขข้อมูลผู้ใช้งาน</> : <><PlusOutlined /> เพิ่มผู้ใช้งานใหม่</>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        destroyOnHidden
        focusable={{ focusTriggerAfterClose: false }}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="ชื่อผู้ใช้งาน (Username)" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined />} disabled={!!editingUser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name={editingUser ? "new_password" : "password"} 
                label={editingUser ? "เปลี่ยนรหัสผ่าน (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน"} 
                rules={[{ required: !editingUser, message: 'กรุณาระบุรหัสผ่าน' }]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="first_name" label="ชื่อจริง" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label="นามสกุล" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="อีเมล (Email)" rules={[{ type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }]}>
                <Input prefix={<MailOutlined />} placeholder="example@mail.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="agency" label="หน่วยงาน / สังกัด">
                <Input placeholder="เช่น กองแผนงาน" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="สิทธิ์การใช้งาน" rules={[{ required: true }]}>
                <Select>
                  <Option value="admin">ผู้ดูแลระบบ (Admin)</Option>
                  <Option value="head_technician">หัวหน้าช่าง (Head Technician)</Option>
                  <Option value="technician">ช่างเทคนิค (Technician)</Option>
                  <Option value="user">ผู้ใช้งานทั่วไป (User)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="project_id" label="โครงการที่รับผิดชอบ (สำหรับช่าง)">
                <Select placeholder="เลือกโครงการ" allowClear>
                  {projects.map(p => <Option key={p.project_id} value={p.project_id}>{p.project_name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
