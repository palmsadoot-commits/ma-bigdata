import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ เพิ่ม useLocation
import { Card, Row, Col, Typography, Form, Input, Button, Avatar, Upload, Divider, Space, message, Spin, Tag } from 'antd';
import { UserOutlined, UploadOutlined, SaveOutlined, KeyOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, LoadingOutlined, MessageOutlined, CheckCircleOutlined, LinkOutlined } from '@ant-design/icons'; // ✅ เพิ่มไอคอน
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError } from '../utils/alert'; 
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/config';

const { Title, Text } = Typography;
const BACKEND_URL = API_BASE_URL;

export default function Profile() {
  const { user: currentUser, login } = useAuth();
  const location = useLocation(); 
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  const fetchLatestProfile = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/users/profile');
      if (res.data) {
        // อัปเดตข้อมูลใน AuthContext และ LocalStorage
        login({ ...currentUser, ...res.data });
      }
    } catch (err) {
      console.error("Failed to fetch latest profile:", err);
    }
  }, [currentUser, login]);

  useEffect(() => {
    // ดึงข้อมูลล่าสุดเสมอเมื่อเข้าหน้านี้ เพื่อเช็คสถานะ Social Linking
    fetchLatestProfile();
  }, []);

  useEffect(() => {
    // ✅ ตรวจสอบถ้ากลับมาจาก Social Linking พร้อมสถานะสำเร็จ
    const params = new URLSearchParams(location.search);
    if (params.get('linked') === 'success') {
      alertSuccess('ผูกบัญชีสำเร็จ!', 'บัญชีของคุณเชื่อมต่อเรียบร้อยแล้ว');
      // เคลียร์ URL เพื่อไม่ให้ Alert ค้าง
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchLatestProfile();
    }
  }, [location, fetchLatestProfile]);

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        username: currentUser.username, 
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        position: currentUser.position || '', 
        department: currentUser.agency || currentUser.department || '', 
        email: currentUser.email || '',
        telephone: currentUser.telephone || '',
        mobile: currentUser.mobile || '',
      });
    }
  }, [form, currentUser]);

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      let updatedSections = [];
      
      if (
        values.first_name !== currentUser.first_name || 
        values.last_name !== currentUser.last_name || 
        values.position !== currentUser.position || 
        values.department !== (currentUser.agency || currentUser.department)
      ) {
        updatedSections.push('ข้อมูลพื้นฐาน');
      }

      if (
        values.email !== currentUser.email || 
        values.telephone !== currentUser.telephone || 
        values.mobile !== currentUser.mobile
      ) {
        updatedSections.push('ข้อมูลติดต่อ');
      }

      await axiosInstance.put('/users/profile', {
        ...values,
        user_id: currentUser.user_id || currentUser.user_key 
      });
      
      const updatedUser = { ...currentUser, ...values };
      login(updatedUser);
      
      let successDetail = 'ไม่มีการเปลี่ยนแปลงข้อมูล';
      if (updatedSections.length > 0) {
        successDetail = `อัปเดต ${updatedSections.join(' และ ')} เรียบร้อยแล้ว`;
        alertSuccess('อัปเดตสำเร็จ!', successDetail);
      } else {
        message.info('ข้อมูลเหมือนเดิม ไม่มีการเปลี่ยนแปลง');
      }
      
    } catch (error) {
      console.error("Profile Update Error:", error);
      let errorMsg = 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้';
      if (error.response) {
        errorMsg = error.response.data.error || error.response.data.message || `Error Code: ${error.response.status}`;
      } else if (error.message) {
        errorMsg = error.message;
      }
      alertError('อัปเดตไม่สำเร็จ!', `สาเหตุ: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (values) => {
    if (values.new_password !== values.confirm_password) {
      return message.error('รหัสผ่านใหม่ไม่ตรงกัน!');
    }
    setLoading(true);
    try {
      await axiosInstance.put('/users/password', {
        user_id: currentUser.user_id || currentUser.user_key,
        old_password: values.old_password,
        new_password: values.new_password
      });
      
      alertSuccess('เปลี่ยนรหัสผ่านสำเร็จ!', 'ระบบได้อัปเดตรหัสผ่านใหม่ของคุณเรียบร้อยแล้ว');
      passwordForm.resetFields();
    } catch (error) {
      let errorMsg = 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
      if (error.response) {
        errorMsg = error.response.data.error || error.response.data.message || `Error Code: ${error.response.status}`;
      }
      alertError('เปลี่ยนรหัสไม่ได้!', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setUploadingAvatar(true);
      return;
    }
    
    if (info.file.status === 'done') {
      const newAvatarFilename = info.file.response.filename;
      
      const reader = new FileReader();
      reader.onload = e => setProfileImage(e.target.result);
      reader.readAsDataURL(info.file.originFileObj);

      const updatedUser = { ...currentUser, user_photo: newAvatarFilename };
      login(updatedUser);

      alertSuccess('เปลี่ยนรูปโปรไฟล์สำเร็จ!', 'อัปเดตไฟล์ภาพโปรไฟล์ลงฐานข้อมูลเรียบร้อยแล้ว');
      setUploadingAvatar(false);
      
    } else if (info.file.status === 'error') {
      // ✅ ดึงข้อความ Error จาก Server มาโชว์
      const errorMsg = info.file.response?.error || 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์';
      message.error(`อัปโหลดไม่สำเร็จ: ${errorMsg}`);
      setUploadingAvatar(false);
    }
  };

  const nameRules = [
    { required: true, message: 'กรุณากรอกข้อมูลช่องนี้' },
    { pattern: /^[a-zA-Zก-๙\s]+$/, message: 'กรุณากรอกเฉพาะตัวอักษร (ห้ามใส่ตัวเลขหรือสัญลักษณ์พิเศษ)' }
  ];

  const phoneRules = [
    { pattern: /^[\d\s\-\+\(\)]+$/, message: 'กรุณากรอกเฉพาะตัวเลข หรือสัญลักษณ์ - + ( ) เท่านั้น' },
    { min: 9, message: 'เบอร์โทรศัพท์สั้นเกินไป กรุณาตรวจสอบให้ถูกต้อง' }
  ];

  const emailRules = [
    {
      validator: (_, value) => {
        if (!value) return Promise.resolve(); 
        if (!value.includes('@')) {
          return Promise.reject(new Error('รูปแบบอีเมลไม่ถูกต้อง (ขาดเครื่องหมาย @)'));
        }
        const domainPart = value.split('@')[1];
        if (!domainPart || !domainPart.includes('.')) {
          return Promise.reject(new Error('รูปแบบอีเมลไม่ถูกต้อง (ขาดนามสกุลโดเมน เช่น .com, .co.th)'));
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
           return Promise.reject(new Error('โครงสร้างอีเมลยังไม่สมบูรณ์ กรุณาตรวจสอบอีกครั้ง'));
        }
        return Promise.resolve();
      }
    }
  ];

  if (!currentUser) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <Title level={2} style={{ color: '#2a1a4a', marginBottom: 30 }}>
        <UserOutlined /> ข้อมูลส่วนตัว (Profile)
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8} lg={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Spin spinning={uploadingAvatar} description="กำลังอัปโหลด..." indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
              <Avatar 
                size={150} 
                icon={!uploadingAvatar && <UserOutlined />} 
                src={profileImage || (currentUser.user_photo && currentUser.user_photo !== 'noimg.jpg' ? (currentUser.user_photo.startsWith('http') ? currentUser.user_photo : `${BACKEND_URL}/uploads/avatars/${currentUser.user_photo}`) : null)}
                style={{ backgroundColor: profileImage || (currentUser.user_photo && currentUser.user_photo !== 'noimg.jpg') ? 'transparent' : '#1890ff', marginBottom: 20, border: '1px solid #d9d9d9' }} 
                onError={() => {
                  setProfileImage(null); 
                  return true; 
                }}
              />
            </Spin>
            <Title level={4} style={{ marginBottom: 5 }}>{currentUser.first_name} {currentUser.last_name}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>{currentUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}</Text>
            
            <Upload 
              showUploadList={false} 
              action={`${BACKEND_URL}/api/users/upload-avatar`}
              name="avatar" 
              data={{ user_id: currentUser.user_id || currentUser.user_key }}
              onChange={handleAvatarChange} 
              accept="image/*" 
            >
              <Button icon={<UploadOutlined />} block loading={uploadingAvatar}>
                {uploadingAvatar ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
              </Button>
            </Upload>
          </Card>

          <Card title={<><KeyOutlined /> เปลี่ยนรหัสผ่าน</>} style={{ borderRadius: 12, marginTop: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} styles={{ header: { backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' } }}>
            <Form form={passwordForm} layout="vertical" onFinish={handleUpdatePassword}>
              <Form.Item name="old_password" label="รหัสผ่านเดิม" rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านเดิม' }]}>
                <Input.Password placeholder="กรอกรหัสผ่านเดิม" />
              </Form.Item>
              <Form.Item name="new_password" label="รหัสผ่านใหม่" rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านใหม่', min: 6 }]}>
                <Input.Password placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" />
              </Form.Item>
              <Form.Item name="confirm_password" label="ยืนยันรหัสผ่านใหม่" rules={[{ required: true, message: 'กรุณายืนยันรหัสผ่านใหม่' }]}>
                <Input.Password placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} style={{ backgroundColor: '#2a1a4a', borderColor: '#2a1a4a' }}>
                อัปเดตรหัสผ่าน
              </Button>
            </Form>
          </Card>

          <Card title={<><LinkOutlined /> การเชื่อมต่อโซเชียล</>} style={{ borderRadius: 12, marginTop: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} styles={{ header: { backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' } }}>
              <div style={{ padding: '5px 0' }}>
                  {/* LINE Section */}
                  <div style={{ textAlign: 'center', marginBottom: 25 }}>
                      <img src="/images/line.png" alt="LINE" style={{ width: 40, height: 40, marginBottom: 10, borderRadius: '8px' }} />
                      <Title level={5} style={{ margin: 0, fontSize: 16 }}>LINE Connection</Title>
                      <div style={{ margin: '10px 0' }}>
                          {currentUser.line_id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                  <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 20, padding: '2px 10px' }}>เชื่อมต่อแล้ว</Tag>
                                  <Text type="secondary" style={{ fontSize: 11 }}>ID: {currentUser.line_id.substring(0, 10)}...</Text>
                              </div>
                          ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                  <Tag color="default" style={{ borderRadius: 20 }}>ยังไม่ได้เชื่อมต่อ</Tag>
                                  <Button 
                                      type="primary" 
                                      size="small"
                                      icon={<LinkOutlined />} 
                                      onClick={() => window.location.href = `${API_BASE_URL}/api/auth/line/link?user_id=${currentUser.user_id || currentUser.user_key}`}
                                      style={{ backgroundColor: '#06C755', borderColor: '#06C755' }}
                                  >
                                    ผูกบัญชี LINE
                                  </Button>
                              </div>
                          )}
                      </div>
                  </div>

                  <Divider style={{ margin: '15px 0' }} />

                  {/* Google Section */}
                  <div style={{ textAlign: 'center' }}>
                      <img src="/images/google.png" alt="Google" style={{ width: 40, height: 40, marginBottom: 10, borderRadius: '8px' }} />
                      <Title level={5} style={{ margin: 0, fontSize: 16 }}>Google Connection</Title>
                      <div style={{ margin: '10px 0' }}>
                          {currentUser.google_id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                  <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 20, padding: '2px 10px' }}>เชื่อมต่อแล้ว</Tag>
                                  <Text type="secondary" style={{ fontSize: 11 }}>ID: {currentUser.google_id.substring(0, 10)}...</Text>
                              </div>
                          ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                  <Tag color="default" style={{ borderRadius: 20 }}>ยังไม่ได้เชื่อมต่อ</Tag>
                                  <Button 
                                      type="primary" 
                                      size="small"
                                      danger
                                      icon={<LinkOutlined />} 
                                      onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google/link?user_id=${currentUser.user_id || currentUser.user_key}`}
                                  >
                                    ผูกบัญชี Google
                                  </Button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </Card>
        </Col>

        <Col xs={24} md={16} lg={18}>
          <Card title={<><IdcardOutlined /> รายละเอียดข้อมูล</>} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} styles={{ header: { backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' } }}>
            <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
              
              <Divider titlePlacement="left" style={{ marginTop: 0 }}>ข้อมูลล็อกอิน</Divider>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="username" label="ชื่อผู้ใช้งาน">
                    <Input disabled style={{ backgroundColor: '#f5f5f5', color: '#666' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider titlePlacement="left">ข้อมูลพื้นฐาน</Divider>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="first_name" label="ชื่อจริง" rules={nameRules}>
                    <Input placeholder="กรอกชื่อจริง (ตัวอักษรเท่านั้น)" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="last_name" label="นามสกุล" rules={nameRules}>
                    <Input placeholder="กรอกนามสกุล (ตัวอักษรเท่านั้น)" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="position" label="ตำแหน่ง">
                    <Input placeholder="เช่น นักวิชาการคอมพิวเตอร์" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="department" label="หน่วยงาน/สังกัด">
                    <Input placeholder="เช่น ศูนย์เทคโนโลยีสารสนเทศฯ" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider titlePlacement="left">ข้อมูลติดต่อ</Divider>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                 <Form.Item name="email" label="อีเมล" rules={emailRules}>
                    <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="example@mail.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="telephone" label="เบอร์โทรศัพท์ (โต๊ะทำงาน)" rules={phoneRules}>
                    <Input prefix={<PhoneOutlined className="site-form-item-icon" />} placeholder="เช่น 02-123-4567" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="mobile" label="เบอร์โทรศัพท์มือถือ" rules={phoneRules}>
                    <Input prefix={<PhoneOutlined className="site-form-item-icon" />} placeholder="เช่น 081-234-5678" />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: 'right', marginTop: 20 }}>
                <Space>
                  <Button type="default" onClick={() => form.resetFields()}>คืนค่าเดิม</Button>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} style={{ backgroundColor: '#1890ff', borderRadius: 6, padding: '0 30px' }}>
                    บันทึกข้อมูลส่วนตัว
                  </Button>
                </Space>
              </div>

            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}