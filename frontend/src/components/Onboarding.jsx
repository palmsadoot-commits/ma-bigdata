import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Select, Row, Col, Divider, Space, Spin, Modal } from 'antd';
import { 
  RocketOutlined, IdcardOutlined, BankOutlined, UserOutlined, 
  PhoneOutlined, SaveOutlined, MailOutlined, LogoutOutlined,
  LockOutlined, KeyOutlined, EyeInvisibleOutlined, EyeTwoTone
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { alertSuccess, alertError } from '../utils/alert';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Onboarding() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user, login, logout, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [fetchingProjects, setFetchingProjects] = useState(true);

  // 🛡️ Page Protection Logic
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // หาก user ข้อมูลครบแล้ว (ไม่ต้องการ Onboarding) ให้เด้งไปหน้าหลัก
    if (user && !user.requires_onboarding) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // ดึงข้อมูลโครงการทั้งหมด (ดึงครั้งเดียวเมื่อ Component Mount)
    axiosInstance.get('/projects')
      .then(res => setProjects(res.data))
      .catch(err => console.error('Error fetching projects:', err))
      .finally(() => setFetchingProjects(false));
  }, []);

  useEffect(() => {
    // เซ็ตค่า Form ทันทีที่มีข้อมูล user (ทำงานเฉพาะเมื่อ user เปลี่ยนแปลง)
    if (user) {
      form.setFieldsValue({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        telephone: user.telephone || '',
        mobile: user.mobile || '',
        agency: user.agency || '',
        position: user.position || '',
        username: '', // ❌ ไม่แสดง Username ชั่วคราว บังคับให้ตั้งใหม่
        password: '', // ❌ ไม่แสดง Password ชั่วคราว บังคับให้ตั้งใหม่
      });
    }
  }, [user, form]);

  const handleCancel = () => {
    Modal.confirm({
      title: 'ต้องการยกเลิกและออกจากระบบ?',
      content: 'หากคุณยกเลิกในขั้นตอนนี้ ข้อมูลของคุณจะยังไม่ถูกบันทึกและไม่สามารถเข้าใช้งานระบบได้',
      okText: 'ออกจากระบบ',
      cancelText: 'อยู่ต่อ',
      okButtonProps: { danger: true },
      onOk: () => {
        logout();
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
      console.error('Onboarding error details:', err.response?.data);
      
      const errorData = err.response?.data;
      
      // 🛡️ Logic การจับคู่ Error กับช่องกรอกข้อมูล (Field-Level Error Mapping)
      if (errorData?.details && Array.isArray(errorData.details)) {
        // กรณีเป็น Validation Errors จาก Backend (Zod)
        const fieldErrors = errorData.details.map(d => ({
          name: d.field || (d.path && d.path[0]), // รองรับทั้งโครงสร้าง field และ path
          errors: [d.message]
        }));
        form.setFields(fieldErrors);
        alertError('ข้อมูลไม่ถูกต้อง', 'กรุณาตรวจสอบข้อผิดพลาดในช่องที่แสดงสีแดง');
      } else if (errorData?.error) {
        // กรณีเป็น Error ข้อความเดียว (เช่น Username ซ้ำ)
        const msg = errorData.error;
        if (msg.includes('ชื่อผู้ใช้งาน')) {
          form.setFields([{ name: 'username', errors: [msg] }]);
        } else if (msg.includes('อีเมล')) {
          form.setFields([{ name: 'email', errors: [msg] }]);
        }
        alertError('เกิดข้อผิดพลาด!', msg);
      } else {
        alertError('เกิดข้อผิดพลาด!', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || (user && !user.requires_onboarding)) return null;

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
          maxWidth: 750, 
          width: '100%', 
          borderRadius: 20, 
          boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
          border: 'none',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '30px 40px', background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', color: '#fff', textAlign: 'center' }}>
          <RocketOutlined style={{ fontSize: 40, marginBottom: 15 }} />
          <Title level={2} style={{ color: '#fff', margin: 0 }}>เริ่มต้นการใช้งาน</Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)' }}>กรุณากรอกข้อมูลสำคัญให้ครบถ้วนเพื่อความปลอดภัยและสิทธิ์การใช้งานของคุณ</Text>
        </div>

        <Spin spinning={fetchingProjects} description="กำลังโหลดข้อมูลพื้นฐาน...">
          <div style={{ padding: '40px' }}>
            <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={true}>
              <Divider titlePlacement="left" style={{ marginTop: 0 }}><IdcardOutlined /> ข้อมูลระบุตัวตน</Divider>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="first_name" label="ชื่อจริง" rules={[{ required: true, message: 'กรุณากรอกชื่อจริง' }]}>
                    <Input prefix={<UserOutlined />} placeholder="ชื่อ" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="last_name" label="นามสกุล" rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}>
                    <Input prefix={<UserOutlined />} placeholder="นามสกุล" size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider titlePlacement="left"><LockOutlined /> ความปลอดภัยและบัญชีเข้าใช้งาน (จำเป็น)</Divider>
              <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', border: '1px solid #f0f0f0', marginBottom: '24px' }}>
                <Row gutter={16}>
                  <Col xs={24}>
                    <Form.Item 
                      name="email" 
                      label="อีเมลที่ใช้ติดต่อ" 
                      rules={[
                        { required: true, message: 'กรุณากรอกอีเมล' },
                        { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
                      ]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="เช่น somchai@mol.go.th" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      name="username" 
                      label="ชื่อผู้ใช้งาน (Username)"
                      extra="ใช้สำหรับล็อกอินแบบปกติ"
                      rules={[
                        { required: true, message: 'กรุณาตั้งชื่อผู้ใช้งาน' },
                        { min: 4, message: 'อย่างน้อย 4 ตัวอักษร' },
                        { pattern: /^[a-zA-Z0-9._]+$/, message: 'ภาษาอังกฤษ, ตัวเลข, . _ เท่านั้น' }
                      ]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="เช่น somchai.m" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      name="password" 
                      label="รหัสผ่านเข้าสู่ระบบ"
                      extra="ห้ามบอกรหัสผ่านแก่ผู้อื่น"
                      rules={[
                        { required: true, message: 'กรุณาตั้งรหัสผ่าน' },
                        { min: 6, message: 'อย่างน้อย 6 ตัวอักษร' },
                        { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/, message: 'ต้องมี พิมพ์เล็ก, พิมพ์ใหญ่ และตัวเลข' }
                      ]}
                    >
                      <Input.Password 
                        prefix={<KeyOutlined />} 
                        placeholder="ตั้งรหัสผ่านใหม่" 
                        size="large"
                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

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
                    <Input prefix={<BankOutlined />} placeholder="เช่น ศูนย์เทคโนโลยีสารสนเทศฯ" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="position" label="ตำแหน่ง" rules={[{ required: true, message: 'กรุณากรอกตำแหน่ง' }]}>
                    <Input prefix={<IdcardOutlined />} placeholder="เช่น นักวิชาการคอมพิวเตอร์" size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider titlePlacement="left"><PhoneOutlined /> ข้อมูลติดต่อเพิ่มเติม</Divider>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="telephone" 
                    label="เบอร์โทรศัพท์โต๊ะทำงาน"
                    extra="เช่น 021234567 (ไม่จำเป็นต้องกรอก)"
                    rules={[
                      { pattern: /^0[2-7][0-9]{7,8}$/, message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' }
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="02XXXXXXX" size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="mobile" 
                    label="เบอร์โทรศัพท์มือถือ" 
                    rules={[
                      { required: true, message: 'กรุณากรอกเบอร์มือถือ' },
                      { pattern: /^0[689][0-9]{8}$/, message: 'รูปแบบเบอร์มือถือไม่ถูกต้อง (เช่น 0812345678)' }
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="08XXXXXXXX" size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ marginTop: 40, display: 'flex', gap: '20px' }}>
                <Button 
                  size="large" 
                  onClick={handleCancel}
                  icon={<LogoutOutlined />}
                  style={{ flex: 1, height: 55, borderRadius: 12 }}
                >
                  ยกเลิกและออก
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  loading={loading}
                  icon={<SaveOutlined />}
                  style={{ flex: 2, height: 55, borderRadius: 12, fontSize: 18, fontWeight: 700 }}
                >
                  บันทึกและเริ่มต้นใช้งาน
                </Button>
              </div>
            </Form>
          </div>
        </Spin>
      </Card>
    </div>
  );
}
