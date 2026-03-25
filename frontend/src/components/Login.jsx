import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import Swal from 'sweetalert2'; // ✅ นำเข้า Swal ตรงๆ เพื่อใช้ฟังก์ชันตั้งเวลา (Timer)

// ❌ ไม่ต้อง import alertSuccess จาก utils แล้วสำหรับหน้านี้
import { alertError } from '../utils/alert'; 

const { Title, Text } = Typography;

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/login', values);
      
      if (res.data.success) {
        // ✅ 1. แก้ไขให้ดึงชื่อ (first_name) และ นามสกุล (last_name) มาแสดง
        const fullName = `${res.data.user.first_name} ${res.data.user.last_name}`;

        // ✅ 2. แจ้งเตือนแบบ "โปร" (ตั้งเวลาปิดอัตโนมัติ ไม่ต้องกดตกลง)
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: `ยินดีต้อนรับคุณ ${fullName}`,
          showConfirmButton: false, // ซ่อนปุ่มตกลง
          timer: 1500, // ปิดอัตโนมัติใน 1.5 วินาที
          timerProgressBar: true, // มีหลอดวิ่งด้านล่างให้ดูมีมิติ
        });

        // ✅ 3. ดีเลย์นิดนึง (0.8 วินาที) ให้พอเห็นแอนิเมชันติ๊กถูก แล้วทะลุเข้าหน้าหลักเลย
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
      backgroundColor: '#f4f7f6' 
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={3} style={{ color: '#2a1a4a', margin: 0 }}>⚙️ LIMS Big Data</Title>
          <Text type="secondary">ระบบบริหารจัดการแจ้งซ่อมโครงการ</Text>
        </div>

        <Form name="login_form" layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้งาน!' }]}>
            <Input prefix={<UserOutlined style={{ color: '#ef8157' }} />} placeholder="ชื่อผู้ใช้งาน (Username)" size="large" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน!' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#ef8157' }} />} placeholder="รหัสผ่าน (Password)" size="large" />
          </Form.Item>

          <Form.Item style={{ marginTop: 30, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ backgroundColor: '#2a1a4a', borderColor: '#2a1a4a' }}>
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}