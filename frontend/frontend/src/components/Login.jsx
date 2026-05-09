import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, Divider, Space, ConfigProvider, Flex } from 'antd';
import { UserOutlined, LockOutlined, MessageOutlined, GoogleOutlined, RocketOutlined } from '@ant-design/icons';
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
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: 440, 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
          borderRadius: 20, 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            backgroundColor: '#1677ff', 
            borderRadius: 16, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px',
            boxShadow: '0 10px 15px -3px rgba(22, 119, 255, 0.3)'
          }}>
            <RocketOutlined style={{ fontSize: 32, color: 'white' }} />
          </div>
          <Title level={2} style={{ color: '#0f172a', margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>LMIS Big Data</Title>
          <Text style={{ color: '#64748b', fontSize: 15 }}>ระบบบริหารจัดการแจ้งซ่อมโครงการอัจฉริยะ</Text>
        </div>

        <Form name="login_form" layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item 
            name="username" 
            rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้งาน!' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="Username" 
              size="large" 
              style={{ borderRadius: 10, height: 50, border: '1px solid #e2e8f0' }}
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="Password" 
              size="large" 
              style={{ borderRadius: 10, height: 50, border: '1px solid #e2e8f0' }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 10, marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              loading={loading} 
              style={{ 
                borderRadius: 10, 
                height: 50, 
                fontWeight: 600, 
                fontSize: 16,
                boxShadow: '0 4px 6px -1px rgba(22, 119, 255, 0.2)'
              }}
            >
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>หรือเข้าใช้งานผ่านช่องทางอื่น</Text>
        </Divider>

        <Flex vertical gap={16} style={{ width: '100%' }}>
          {/* LINE Button */}
          <Button 
            block 
            size="large" 
            onClick={handleLineLogin}
            style={{ 
              backgroundColor: '#06C755', 
              color: 'white', 
              border: 'none', 
              borderRadius: 12,
              fontWeight: 700,
              height: 54,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 6px -1px rgba(6, 199, 85, 0.2)'
            }}
            className="social-btn-line"
          >
            <img src="/images/line.png" alt="LINE" style={{ width: 24, height: 24 }} />
            Sign in with LINE
          </Button>

          {/* Google Button */}
          <Button 
            block 
            size="large" 
            onClick={handleGoogleLogin}
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#374151', 
              border: '1px solid #e5e7eb', 
              borderRadius: 12,
              fontWeight: 700,
              height: 54,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            className="social-btn-google"
          >
            <img src="/images/google.png" alt="Google" style={{ width: 20, height: 20 }} />
            Sign in with Google
          </Button>
        </Flex>
      </Card>

      <style>{`
        .social-btn-line:hover {
          background-color: #05b34c !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(6, 199, 85, 0.3) !important;
        }
        .social-btn-google:hover {
          background-color: #f9fafb !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          border-color: #d1d5db !important;
        }
        .social-btn-line:active, .social-btn-google:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
