import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, Space, Tag, Modal, Form, Input, Select, Row, Col, Card, Avatar, Divider } from 'antd'; // ❌ เอา message ออก
import { UserAddOutlined, SettingOutlined, UserOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';

// ✅ นำเข้า Alert Helper
import { alertSuccess, alertError } from '../utils/alert';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Settings({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isAdminModalVisible, setIsAdminModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  
  const [adminForm] = Form.useForm();
  const [profileForm] = Form.useForm();

  useEffect(() => {
    if (currentUser?.role === 'admin') fetchAdminData();
  }, [currentUser]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/users'),
        axios.get('http://localhost:3000/api/projects')
      ]);
      setUsers(usersRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      alertError('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลระบบได้'); // ✅
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (values) => {
    try {
      await axios.post('http://localhost:3000/api/register', values);
      
      // ✅ ใช้ SweetAlert2
      await alertSuccess('สำเร็จ!', 'เพิ่มผู้ใช้งานเข้าระบบสำเร็จ!');
      
      setIsAdminModalVisible(false);
      adminForm.resetFields();
      fetchAdminData();
    } catch (error) {
      alertError('ผิดพลาด!', 'ไม่สามารถเพิ่มผู้ใช้ได้ (Username อาจซ้ำ)'); // ✅
    }
  };

  const showProfileModal = () => {
    profileForm.setFieldsValue({
      first_name: currentUser.first_name,
      last_name: currentUser.last_name,
      agency: currentUser.agency,
      new_password: '' 
    });
    setIsProfileModalVisible(true);
  };

  const handleUpdateProfile = async (values) => {
    try {
      const res = await axios.put(`http://localhost:3000/api/users/${currentUser.user_id}`, values);
      
      if (res.data.success) {
        setIsProfileModalVisible(false);
        localStorage.setItem('lims_user', JSON.stringify(res.data.user));
        
        // ✅ ใช้ SweetAlert2 รอจนกว่าผู้ใช้จะกด "ตกลง" ค่อยรีเฟรชหน้า
        alertSuccess('อัปเดตสำเร็จ!', 'ข้อมูลส่วนตัวของคุณถูกบันทึกเรียบร้อยแล้ว').then((result) => {
          if (result.isConfirmed) {
            window.location.reload(); 
          }
        });
      }
    } catch (error) {
      alertError('ข้อผิดพลาด!', 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล'); // ✅
    }
  };

  const columns = [
    { title: 'ชื่อผู้ใช้งาน (Login)', dataIndex: 'username', key: 'username', render: text => <b>{text}</b> },
    { title: 'ชื่อ-นามสกุล', key: 'fullname', render: (_, record) => `${record.first_name} ${record.last_name}` },
    { title: 'หน่วยงาน', dataIndex: 'agency', key: 'agency', render: text => text || '-' },
    { 
      title: 'สิทธิ์', 
      dataIndex: 'role', 
      key: 'role',
      render: role => {
        let color = 'blue'; let label = 'User';
        if (role === 'admin') { color = 'purple'; label = 'Admin'; }
        if (role === 'technician') { color = 'orange'; label = 'Technician'; }
        return <Tag color={color}>{label}</Tag>;
      }
    },
    { title: 'โปรเจกต์', dataIndex: 'project_name', key: 'project_name', render: text => text ? <Tag icon={<SettingOutlined/>}>{text}</Tag> : '-' }
  ];

  return (
    <div style={{ minHeight: '80vh' }}>
      
      <Card title="👤 ข้อมูลส่วนตัว (My Profile)" style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Row align="middle" gutter={24}>
          <Col><Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#2a1a4a' }} /></Col>
          <Col>
            <Title level={4} style={{ margin: 0 }}>{currentUser?.first_name} {currentUser?.last_name}</Title>
            <Text type="secondary">หน่วยงาน/สังกัด: {currentUser?.agency || 'ไม่ระบุ'}</Text><br />
            <Tag color={currentUser?.role === 'admin' ? 'purple' : currentUser?.role === 'technician' ? 'orange' : 'blue'} style={{ marginTop: 10 }}>
              ระดับสิทธิ์: {currentUser?.role}
            </Tag>
          </Col>
        </Row>
        <div style={{ marginTop: 20 }}>
          <Button type="primary" icon={<EditOutlined />} onClick={showProfileModal} style={{ backgroundColor: '#ef8157', borderColor: '#ef8157' }}>
            แก้ไขข้อมูลส่วนตัว / เปลี่ยนรหัสผ่าน
          </Button>
        </div>
      </Card>

      {currentUser?.role === 'admin' && (
        <div className="old-style-card">
          <Row justify="space-between" align="middle" style={{ borderBottom: '2px solid #2a1a4a', paddingBottom: 10, marginBottom: 20 }}>
            <Col><Title level={4} style={{ margin: 0 }}>⚙️ จัดการผู้ใช้งานระบบ</Title></Col>
            <Col>
              <Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsAdminModalVisible(true)} style={{ backgroundColor: '#2a1a4a' }}>
                เพิ่มพนักงาน / ช่าง
              </Button>
            </Col>
          </Row>
          <Table columns={columns} dataSource={users} rowKey="user_id" loading={loading} pagination={{ pageSize: 10 }} bordered scroll={{ x: 800 }} />
        </div>
      )}

      {/* Modal Profile */}
      <Modal title={<span><EditOutlined /> แก้ไขข้อมูลส่วนตัว</span>} open={isProfileModalVisible} onCancel={() => setIsProfileModalVisible(false)} footer={null}>
        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="first_name" label="ชื่อจริง" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="last_name" label="นามสกุล" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="agency" label="หน่วยงาน / สังกัด"><Input /></Form.Item>
          <Divider orientation="left">ความปลอดภัย</Divider>
          <Form.Item name="new_password" label="ตั้งรหัสผ่านใหม่ (หากไม่ต้องการเปลี่ยน ให้เว้นว่างไว้)">
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 30, marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsProfileModalVisible(false)}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#2a1a4a' }}>บันทึกการเปลี่ยนแปลง</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Admin */}
      <Modal title={<span><UserAddOutlined /> เพิ่มผู้ใช้งานใหม่</span>} open={isAdminModalVisible} onCancel={() => setIsAdminModalVisible(false)} footer={null}>
        <Form form={adminForm} layout="vertical" onFinish={handleAddUser}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="username" label="Username (Login)" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="password" label="รหัสผ่าน" rules={[{ required: true }]}><Input.Password /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="first_name" label="ชื่อจริง" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="last_name" label="นามสกุล" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="role" label="สิทธิ์การใช้งาน" rules={[{ required: true }]}>
            <Select>
              <Option value="user">User (ผู้แจ้งงาน)</Option>
              <Option value="technician">Technician (ลูกทีมช่าง)</Option>
              <Option value="head_technician">Head Tech / PM (หัวหน้าช่าง)</Option> 
              <Option value="admin">Admin (เจ้าของระบบ)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="project_id" label="สังกัดโปรเจกต์" rules={[{ required: true }]}>
            <Select>
              {projects.map(p => (<Option key={p.project_id} value={p.project_id}>{p.project_name}</Option>))}
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsAdminModalVisible(false)}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#ef8157' }}>บันทึกข้อมูล</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}