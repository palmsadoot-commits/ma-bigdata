import React from 'react';
import { Card, Row, Col, Typography, Divider, theme } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  TeamOutlined, 
  NotificationOutlined, 
  BarChartOutlined,
  TagsOutlined,
  AppstoreOutlined,
  LinkOutlined,
  CloudServerOutlined,
  ShopOutlined, // ไอคอนสำหรับบริษัทผู้รับจ้าง
  HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { useToken } = theme;

export default function Settings() {
  const { token } = useToken();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const menuCardStyle = {    textAlign: 'center', cursor: 'pointer', borderRadius: '12px',
    boxShadow: token.boxShadowTertiary, transition: 'transform 0.2s'
  };

  return (
    <div style={{ padding: '20px', backgroundColor: token.colorBgLayout, minHeight: '100vh' }}>
      <Title level={2} style={{ marginBottom: 30 }}>
        <SettingOutlined /> ตั้งค่าระบบ
      </Title>

      <Divider titlePlacement="left" style={{ borderColor: token.colorBorder }}>ข้อมูลส่วนตัว</Divider>
      <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card hoverable style={{ ...menuCardStyle, backgroundColor: token.colorInfo }} styles={{ body: { padding: '20px 10px' } }} onClick={() => navigate('/profile')}>
            <UserOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
            <Text strong style={{ display: 'block', color: '#fff' }}>ข้อมูลส่วนตัว</Text>
          </Card>
        </Col>
      </Row>

      <Divider titlePlacement="left" style={{ borderColor: token.colorBorder }}>เกี่ยวกับระบบ</Divider>
      <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
        {isAdmin && (
          <>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card hoverable style={{ ...menuCardStyle, backgroundColor: token.colorPrimary }} styles={{ body: { padding: '20px 10px' } }} onClick={() => navigate('/system-settings')}>
                <SettingOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
                <Text strong style={{ display: 'block', color: '#fff' }}>ตั้งค่าระบบ</Text>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card hoverable style={{ ...menuCardStyle, backgroundColor: token.colorPrimary }} styles={{ body: { padding: '20px 10px' } }} onClick={() => navigate('/users')}>
                <TeamOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
                <Text strong style={{ display: 'block', color: '#fff' }}>ผู้ใช้งานระบบ</Text>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card hoverable style={{ ...menuCardStyle, backgroundColor: token.colorPrimary }} styles={{ body: { padding: '20px 10px' } }}>
                <NotificationOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
                <Text strong style={{ display: 'block', color: '#fff' }}>ประชาสัมพันธ์</Text>
              </Card>
            </Col>
          </>
        )}
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card hoverable style={{ ...menuCardStyle, backgroundColor: token.colorPrimary }} styles={{ body: { padding: '20px 10px' } }} onClick={() => navigate('/reports')}>
            <BarChartOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
            <Text strong style={{ display: 'block', color: '#fff' }}>รายงานวิเคราะห์</Text>
          </Card>
        </Col>
      </Row>

      {isAdmin && (
        <>
          <Divider titlePlacement="left" style={{ borderColor: token.colorBorder }}>ผู้ดูแลระบบ (Admin)</Divider>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card hoverable style={{ ...menuCardStyle, backgroundColor: '#8b5cf6' }} styles={{ body: { padding: '20px 10px' } }} onClick={() => navigate('/statuses')}>
                <TagsOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
                <Text strong style={{ display: 'block', color: '#fff' }}>ป้ายสถานะ</Text>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card hoverable style={{ ...menuCardStyle, backgroundColor: '#ea580c' }} styles={{ body: { padding: '20px 10px' } }} onClick={() => navigate('/navigation')}>
                <LinkOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
                <Text strong style={{ display: 'block', color: '#fff' }}>เมนู & ลิงค์</Text>
              </Card>
            </Col>

            <Col xs={12} sm={8} md={6} lg={4}>
              <Card hoverable style={{ ...menuCardStyle, backgroundColor: token.colorError }} styles={{ body: { padding: '20px 10px' } }}>
                <TeamOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
                <Text strong style={{ display: 'block', color: '#fff' }}>สิทธิ์การเข้าถึง</Text>
              </Card>
            </Col>

            {/* ✅ เมนูหลักของการจัดการโครงการและหมวดหมู่ */}
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card hoverable style={{ ...menuCardStyle, backgroundColor: token.colorError }} styles={{ body: { padding: '20px 10px' } }} onClick={() => navigate('/categories')}>
                <AppstoreOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
                <Text strong style={{ display: 'block', color: '#fff' }}>โครงการ / หมวดหมู่</Text>
              </Card>
            </Col>

            {/* ✅ คงไว้แค่บริษัทผู้รับจ้าง เพราะต้องใช้เป็นฐานข้อมูลตัวเลือกในหน้าโครงการ */}
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card hoverable style={{ ...menuCardStyle, backgroundColor: token.colorError }} styles={{ body: { padding: '20px 10px' } }} onClick={() => navigate('/vendors')}>
                <ShopOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
                <Text strong style={{ display: 'block', color: '#fff' }}>บริษัทผู้รับจ้าง</Text>
              </Card>
            </Col>

            <Col xs={12} sm={8} md={6} lg={4}>
              <Card hoverable style={{ ...menuCardStyle, backgroundColor: '#722ed1' }} styles={{ body: { padding: '20px 10px' } }} onClick={() => navigate('/system-logs')}>
                <HistoryOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
                <Text strong style={{ display: 'block', color: '#fff' }}>System Logs</Text>
              </Card>
            </Col>

            <Col xs={12} sm={8} md={6} lg={4}>
              <Card hoverable style={{ ...menuCardStyle, backgroundColor: token.colorInfo }} styles={{ body: { padding: '20px 10px' } }} onClick={() => navigate('/backup')}>
                <CloudServerOutlined style={{ fontSize: '40px', color: '#fff', marginBottom: '10px' }} />
                <Text strong style={{ display: 'block', color: '#fff' }}>Backup & Cleanup</Text>
              </Card>
            </Col>

          </Row>
        </>
      )}
    </div>
  );
}