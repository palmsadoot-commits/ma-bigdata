import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, Divider, Space, ConfigProvider, Flex } from 'antd';
import { UserOutlined, LockOutlined, MessageOutlined, GoogleOutlined, ToolOutlined } from '@ant-design/icons';
import axiosInstance from '../services/api/axiosInstance';
import Swal from 'sweetalert2'; 
import { alertError } from '../utils/alert'; 
import { API_BASE_URL } from '../utils/config';

const { Title, Text } = Typography;

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleLineLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/line`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/users/login', values);
      
      if (res.data.success) {
        const fullName = `${res.data.user.first_name} ${res.data.user.last_name}`;

        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: `ยินดีต้อนรับคุณ ${fullName}`,
          showConfirmButton: false, 
          timer: 1500, 
          timerProgressBar: true,
          background: '#ffffff',
          color: '#1e293b'
        });

        setTimeout(() => {
          onLoginSuccess(res.data.user); 
        }, 800);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alertError('เข้าสู่ระบบไม่สำเร็จ!', 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        alertError('ข้อผิดพลาด!', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#020617', // Deepest Navy
      padding: '20px'
    }}>
      <Card
        style={{
          width: 440,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderRadius: 12,
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: '48px 40px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 56,
            height: 56,
            backgroundColor: '#2563eb',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 20px rgba(37, 99, 235, 0.2)'
          }}>
            <ToolOutlined style={{ fontSize: 28, color: 'white' }} />
          </div>
          <Title level={2} style={{ color: '#f8fafc', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>MA Big Data</Title>
          <Text style={{ color: '#94a3b8', fontSize: 13, letterSpacing: '0.02em', display: 'block', marginTop: 8 }}>ENGINEERING ACCESS PORTAL</Text>
        </div>

        <Form name="login_form" layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'INPUT REQUIRED' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#64748b' }} />}
              placeholder="USERNAME"
              size="large"
              style={{ borderRadius: 6, height: 48, background: '#1e293b', border: '1px solid #334155', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'INPUT REQUIRED' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#64748b' }} />}
              placeholder="PASSWORD"
              size="large"
              style={{ borderRadius: 6, height: 48, background: '#1e293b', border: '1px solid #334155', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{
                borderRadius: 6,
                height: 48,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.05em',
                background: '#2563eb',
                border: 'none',
                textTransform: 'uppercase'
              }}
            >
              AUTHENTICATE
            </Button>
          </Form.Item>
        </Form>
        <Divider plain>
          <Text style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>OR CONTINUE WITH</Text>
        </Divider>

        <Flex vertical gap={12} style={{ width: '100%' }}>
          {/* LINE Button */}
          <Button 
            block 
            size="large" 
            onClick={handleLineLogin}
            style={{ 
              backgroundColor: '#05c46b', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6,
              fontWeight: 700,
              height: 48,
              fontSize: 13,
              letterSpacing: '0.02em'
            }}
          >
            LINE ACCESS
          </Button>

          {/* Google Button */}
          <Button 
            block 
            size="large" 
            onClick={handleGoogleLogin}
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#0f172a', 
              border: '1px solid #1e293b', 
              borderRadius: 6,
              fontWeight: 700,
              height: 48,
              fontSize: 13,
              letterSpacing: '0.02em'
            }}
          >
            GOOGLE ID
          </Button>
        </Flex>
      </Card>
    </div>
  );
}
