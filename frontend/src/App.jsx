import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Typography, Button, Space, Avatar, Tag, Spin } from 'antd';
import {
  DashboardOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  RocketOutlined
} from '@ant-design/icons';
import axios from 'axios'; 

import './OldSystem.css';

// นำเข้า Components
import Login from './components/Login';
import ProjectSelection from './components/ProjectSelection';
import TicketForm from './components/TicketForm';
import TicketDashboard from './components/TicketDashboard';
import TicketList from './components/TicketList';
import TicketDetail from './components/TicketDetail';
import Settings from './components/Settings';
import TicketPrint from './components/TicketPrint';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// ==========================================
// โครงสร้างหน้าเว็บหลัก
// ==========================================
function MainLayout({ user, project, onLogout, onChangeProject }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation(); 

  const menuItems = [];

  // ✅ ฝั่งผู้แจ้ง (Admin, User) เท่านั้นถึงเห็นเมนู "สร้างใบงาน"
  if (user.role === 'admin' || user.role === 'user') {
    menuItems.push({ key: '/', icon: <PlusCircleOutlined />, label: <Link to="/">สร้างใบงาน</Link> });
  }

  // ทุกคนเห็นหน้ารายการใบงาน
  menuItems.push({ key: '/tickets', icon: <UnorderedListOutlined />, label: <Link to="/tickets">รายการใบงาน</Link> });

  menuItems.unshift({ key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">แดชบอร์ด</Link> });
  

  // ทุกคนเห็นตั้งค่า
  menuItems.push({ key: '/settings', icon: <SettingOutlined />, label: <Link to="/settings">ตั้งค่า / โปรไฟล์</Link> });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={250}>
        <div className="sider-logo" style={{ color: 'white', textAlign: 'center', padding: '15px 0', fontSize: collapsed ? '14px' : '18px', fontWeight: 'bold' }}>
          {collapsed ? 'LIMS' : '⚙️ LIMS Big Data'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Sider>

      <Layout>
        {/* ... (Header เหมือนเดิม) ... */}
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff' }}>
          <Space>
            <Title level={4} style={{ margin: 0, color: '#333' }}>ระบบแจ้งซ่อม</Title>
            <Tag color="purple" icon={<RocketOutlined />} style={{ fontSize: '14px', padding: '4px 10px', marginLeft: 15 }}>
              {project.project_name}
            </Tag>
            {user.role === 'admin' && (
              <Button type="link" size="small" onClick={onChangeProject} style={{ color: '#ef8157' }}>[ เปลี่ยนโปรเจกต์ ]</Button>
            )}
          </Space>
          <Space size="large">
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#2a1a4a' }} />
            <Text strong>{user.first_name} {user.last_name} ({user.role})</Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={onLogout} style={{ color: '#ff4d4f' }}>ออกจากระบบ</Button>
          </Space>
        </Header>

        <Content>
          <Routes>
            {/* 🚨 กั้น Route ไม่ให้ช่างแอบพิมพ์ URL ทะลุเข้าหน้าสร้างใบงานได้ */}
            <Route path="/" element={(user.role === 'admin' || user.role === 'user') ? <TicketForm project={project} /> : <Navigate to="/dashboard" />} />
            
            <Route path="/dashboard" element={<TicketDashboard project={project} />} />
            <Route path="/tickets" element={<TicketList project={project} />} />
            <Route path="/ticket/:id" element={<TicketDetail />} />
            <Route path="/print/:id" element={<TicketPrint />} /> 
            <Route path="/settings" element={<Settings currentUser={user} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

// ==========================================
// ตัวควบคุมหลัก
// ==========================================
export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('lims_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeProject, setActiveProject] = useState(() => {
    const savedProject = localStorage.getItem('lims_active_project');
    return savedProject ? JSON.parse(savedProject) : null;
  });

  // --- ฟังก์ชันอัตโนมัติ: ดึงโปรเจกต์ให้ Technician/User ทันทีที่ล็อกอิน ---
  useEffect(() => {
    if (user && user.role !== 'admin' && !activeProject) {
      axios.get('http://localhost:3000/api/projects')
        .then(res => {
          // หาโปรเจกต์ที่ตรงกับ project_id ของ User คนนี้
          const myProject = res.data.find(p => p.project_id === user.project_id);
          if (myProject) {
            setActiveProject(myProject);
            localStorage.setItem('lims_active_project', JSON.stringify(myProject));
          } else {
            // กรณีที่ Admin ยังไม่ได้ตั้งค่าโปรเจกต์ให้ช่างคนนี้
            setActiveProject({ project_id: null, project_name: 'ยังไม่ได้ระบุโปรเจกต์ (ติดต่อ Admin)' });
          }
        })
        .catch(err => console.error(err));
    }
  }, [user, activeProject]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('lims_user', JSON.stringify(userData));
  };

  const handleProjectSelect = (project) => {
    setActiveProject(project);
    localStorage.setItem('lims_active_project', JSON.stringify(project));
  };

  const handleChangeProject = () => {
    setActiveProject(null);
    localStorage.removeItem('lims_active_project');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveProject(null);
    localStorage.removeItem('lims_user');
    localStorage.removeItem('lims_active_project');
  };

  return (
    <Router>
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (user.role === 'admin' && !activeProject) ? (
        /* ด่าน 2A: เฉพาะ Admin เท่านั้นที่เห็นหน้าเลือกโปรเจกต์ */
        <ProjectSelection onSelect={handleProjectSelect} />
      ) : !activeProject ? (
        /* ด่าน 2B: ระหว่างดึงข้อมูลให้ User/Tech ให้ขึ้นโหลดดิ้งรอแปบนึง */
        <div style={{ textAlign: 'center', marginTop: '30vh' }}>
          <Spin size="large" tip="กำลังเข้าสู่โปรเจกต์ของคุณ..." />
        </div>
      ) : (
        /* ด่าน 3: เข้าสู่ระบบหลัก */
        <MainLayout 
          user={user} 
          project={activeProject} 
          onLogout={handleLogout} 
          onChangeProject={handleChangeProject} 
        />
      )}
    </Router>
  );
}