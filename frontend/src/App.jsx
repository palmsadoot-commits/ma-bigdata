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
          colorPrimary: '#4F46E5',
          colorInfo: '#3B82F6',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          borderRadius: 12,
          fontFamily: "'Prompt', sans-serif",
          wireframe: false,
          colorBgLayout: isDark ? '#0F172A' : '#F1F5F9',
          colorBgContainer: isDark ? '#1E293B' : '#FFFFFF',
          colorBgElevated: isDark ? '#334155' : '#FFFFFF',
          colorText: isDark ? '#FFFFFF' : '#0F172A',
          colorTextDescription: isDark ? '#94A3B8' : '#475569',
          colorBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        components: {
          Layout: {
            headerBg: isDark ? '#1E293B' : '#FFFFFF',
            siderBg: isDark ? '#020617' : '#0F172A',
            triggerBg: isDark ? '#020617' : '#0F172A',
          },
          Card: {
            colorBgContainer: isDark ? '#1E293B' : '#FFFFFF',
            headerBg: 'transparent',
            colorTextHeading: isDark ? '#FFFFFF' : '#0F172A',
          },
          Table: {
            colorBgContainer: isDark ? '#1E293B' : '#FFFFFF',
            colorHeaderBg: isDark ? '#334155' : '#F8FAFC',
            colorHeaderText: isDark ? '#FFFFFF' : '#0F172A',
          },
          Menu: {
            darkItemColor: '#94A3B8',
            darkItemSelectedColor: '#FFFFFF',
            darkItemSelectedBg: '#4F46E5',
            itemColor: isDark ? '#FFFFFF' : '#0F172A',
          },
          Typography: {
            colorText: isDark ? '#FFFFFF' : '#0F172A',
            colorTextDescription: isDark ? '#94A3B8' : '#475569',
            colorTextHeading: isDark ? '#FFFFFF' : '#0F172A',
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
