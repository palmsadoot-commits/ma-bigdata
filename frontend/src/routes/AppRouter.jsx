import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../utils/config';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Button, Space, Avatar, Tag, Spin, Drawer, Grid, Dropdown, App, notification as staticNotification } from 'antd';
import {
  DashboardOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  RocketOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  AuditOutlined,
  HistoryOutlined,
  DatabaseOutlined,
  ShopOutlined,
  ToolOutlined,
  DownOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import * as AntIcons from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../services/api/axiosInstance';

// นำเข้า Components
import Profile from '../components/Profile';
import UserManagement from '../components/UserManagement';
import CategoryManagement from '../components/CategoryManagement';
import TicketBoard from '../components/TicketBoard';
import StatusManagement from '../components/StatusManagement';
import BackupManagement from '../components/BackupManagement';
import Login from '../components/Login';
import LoginSuccess from '../components/LoginSuccess'; // ✅ เพิ่มหน้า Login Success
import Onboarding from '../components/Onboarding'; // ✅ เพิ่มหน้า Onboarding
import ProjectSelection from '../components/ProjectSelection';
import TicketForm from '../components/TicketForm';
import TicketDashboard from '../components/TicketDashboard';
import TicketList from '../components/TicketList';
import TicketDetail from '../components/TicketDetail';
import Settings from '../components/Settings';
import SystemSettings from '../components/SystemSettings';
import SystemLogDashboard from '../components/SystemLogDashboard';
import MenuManagement from '../components/MenuManagement';
import TicketPrint from '../components/TicketPrint';
import VendorManagement from '../components/VendorManagement';
import SecurityCommandCenter from '../components/SecurityCommandCenter'; // ✅ นำเข้า Security Dashboard
import MaintenanceReportDashboard from '../components/MaintenanceReportDashboard'; // ✅ นำเข้า Report Dashboard
import BusinessIntelligenceDashboard from '../components/BusinessIntelligenceDashboard'; // ✅ นำเข้า BI Dashboard
import ErrorDisplay from '../components/ErrorDisplay';
import GeminiChat from '../components/GeminiChat'; // ✅ เพิ่ม Gemini Chat

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

function MainLayout() {
  const { user, activeProject, logout, changeProject } = useAuth();
  const { notification } = App.useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [dynamicMenus, setDynamicMenus] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const location = useLocation(); 
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // --- 1. Hooks ทั้งหมดต้องอยู่นี่ (ห้ามมี if return มาแทรกก่อน) ---
  
  const fetchMenus = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/menus');
      setDynamicMenus(res.data);
    } catch (e) { console.error("Fetch menus error:", e); }
    finally { setLoadingMenus(false); }
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const res = await axiosInstance.get('/settings');
      setSettings(res.data);
    } catch (e) { console.error("Router settings fetch error:", e); }
    finally { setLoadingSettings(false); }
  };

  useEffect(() => {
    fetchGlobalSettings();
    fetchMenus();
    window.addEventListener('system_settings_updated', fetchGlobalSettings);
    return () => window.removeEventListener('system_settings_updated', fetchGlobalSettings);
  }, [fetchMenus]);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const eventSource = new EventSource(`${API_BASE_URL}/api/audit/live-alerts`);

    eventSource.onmessage = (e) => {
      try {
        const alert = JSON.parse(e.data);
        const config = { placement: 'topRight', duration: 10, style: { borderRadius: '12px' } };

        if (alert.level === 'CRITICAL') {
            notification.error({
                ...config,
                title: '🚨 วิกฤต',
                description: alert.message,
                icon: <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
            });
        } else if (alert.level === 'ERROR') {
            notification.error({ ...config, title: '🔴 ระบบผิดพลาด', description: alert.message });
        } else if (alert.category === 'SECURITY') {
            notification.warning({
                ...config,
                title: '🛡️ ความปลอดภัย',
                description: alert.message,
                icon: <WarningOutlined style={{ color: '#faad14' }} />
            });
        }
      } catch (err) {}
    };

    return () => eventSource.close();
  }, [user, notification]);

  useEffect(() => {
    const handleApiError = (event) => {
      const status = event.detail.status;
      if (status >= 400 && status < 500) {
        if (settings?.error_404_active === 1) {
          if (!location.pathname.startsWith('/error') && !location.pathname.startsWith('/error-test')) {
            navigate(`/error/${status}`);
          }
        }
      }
      if (status >= 500 && status < 600) {
        if (settings?.error_500_active === 1) {
          if (!location.pathname.startsWith('/error') && !location.pathname.startsWith('/error-test')) {
            navigate(`/error/${status}`);
          }
        }
      }
    };

    window.addEventListener('api_error', handleApiError);
    return () => window.removeEventListener('api_error', handleApiError);
  }, [settings, navigate, location.pathname]);

  // 🛡️ Global Guard: Maintenance Mode
  if (settings?.maintenance_mode === 1 && user?.role !== 'admin' && location.pathname !== '/login') {
    return <ErrorDisplay code="503" />;
  }

  if (loadingSettings || loadingMenus) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;
  }

  // ฟังก์ชันสร้าง Menu Items แบบ Recursive
  const buildMenuItems = (menuList) => {
    return menuList
      .filter(m => m.is_active === 1)
      .filter(m => {
        if (!m.required_role) return true;
        const roles = m.required_role.split(',');
        return roles.includes(user?.role);
      })
      .map(m => {
        const icon = m.icon && AntIcons[m.icon] ? React.createElement(AntIcons[m.icon]) : null;
        const label = m.path && !['management', '#'].includes(m.path)
            ? <Link to={m.path} onClick={() => setMobileVisible(false)}>{m.title}</Link> 
            : m.title;

        if (m.children && m.children.length > 0) {
          const subItems = buildMenuItems(m.children);
          if (subItems.length > 0) {
            return { key: m.id.toString(), icon, label: m.title, children: subItems };
          }
          return null;
        }
        
        return { key: m.path || m.id.toString(), icon, label };
      }).filter(item => item !== null);
  };

  const menuItems = buildMenuItems(dynamicMenus);

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: <Link to="/profile">โปรไฟล์</Link> },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'ออกจากระบบ', danger: true, onClick: logout },
    ],
  };

  const renderNavMenu = () => (
    <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} style={{ borderRight: 0 }} />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} width={200} style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
          <div className="sider-logo">
            {collapsed ? 'LMIS' : '⚙️ LMIS BIG DATA'}
          </div>
          {renderNavMenu()}
        </Sider>
      )}
      <Drawer title="⚙️ LMIS BIG DATA" placement="left" onClose={() => setMobileVisible(false)} open={mobileVisible} styles={{ wrapper: { width: 260 }, body: { padding: 0, backgroundColor: 'var(--sidebar-bg)' }, header: { backgroundColor: 'var(--sidebar-bg)', color: 'white' }, mask: { backdropFilter: 'blur(4px)' } }} closeIcon={<span style={{ color: 'white' }}>✕</span>}>
        {renderNavMenu()}
      </Drawer>

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 200), transition: 'all 0.2s' }}>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 24px', position: 'sticky', top: 0, zIndex: 99, width: '100%', height: '64px' }}>
          <Space size={isMobile ? 8 : 16}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => isMobile ? setMobileVisible(true) : setCollapsed(!collapsed)} style={{ fontSize: '18px' }} />
            <Title level={isMobile ? 5 : 4} style={{ margin: 0, color: 'var(--text-main)' }}>{isMobile ? 'แจ้งซ่อม' : 'ระบบแจ้งซ่อมและบำรุงรักษา'}</Title>
            {!isMobile && <Tag color="blue" icon={<RocketOutlined />}>{activeProject?.project_name}</Tag>}
          </Space>
          <Dropdown menu={userMenu} placement="bottomRight" arrow>
            <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: 'var(--primary-color)' }} />
                {!isMobile && <Text strong style={{ color: 'var(--text-main)' }}>{user?.first_name}</Text>}
                <DownOutlined style={{ fontSize: 10, color: 'var(--text-main)' }} />
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: isMobile ? '12px' : '24px', minHeight: 280, background: 'transparent' }}>
          <Routes>
            <Route path="/" element={(user?.role === 'admin' || user?.role === 'user') ? <TicketForm project={activeProject} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<TicketDashboard project={activeProject} />} />
            <Route path="/tickets" element={<TicketList project={activeProject} />} />
            <Route path="/ticket/:id" element={<TicketDetail />} />
            <Route path="/print/:id" element={<TicketPrint />} /> 
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={user?.role === 'admin' ? <UserManagement /> : <Navigate to="/dashboard" replace />} />
            <Route path="/categories" element={user?.role === 'admin' ? <CategoryManagement /> : <Navigate to="/dashboard" replace />} />
            <Route path="/statuses" element={user?.role === 'admin' ? <StatusManagement /> : <Navigate to="/dashboard" replace />} />
            <Route path="/system-settings" element={user?.role === 'admin' ? <SystemSettings /> : <Navigate to="/dashboard" replace />} />
            <Route path="/system-logs" element={user?.role === 'admin' ? <SystemLogDashboard /> : <Navigate to="/dashboard" replace />} />
            <Route path="/navigation" element={user?.role === 'admin' ? <MenuManagement /> : <Navigate to="/dashboard" replace />} />
            <Route path="/backup" element={user?.role === 'admin' ? <BackupManagement /> : <Navigate to="/dashboard" replace />} />
            <Route path="/security" element={user?.role === 'admin' ? <SecurityCommandCenter /> : <Navigate to="/dashboard" replace />} />
            <Route path="/vendors" element={user?.role === 'admin' ? <VendorManagement /> : <Navigate to="/dashboard" replace />} />
            <Route path="/reports" element={user?.role === 'admin' ? <MaintenanceReportDashboard /> : <Navigate to="/dashboard" replace />} />
            <Route path="/bi-dashboard" element={(user?.role === 'admin' || user?.role === 'manager') ? <BusinessIntelligenceDashboard /> : <Navigate to="/dashboard" replace />} />
            <Route path="/error/:code" element={<ErrorDisplay />} />
            <Route path="/error-test" element={<ErrorDisplay allowPreview={true} />} />
            <Route path="*" element={settings?.error_404_active === 1 ? <ErrorDisplay code="404" /> : <Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function AppRouter() {
  const { user, activeProject, login, selectProject, setActiveProject } = useAuth();

  useEffect(() => {
    if (user && user.token && user.role !== 'admin' && !activeProject && !user.requires_onboarding) {
        axiosInstance.get('/projects')
        .then(res => {
          const myProject = res.data.find(p => p.project_id === user.project_id);
          if (myProject) selectProject(myProject);
          else setActiveProject({ project_id: null, project_name: 'ยังไม่ได้ระบุโปรเจกต์' });
        }).catch(err => console.error(err));
    }
  }, [user, activeProject, selectProject, setActiveProject]);

  const location = useLocation();

  if (!user) {
    if (location.pathname === '/login-success') return <LoginSuccess />;
    return <Login onLoginSuccess={login} />;
  }

  // ✅ Onboarding Guard: ถ้าต้องการข้อมูลเพิ่ม ให้ไปหน้า Onboarding เท่านั้น
  if (user.requires_onboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }
  
  if (user.role === 'admin' && !activeProject) return <ProjectSelection onSelect={selectProject} />;

  if (!activeProject) {
    return <div style={{ textAlign: 'center', marginTop: '30vh' }}><Spin size="large" description="กำลังเข้าสู่โปรเจกต์..." /></div>;
  }

  if (location.pathname === '/gemini') {
    return <GeminiChat />;
  }

  return <MainLayout />;
}
