import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Select, Row, Col, Divider, Space, Spin, Modal } from 'antd';
import { RocketOutlined, IdcardOutlined, BankOutlined, UserOutlined, PhoneOutlined, SaveOutlined, MailOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { alertSuccess, alertError } from '../utils/alert';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Onboarding() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [fetchingProjects, setFetchingProjects] = useState(true);

  useEffect(() => {
    // ดึงข้อมูลโครงการทั้งหมด
    axiosInstance.get('/projects')
      .then(res => setProjects(res.data))
      .catch(err => console.error('Error fetching projects:', err))
      .finally(() => setFetchingProjects(false));

    if (user) {
      form.setFieldsValue({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        telephone: user.telephone || '',
        mobile: user.mobile || '',
        agency: user.agency || '',
        position: user.position || '',
      });
    }
  }, [user, form]);

  const handleCancel = () => {
    Modal.confirm({
      title: 'ต้องการยกเลิกและออกจากระบบ?',
      content: 'หากคุณเลือกบัญชีผิด คุณสามารถออกจากระบบเพื่อเข้าสู่ระบบใหม่ได้',
      okText: 'ออกจากระบบ',
      cancelText: 'ยกเลิก',
      okButtonProps: { danger: true },
      onOk: () => {
        if (logout) {
          logout(); // ฟังก์ชันนี้เคลียร์ localStorage ให้ด้วย
        } else {
          localStorage.removeItem('user');
        }
        navigate('/login');
      }
    });
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axiosInstance.put('/users/complete-profile', values);
      
      if (res.data.success) {
        // อัปเดต State User ใน Context
        const updatedUser = { 
          ...user, 
          ...values, 
          requires_onboarding: false 
        };
        login(updatedUser);

        alertSuccess('บันทึกข้อมูลสำเร็จ!', 'ยินดีต้อนรับเข้าสู่ระบบ LMIS Big Data');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
      alertError('เกิดข้อผิดพลาด!', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProjects) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" tip="กำลังโหลดข้อมูลพื้นฐาน..." /></div>;

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#f0f2f5',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          maxWidth: 700, 
          width: '100%', 
          borderRadius: 15, 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: 'none'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <RocketOutlined style={{ fontSize: 50, color: '#1890ff', marginBottom: 15 }} />
          <Title level={2}>ข้อมูลเพิ่มเติมเพื่อเริ่มต้นใช้งาน</Title>
          <Text type="secondary">ยินดีต้อนรับ! กรุณากรอกข้อมูลหน่วยงานและเลือกโครงการที่เกี่ยวข้องกับคุณ</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Divider titlePlacement="left"><IdcardOutlined /> ข้อมูลพื้นฐาน</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="first_name" label="ชื่อจริง" rules={[{ required: true, message: 'กรุณากรอกชื่อจริง' }]}>
                <Input prefix={<UserOutlined />} placeholder="ชื่อ" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="last_name" label="นามสกุล" rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}>
                <Input prefix={<UserOutlined />} placeholder="นามสกุล" />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left"><BankOutlined /> สังกัดและโครงการ</Divider>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="project_id" label="โครงการที่รับผิดชอบ" rules={[{ required: true, message: 'กรุณาเลือกโครงการ' }]}>
                <Select placeholder="เลือกโครงการที่เกี่ยวข้อง" size="large">
                  {projects.map(p => (
                    <Option key={p.project_id} value={p.project_id}>{p.project_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="agency" label="หน่วยงาน/สำนัก" rules={[{ required: true, message: 'กรุณากรอกหน่วยงาน' }]}>
                <Input prefix={<BankOutlined />} placeholder="เช่น ศูนย์เทคโนโลยีสารสนเทศฯ" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="position" label="ตำแหน่ง" rules={[{ required: true, message: 'กรุณากรอกตำแหน่ง' }]}>
                <Input prefix={<IdcardOutlined />} placeholder="เช่น นักวิชาการคอมพิวเตอร์" />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left"><PhoneOutlined /> ข้อมูลติดต่อเพิ่มเติม</Divider>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="email" label="อีเมล" rules={[{ pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'รูปแบบอีเมลไม่ถูกต้อง' }]}>
                <Input prefix={<MailOutlined />} placeholder="เช่น example@mol.go.th" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="telephone" label="เบอร์โทรศัพท์โต๊ะทำงาน">
                <Input prefix={<PhoneOutlined />} placeholder="เช่น 02-123-4567" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="mobile" label="เบอร์โทรศัพท์มือถือ" rules={[{ required: true, message: 'กรุณากรอกเบอร์มือถือ' }]}>
                <Input prefix={<PhoneOutlined />} placeholder="เช่น 081-234-5678" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginTop: 30, display: 'flex', gap: '15px' }}>
            <Button 
              size="large" 
              onClick={handleCancel}
              icon={<LogoutOutlined />}
              style={{ flex: 1, height: 50, borderRadius: 8, fontSize: 16 }}
            >
              ย้อนกลับ (เลือกล็อกอินใหม่)
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              loading={loading}
              icon={<SaveOutlined />}
              style={{ flex: 2, height: 50, borderRadius: 8, fontSize: 16 }}
            >
              เริ่มต้นใช้งานระบบ
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
