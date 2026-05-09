import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ConfigProvider, theme, Spin, App as AntApp, Result, Button } from 'antd';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';
import axiosInstance from './services/api/axiosInstance';
import { ThunderboltOutlined, SyncOutlined } from '@ant-design/icons';
import './OldSystem.css';

import { API_BASE_URL } from './utils/config';

const BACKEND_URL = API_BASE_URL;

export default function App() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/settings');
      if (res.data) {
        setSettings(res.data);
        if (res.data.system_name) document.title = res.data.system_name;
        if (res.data.system_favicon) {
          let link = document.querySelector("link[rel*='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = `${BACKEND_URL}/uploads/${res.data.system_favicon}`;
        }
      }
    } catch (err) {
      console.error("Failed to load system settings:", err);
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือติดต่อผู้ดูแลระบบ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    window.addEventListener('system_settings_updated', fetchSettings);
    return () => window.removeEventListener('system_settings_updated', fetchSettings);
  }, []);

  const isDark = settings?.theme_mode === 'dark';

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDark]);

  if (loading && !settings) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
        <Spin size="large" indicator={<ThunderboltOutlined style={{ fontSize: 48, color: '#1677ff' }} spin />} />
        <div style={{ marginTop: 24, color: '#64748b', fontSize: 16, fontWeight: 500, letterSpacing: '0.5px' }}>
          กำลังรวบรวมข้อมูลระบบ...
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
        <Result
          status="error"
          title="การเชื่อมต่อล้มเหลว"
          subTitle={error}
          extra={[
            <Button type="primary" key="retry" icon={<SyncOutlined />} onClick={fetchSettings} size="large" style={{ borderRadius: 8, height: 45, padding: '0 24px' }}>
              ลองใหม่อีกครั้ง
            </Button>
          ]}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f4f7f6' }}>
        <Spin size="large" description="กำลังเตรียมพร้อมระบบ..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: settings?.primary_color || '#1677ff',
          fontFamily: settings?.system_font || 'Inter',
          borderRadius: 12,
          // ✅ ปรับจูนสีให้มีความสมดุล (Neutral Gray Theme)
          colorBgLayout: isDark ? '#3b4149' : '#f4f7f6', // พื้นหลังแอปตามต้องการ
          colorBgContainer: isDark ? '#4a515a' : '#ffffff', // พื้นหลัง Card/Menu
          colorBgElevated: isDark ? '#565f69' : '#ffffff', // พื้นหลัง Modal/Pop
          colorText: isDark ? '#ffffff' : '#1e293b', // สีตัวอักษรหลัก
          colorTextDescription: isDark ? '#e2e8f0' : '#64748b', // สีตัวอักษรรอง
          colorBorder: isDark ? '#64748b' : '#e2e8f0',
        },
        components: {
          Layout: {
            headerBg: isDark ? '#2d3238' : '#ffffff', // Header เข้มกว่า Body เล็กน้อยเพื่อให้ดูมีมิติ
            siderBg: '#001529',
          },
          Card: {
            colorBgContainer: isDark ? '#4a515a' : '#ffffff',
          },
          Table: {
            colorBgContainer: isDark ? '#4a515a' : '#ffffff',
            colorHeaderBg: isDark ? '#2d3238' : '#fafafa',
          },
          Menu: {
            darkItemBg: '#001529',
          }
        }
      }}
    >
      <AntApp>
        <AuthProvider>
          <Router>
            <AppRouter />
          </Router>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
