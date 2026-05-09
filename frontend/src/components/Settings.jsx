import React from 'react';
import { Row, Col, Typography, Divider, theme } from 'antd';
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
  ShopOutlined, 
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

  const menuItems = [
    { section: "ข้อมูลส่วนตัว", items: [
      { label: 'ข้อมูลส่วนตัว', icon: <UserOutlined />, color: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)', path: '/profile', show: true }
    ]},
    { section: "เกี่ยวกับระบบ", items: [
      { label: 'ตั้งค่าระบบ', icon: <SettingOutlined />, color: 'linear-gradient(135deg, #8BC6EC 0%, #9599E2 100%)', path: '/system-settings', show: isAdmin },
      { label: 'ผู้ใช้งานระบบ', icon: <TeamOutlined />, color: 'linear-gradient(135deg, #FBAB7E 0%, #F7CE68 100%)', path: '/users', show: isAdmin },
      { label: 'ประชาสัมพันธ์', icon: <NotificationOutlined />, color: 'linear-gradient(135deg, #85FFBD 0%, #FFFB7D 100%)', path: null, show: isAdmin },
      { label: 'รายงานวิเคราะห์', icon: <BarChartOutlined />, color: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)', path: '/reports', show: true },
    ]},
    { section: "ผู้ดูแลระบบ (Admin)", items: [
      { label: 'ป้ายสถานะ', icon: <TagsOutlined />, color: 'linear-gradient(135deg, #A88BEB 0%, #F8CEEC 100%)', path: '/statuses', show: isAdmin },
      { label: 'เมนู & ลิงค์', icon: <LinkOutlined />, color: 'linear-gradient(135deg, #52ACFF 25%, #FFE32C 100%)', path: '/navigation', show: isAdmin },
      { label: 'สิทธิ์การเข้าถึง', icon: <TeamOutlined />, color: 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)', path: null, show: isAdmin },
      { label: 'โครงการ / หมวดหมู่', icon: <AppstoreOutlined />, color: 'linear-gradient(135deg, #00DBDE 0%, #FC00FF 100%)', path: '/categories', show: isAdmin },
      { label: 'บริษัทผู้รับจ้าง', icon: <ShopOutlined />, color: 'linear-gradient(135deg, #622774 0%, #c53364 100%)', path: '/vendors', show: isAdmin },
      { label: 'System Logs', icon: <HistoryOutlined />, color: 'linear-gradient(135deg, #21D4FD 0%, #B721FF 100%)', path: '/system-logs', show: isAdmin },
      { label: 'Backup & Cleanup', icon: <CloudServerOutlined />, color: 'linear-gradient(135deg, #08AEEA 0%, #2AF598 100%)', path: '/backup', show: isAdmin },
    ]}
  ];

  return (
    <div className="settings-page-wrapper" style={{ padding: '40px 20px', backgroundColor: token.colorBgLayout || '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 40, fontWeight: 800, color: '#1a3353', display: 'flex', alignItems: 'center' }}>
          <div style={{ background: token.colorPrimary, padding: '8px', borderRadius: '12px', marginRight: '15px', display: 'flex' }}>
            <SettingOutlined style={{ color: '#fff' }} />
          </div>
          ตั้งค่าระบบ
        </Title>

        {menuItems.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '50px' }}>
            {section.items.some(i => i.show) && (
              <>
                <Divider titlePlacement="left" style={{ borderColor: '#d1d5db' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#4b5563' }}>{section.section}</span>
                </Divider>
                <Row gutter={[24, 24]}>
                  {section.items.filter(i => i.show).map((item, itemIdx) => (
                    <Col xs={12} sm={8} md={6} lg={4} key={itemIdx}>
                      <div 
                        className="custom-menu-card"
                        style={{ background: item.color }}
                        onClick={() => item.path && navigate(item.path)}
                      >
                        <div className="icon-box">
                          {item.icon}
                        </div>
                        <div className="label-box">
                          <span className="card-label">{item.label}</span>
                        </div>
                        <div className="card-shine"></div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .custom-menu-card {
          height: 160px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .custom-menu-card:hover {
          transform: translateY(-12px) scale(1.05);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .icon-box {
          font-size: 52px;
          color: #ffffff;
          margin-bottom: 15px;
          z-index: 2;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
          transition: transform 0.3s ease;
        }

        .custom-menu-card:hover .icon-box {
          transform: scale(1.2) rotate(5deg);
        }

        .label-box {
          z-index: 2;
          width: 100%;
          text-align: center;
          padding: 0 10px;
        }

        .card-label {
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .card-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: all 0.6s;
        }

        .custom-menu-card:hover .card-shine {
          left: 100%;
        }

        /* สำหรับหน้าจอเล็ก */
        @media (max-width: 576px) {
          .custom-menu-card {
            height: 140px;
          }
          .icon-box {
            font-size: 40px;
          }
          .card-label {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
