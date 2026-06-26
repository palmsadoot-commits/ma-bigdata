import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Typography, Tag, Avatar, Button, Modal, Form, Input, Upload, Space, Empty, Spin, Tabs, Table, Tooltip as AntTooltip, Statistic, Select, Divider, Grid, Badge } from 'antd';
import { 
  ClockCircleOutlined, UserOutlined, FileTextOutlined, UploadOutlined, DashboardOutlined, SyncOutlined, 
  CalendarOutlined, HourglassOutlined, PlusCircleOutlined, CheckSquareOutlined, PrinterOutlined, 
  EditOutlined, BarChartOutlined, AppstoreOutlined, FireOutlined, DollarCircleOutlined, AlertOutlined,
  ThunderboltOutlined, InfoCircleOutlined, TagOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../services/api/axiosInstance';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/th';
import { alertSuccess, alertError } from '../utils/alert';
import { API_BASE_URL } from '../utils/config';

dayjs.extend(duration);
dayjs.locale('th');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;
const BACKEND_URL = API_BASE_URL;
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const AnimatedNumber = ({ value, isCurrency = false }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let start = 0;
    const end = parseInt(value, 10) || 0;
    
    if (end === 0) {
      setCount(0);
      return;
    }
    
    const durationObj = 500; 
    const incrementTime = 30;
    const step = Math.max(Math.ceil(end / (durationObj / incrementTime)), 1);

    const timer = setInterval(() => {
      if (!isMounted) return;
      start += step;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [value]);

  return <span>{isCurrency ? count.toLocaleString() : count}</span>;
};

export default function TicketDashboard({ project }) {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ดึงค่าเริ่มต้นจาก URL
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || '1'); 
  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get('period') || 'all');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  const [now, setNow] = useState(dayjs());
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [milestoneData, setMilestoneData] = useState({ milestones: [], overall: {} });
  const [activeMilestoneTab, setActiveMilestoneTab] = useState('overview');
  const [slaStats, setSlaStats] = useState({ totalCM: 0, activeCM: [], breachedCount: 0, totalPenalty: 0 });

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // อัปเดต URL เมื่อ Tab หรือ Period เปลี่ยน
  useEffect(() => {
    const params = {};
    if (activeTab !== '1') params.tab = activeTab;
    if (selectedPeriod !== 'all') params.period = selectedPeriod;
    setSearchParams(params, { replace: true });
  }, [activeTab, selectedPeriod, setSearchParams]);

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 5000);
    return () => clearInterval(timer);
  }, []);

  async function fetchData(signal) {
    if (!project?.project_id) return;
    setLoading(true);
    try {
      const [ticketRes, statusRes, milestoneRes] = await Promise.all([
        axiosInstance.get('/tickets', { 
          params: { project_id: project.project_id },
          signal: signal instanceof AbortSignal ? signal : undefined
        }),
        axiosInstance.get('/statuses', {
          signal: signal instanceof AbortSignal ? signal : undefined
        }),
        axiosInstance.get('/tickets/dashboard-by-milestone', {
          params: { project_id: project.project_id },
          signal: signal instanceof AbortSignal ? signal : undefined
        }).catch(() => ({ data: { milestones: [], overall: {} } }))
      ]);

      const data = ticketRes.data || [];
      setTickets(data);
      setStatuses(statusRes.data || []);
      setMilestoneData(milestoneRes.data || { milestones: [], overall: {} });

      const cmData = data.filter(t => Number(t.is_cm) === 1);
      const periods = [...new Set(cmData.map(t => dayjs(t.created_at).format('YYYY-MM')))].sort((a,b) => b.localeCompare(a));
      setAvailablePeriods(periods);
      
      const currentMonth = dayjs().format('YYYY-MM');
      if (periods.includes(currentMonth) && selectedPeriod === 'all') {
        setSelectedPeriod(currentMonth);
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error("Dashboard fetch error:", error);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort(); 
  }, [project]);

  useEffect(() => {
    const cmTickets = tickets.filter(t => Number(t.is_cm) === 1);
    let filteredCM = cmTickets;

    if (selectedPeriod !== 'all') {
      filteredCM = cmTickets.filter(t => dayjs(t.created_at).format('YYYY-MM') === selectedPeriod);
    }

    // ✅ ปรับเงื่อนไขให้ใช้ status_id (3=Resolved, 4=Closed)
    const activeCM = filteredCM.filter(t => ![3, 4].includes(t.status_id));
    const breachedCount = filteredCM.filter(t => t.is_sla_breached === 1).length;
    const penaltySum = filteredCM.reduce((sum, t) => sum + (parseFloat(t.penalty_amount) || 0), 0);

    setSlaStats({ totalCM: filteredCM.length, activeCM, breachedCount, totalPenalty: penaltySum });
  }, [tickets, selectedPeriod]);

  const today = dayjs().format('YYYY-MM-DD');
  const currentMonth = dayjs().format('YYYY-MM');

  const stats = [
    { title: 'ใบงานทั้งหมด', value: tickets.length, bg: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)', shadow: 'rgba(59, 130, 246, 0.4)', icon: <FileTextOutlined />, bgIcon: <AppstoreOutlined />, anim: '' },
    { title: 'ใบงานเดือนนี้', value: tickets.filter(t => t.created_at?.startsWith(currentMonth)).length, bg: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', shadow: 'rgba(16, 185, 129, 0.4)', icon: <CalendarOutlined />, bgIcon: <CalendarOutlined />, anim: 'icon-float' },
    // ✅ ปรับใช้ status_id
    { title: 'กำลังดำเนินการ', value: tickets.filter(t => t.status_id === 1 || t.status_id === 2).length, bg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', shadow: 'rgba(245, 158, 11, 0.4)', icon: <HourglassOutlined />, bgIcon: <SyncOutlined />, anim: 'icon-spin-slow' },
    { title: 'รอตรวจ / ปิดเคส', value: tickets.filter(t => t.status_id === 3 || t.status_id === 4).length, bg: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', shadow: 'rgba(139, 92, 246, 0.4)', icon: <CheckSquareOutlined />, bgIcon: <CheckSquareOutlined />, anim: '' },
    { title: 'เปิดใหม่วันนี้', value: tickets.filter(t => t.created_at?.startsWith(today)).length, bg: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)', shadow: 'rgba(236, 72, 153, 0.4)', icon: <PlusCircleOutlined />, bgIcon: <PlusCircleOutlined />, anim: 'icon-pulse' },
    { title: 'อัปเดตวันนี้', value: tickets.filter(t => t.created_at?.startsWith(today)).length, bg: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)', shadow: 'rgba(20, 184, 166, 0.4)', icon: <SyncOutlined />, bgIcon: <ClockCircleOutlined />, anim: 'icon-spin-normal' },
  ];

  const boardColumns = statuses.length > 0 ? statuses.map(s => ({
    id: s.status_id, // ✅ เปลี่ยนจาก status_name เป็น status_id
    title: s.status_name, 
    color: s.status_color || '#3b82f6', 
    bgColor: `${s.status_color || '#3b82f6'}15`, 
    borderColor: `${s.status_color || '#3b82f6'}40` 
  })) : [
    { id: 1, title: 'รอดำเนินการ', color: '#ef4444', bgColor: '#fef2f2', borderColor: '#fecaca' },
    { id: 2, title: 'กำลังดำเนินการ', color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fde68a' },
    { id: 3, title: 'รอตรวจสอบ', color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
    { id: 4, title: 'ปิดเคสสมบูรณ์', color: '#22c55e', bgColor: '#f0fdf4', borderColor: '#bbf7d0' }
  ];

  const handleOpenUpdateModal = (ticket) => {
    setSelectedTicket(ticket);
    setFileList([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleUpdateStatus = async (values) => {
    const formData = new FormData();
    formData.append('status_id', 3); // ✅ เปลี่ยนจาก 'Resolved' เป็น 3
    if (values.root_cause_and_solution) formData.append('root_cause_and_solution', values.root_cause_and_solution);

    fileList.forEach(file => formData.append('attachments', file.originFileObj));

    try {
      const res = await axiosInstance.put(`/tickets/${selectedTicket.ticket_id}/update-status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsModalVisible(false);
      if (res.data.is_breached) alertError('ปิดงานล่าช้า!', res.data.message);
      else alertSuccess('ส่งตรวจสำเร็จ', 'ส่งให้ผู้แจ้งตรวจสอบเรียบร้อยแล้ว!');
      fetchData(); 
    } catch (error) {
      alertError('ผิดพลาด', 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const uploadProps = {
    onRemove: (file) => setFileList(prev => prev.filter(item => item.uid !== file.uid)),
    beforeUpload: (file) => { setFileList(prev => [...prev, file]); return false; },
    fileList,
  };

const renderSLATimer = (ticket) => {
    if (Number(ticket.is_cm) !== 1) return <Tag color="default" icon={<TagOutlined />} style={{ fontSize: isMobile ? 10 : 12 }}>แจ้งทั่วไป</Tag>;

    // ✅ ปรับใช้ status_id
    if (ticket.status_id === 1 && ['Hardware', 'Software'].includes(ticket.category_type)) {
      const ackDeadline = dayjs(ticket.created_at).add(2, 'hour'); 
      const diff = ackDeadline.diff(now);

      if (diff <= 0) return <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: isMobile ? 10 : 12, animation: 'pulse-alert 1.5s infinite', display: 'inline-flex', alignItems: 'center', gap: 4 }}><FireOutlined /> เกินเวลา!</span>;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      return (
        <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: isMobile ? 10 : 11, display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f59e0b15', padding: '2px 8px', borderRadius: '12px', border: '1px solid #f59e0b40' }}>
          <ClockCircleOutlined className="icon-spin-normal" /> รอดำเนินการ ({timeString})
        </span>
      );
    }

    if (ticket.status_id === 3 || ticket.status_id === 4) {
      if (ticket.is_sla_breached === 1) {
        return (
          <AntTooltip title={`ค่าปรับ: ${parseFloat(ticket.penalty_amount).toLocaleString()} ฿`}>
            <Tag color="red" style={{ margin: 0, borderRadius: 6, fontSize: isMobile ? 9 : 10, padding: '2px 6px' }}>
              ปรับ {parseFloat(ticket.penalty_amount).toLocaleString()}
            </Tag>
          </AntTooltip>
        );
      }
      return <Tag color="green" style={{ margin: 0, borderRadius: 6, fontSize: isMobile ? 9 : 10, padding: '2px 6px' }} icon={<CheckSquareOutlined />}>ทันเวลา</Tag>;
    }

    if (!ticket.sla_deadline) return <Tag color="warning" icon={<HourglassOutlined spin />} style={{ fontSize: isMobile ? 10 : 12 }}>รอระบบ</Tag>;

    const deadline = dayjs(ticket.sla_deadline);
    const diff = deadline.diff(now);

    if (diff <= 0) return <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: isMobile ? 10 : 11, animation: 'pulse-alert 1.5s infinite', display: 'inline-flex', alignItems: 'center', gap: 4 }}><FireOutlined /> เกินเวลา!</span>;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let color = '#10b981';
    let iconClass = 'icon-spin-slow';
    
    if (hours < 1) {
      color = '#ef4444';
      iconClass = 'icon-spin-fast';
    } else if (hours < 2) {
      color = '#f59e0b';
      iconClass = 'icon-spin-normal';
    }

    return (
      <span style={{ color: color, fontWeight: 'bold', fontSize: isMobile ? 10 : 11, display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${color}15`, padding: '2px 8px', borderRadius: '12px', border: `1px solid ${color}40` }}>
        <ClockCircleOutlined className={iconClass} /> {timeString}
      </span>
    );
  };

  const TicketCard = ({ ticket, colorTheme }) => (
    <div 
      className="ticket-kanban-card"
      style={{ 
        marginBottom: 12, borderRadius: 10, borderLeft: `4px solid ${colorTheme}`, 
        boxShadow: 'var(--card-shadow)', padding: '12px', transition: 'all 0.3s ease', cursor: 'pointer',
        backgroundColor: 'var(--bg-card)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: '8px' }}>
        <AntTooltip title={ticket.category_name || 'ทั่วไป'} placement="topLeft">
          <Tag color={colorTheme} style={{ borderRadius: 6, margin: 0, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10, padding: '0 8px' }}>
            {ticket.category_name || 'ทั่วไป'}
          </Tag>
        </AntTooltip>
        <Text strong style={{ fontSize: isMobile ? 12 : 13, flexShrink: 0, color: 'var(--text-main)' }}>{ticket.ticket_number}</Text>
      </div>
      
      <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ marginBottom: 8, fontSize: isMobile ? 10 : 11, lineHeight: '1.4', color: 'var(--text-sub)' }}>
        {ticket.problem_detail}
      </Paragraph>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: currentUser?.role !== 'user' ? 8 : 0, gap: 4, flexWrap: 'wrap' }}>
        <Space size={4}>
          <Avatar size={16} style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-sub)' }} icon={<UserOutlined />} />
          <Text type="secondary" style={{ fontSize: 10, maxWidth: 120, color: 'var(--text-sub)' }} ellipsis={{ tooltip: ticket.reporter_name }}>{ticket.reporter_name}</Text>
        </Space>
        {renderSLATimer(ticket)}
      </div>
      
      {currentUser?.role !== 'user' && ticket.status_id === 2 && ticket.assigned_to === currentUser?.user_id && (
        <Button type="dashed" size="small" block style={{ borderRadius: 6, borderColor: colorTheme, color: colorTheme, marginBottom: 6, fontSize: 10 }} onClick={() => handleOpenUpdateModal(ticket)}>
          ส่งผลงาน
        </Button>
      )}
      <Link to={`/ticket/${ticket.ticket_id}`}>
        <Button size="small" block style={{ borderRadius: 6, backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)', color: 'var(--text-sub)', fontSize: 10 }}>รายละเอียด</Button>
      </Link>
    </div>
  );

  const categoryCount = {};
  tickets.forEach(t => {
    const name = t.category_name || 'ไม่ระบุ';
    categoryCount[name] = (categoryCount[name] || 0) + 1;
  });
  const chartData = Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] }));

  const activeRecentTickets = tickets
    .filter(t => t.status_id !== 4) // ✅ กรองตัวที่ยังไม่ปิด
    .slice(0, 5);

  const tableColumns = [
    { title: 'เลขที่', dataIndex: 'ticket_number', key: 'ticket_number', width: 100, render: (text) => <Text strong style={{ color: '#0ea5e9', fontSize: 13 }}>{text}</Text> },
    { title: 'วันที่แจ้ง', dataIndex: 'created_at', key: 'created_at', width: 120, render: (date) => <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD/MM/YY HH:mm')}</Text> },
    { 
      title: 'หมวดหมู่ / รายการ', 
      key: 'category_name', 
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>{record.category_name || 'ทั่วไป'}</Text><br/>
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.equipment_no || '-'}</Text>
        </div>
      ) 
    },
    { 
      title: 'สถานะ', 
      key: 'status', 
      dataIndex: 'status_name', // ✅ ใช้ status_name แทน
      width: 120,
      render: (status, record) => {
        return <Tag color={record.status_color || 'default'} style={{ borderRadius: 10, fontSize: 11 }}>{status}</Tag>;
      } 
    },
    { title: 'ประเภท', key: 'sla', align: 'center', width: 150, render: (_, record) => renderSLATimer(record) },
    { 
      title: 'จัดการ', 
      key: 'action', 
      align: 'center',
      width: 80,
      render: (_, record) => (
        <Link to={`/ticket/${record.ticket_id}`}>
          <Button type="primary" size="small" ghost style={{ borderRadius: 6 }}>เปิด</Button>
        </Link>
      )
    },
  ];

  return (
    <div style={{ padding: isMobile ? '12px' : '20px', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      
      <style>{`
        @keyframes pulse-alert { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.02); color: #b91c1c; } 100% { opacity: 1; transform: scale(1); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes float-icon { 0%, 100% { transform: translateY(0px) rotate(-15deg); } 50% { transform: translateY(-10px) rotate(-15deg); } }
        @keyframes pulse-icon { 0%, 100% { transform: scale(1) rotate(-15deg); } 50% { transform: scale(1.1) rotate(-15deg); } }
        
        .icon-spin-slow { animation: spin 4s linear infinite; }
        .icon-spin-normal { animation: spin 2s linear infinite; }
        .icon-spin-fast { animation: spin 1s linear infinite; color: #ef4444; }
        .icon-float { animation: float-icon 3s ease-in-out infinite; }
        .icon-pulse { animation: pulse-icon 2s ease-in-out infinite; }
        
        .stat-icon-bg {
          position: absolute;
          right: -10px;
          bottom: -15px;
          font-size: 80px;
          opacity: 0.12;
          transition: all 0.3s;
          pointer-events: none;
        }
        .stat-card:hover .stat-icon-bg {
          transform: scale(1.1) rotate(-5deg);
          opacity: 0.22;
        }
        
        .custom-tabs .ant-tabs-tab { background-color: var(--border-color) !important; border-color: var(--border-color) !important; border-radius: 8px 8px 0 0 !important; }
        .custom-tabs .ant-tabs-tab-active { background-color: var(--bg-card) !important; border-bottom-color: var(--bg-card) !important; }
        .custom-tabs .ant-tabs-tab-btn { color: var(--text-sub) !important; }
        .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: var(--text-main) !important; }
        
        .kanban-container::-webkit-scrollbar { height: 6px; }
        .kanban-container::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Title level={isMobile ? 4 : 3} style={{ color: 'var(--text-main)', margin: 0 }}><DashboardOutlined /> แดชบอร์ดภาพรวม</Title>
        <Button type="primary" icon={<SyncOutlined />} onClick={fetchData} loading={loading} size={isMobile ? "middle" : "large"} style={{ borderRadius: 8 }}>รีเฟรช</Button>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {stats.map(s => (
          <Col xs={12} sm={8} lg={4} key={s.title}>
            <div className="stat-card" style={{ 
              position: 'relative', overflow: 'hidden',
              background: s.bg, borderRadius: 12, padding: isMobile ? '12px 8px' : '16px 12px', color: 'white', textAlign: 'center',
              boxShadow: `0 4px 12px ${s.shadow}`, transition: 'transform 0.3s ease', cursor: 'default',
              minHeight: isMobile ? '100px' : '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}>
              <div className={`stat-icon-bg ${s.anim}`}>{s.bgIcon}</div>
              <div style={{ opacity: 0.9, marginBottom: 2, position: 'relative', zIndex: 1 }}>{React.cloneElement(s.icon, { style: { fontSize: isMobile ? 18 : 22 } })}</div>
              <Title level={3} style={{ color: 'white', margin: 0, fontWeight: 900, position: 'relative', zIndex: 1 }}><AnimatedNumber value={s.value} /></Title>
              <Text style={{ color: 'white', fontSize: isMobile ? 10 : 12, opacity: 0.95, fontWeight: 500, position: 'relative', zIndex: 1 }}>{s.title}</Text>
            </div>
          </Col>
        ))}
      </Row>

      {(currentUser?.role === 'admin' || currentUser?.role === 'head_technician' || currentUser?.role === 'technician') && (
        <Card style={{ borderRadius: 16, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)', marginBottom: 20 }} styles={{ body: { padding: isMobile ? '12px' : '20px' } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 15, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
            <Title level={isMobile ? 5 : 4} style={{ color: 'var(--text-main)', margin: 0 }}>
              <AlertOutlined style={{ color: '#ef4444', marginRight: 8 }}/> 
              SLA Monitor {isMobile ? '' : '(ค่าปรับ)'}
            </Title>
            <Space orientation={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
              <Text strong style={{ fontSize: 13, color: 'var(--text-main)' }}>งวดประเมิน:</Text>
              <Select value={selectedPeriod} onChange={setSelectedPeriod} style={{ width: isMobile ? '100%' : 180, borderRadius: 8 }} size="small">
                <Option value="all">รวมทั้งหมด</Option>
                {availablePeriods.map(p => (
                  <Option key={p} value={p}>{dayjs(p).format('MMM YYYY')}</Option>
                ))}
              </Select>
            </Space>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic title={<span style={{ fontSize: 11, color: 'var(--text-sub)' }}>ใบงานด่วน</span>} value={slaStats.totalCM} prefix={<ThunderboltOutlined />} styles={{ content: { fontSize: isMobile ? 18 : 22, color: '#3b82f6', fontWeight: 'bold' } }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={<span style={{ fontSize: 11, color: 'var(--text-sub)' }}>นับเวลา</span>} value={slaStats.activeCM.length} prefix={<ClockCircleOutlined />} styles={{ content: { fontSize: isMobile ? 18 : 22, color: '#f59e0b', fontWeight: 'bold' } }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title={<span style={{ fontSize: 11, color: 'var(--text-sub)' }}>หลุด SLA</span>} value={slaStats.breachedCount} prefix={<FireOutlined />} styles={{ content: { fontSize: isMobile ? 18 : 22, color: '#ef4444', fontWeight: 'bold' } }} />
            </Col>
            <Col xs={12} sm={6}>
              <AntTooltip title="ค่าปรับสุทธิ">
                <Statistic 
                  title={<span style={{ cursor: 'help', fontSize: 11, color: 'var(--text-sub)' }}>ค่าปรับ (฿) <InfoCircleOutlined /></span>} 
                  value={slaStats.totalPenalty} 
                  precision={2} 
                  prefix={<DollarCircleOutlined />} 
                  styles={{ content: { fontSize: isMobile ? 18 : 22, color: '#be123c', fontWeight: 'bold' } }} 
                />
              </AntTooltip>
            </Col>
          </Row>

          {slaStats.activeCM.length > 0 && (
            <>
              <Divider dashed style={{ margin: '12px 0', borderColor: 'var(--border-color)' }} />
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }} className="kanban-container">
                {slaStats.activeCM.map(ticket => (
                  <div key={ticket.ticket_id} style={{ minWidth: '160px', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px', backgroundColor: 'var(--bg-app)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Link to={`/ticket/${ticket.ticket_id}`} style={{ fontWeight: 'bold', color: '#0ea5e9', fontSize: 11 }}>#{ticket.ticket_number}</Link>
                    </div>
                    {renderSLATimer(ticket)}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
      ) : (
        <Card styles={{ body: { padding: isMobile ? '8px' : '10px 20px 20px' } }} style={{ borderRadius: 16, backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)', border: 'none' }}>
          <Tabs 
            className="custom-tabs" 
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            size={isMobile ? "small" : "large"}
            tabBarStyle={{ marginBottom: 15 }}
            items={[
              {
                key: '1',
                label: (
                  <div style={{ padding: isMobile ? '2px 4px' : '4px 16px', fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold' }}>
                    <BarChartOutlined style={{ marginRight: 4 }} /> สถิติและรายการ
                  </div>
                ),
                children: (
                  <div style={{ marginTop: 5 }}>
                    {/* Overview Cards */}
                    {(() => {
                      const milestoneCards = (() => {
                        if (activeMilestoneTab === 'overview') {
                          return [
                            {
                              title: 'ใบงานรวมทุกงวด',
                              value: milestoneData.overall?.total_tickets || 0,
                              icon: <FileTextOutlined />,
                              bg: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
                              shadow: 'rgba(59, 130, 246, 0.4)',
                              bgIcon: <AppstoreOutlined />,
                              anim: 'icon-float',
                              isNumber: true
                            },
                            {
                              title: 'งวดปัจจุบัน',
                              value: milestoneData.overall?.current_milestone_title || '-',
                              icon: <ClockCircleOutlined />,
                              bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              shadow: 'rgba(245, 158, 11, 0.4)',
                              bgIcon: <ClockCircleOutlined />,
                              anim: 'icon-spin-slow',
                              isNumber: false
                            },
                            {
                              title: 'งวดที่เสร็จแล้ว',
                              value: `${milestoneData.overall?.completed_milestones || 0}/${milestoneData.overall?.total_milestones || 0}`,
                              icon: <CheckSquareOutlined />,
                              bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              shadow: 'rgba(16, 185, 129, 0.4)',
                              bgIcon: <CheckSquareOutlined />,
                              anim: 'icon-pulse',
                              isNumber: false
                            },
                            {
                              title: 'มูลค่าสะสม',
                              value: milestoneData.overall?.total_payment_completed || 0,
                              icon: <DollarCircleOutlined />,
                              bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              shadow: 'rgba(139, 92, 246, 0.4)',
                              bgIcon: <DollarCircleOutlined />,
                              anim: 'icon-float',
                              isCurrency: true
                            }
                          ];
                        } else {
                          const m = (milestoneData.milestones || []).find(x => String(x.milestone_id) === activeMilestoneTab);
                          if (!m) return [];
                          const payStatus = m.payment_status === 'Paid' ? 'ชำระแล้ว' : 'ค้างชำระ';
                          return [
                            {
                              title: `ใบงานในงวดที่ ${m.installment_no}`,
                              value: m.stats?.total || 0,
                              icon: <FileTextOutlined />,
                              bg: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
                              shadow: 'rgba(59, 130, 246, 0.4)',
                              bgIcon: <AppstoreOutlined />,
                              anim: 'icon-float',
                              isNumber: true
                            },
                            {
                              title: 'สถานะการดำเนินงาน',
                              value: m.status === 'Completed' ? 'เสร็จสมบูรณ์' : m.status === 'In Progress' ? 'กำลังดำเนินการ' : 'รอเริ่ม',
                              icon: <ClockCircleOutlined />,
                              bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              shadow: 'rgba(245, 158, 11, 0.4)',
                              bgIcon: <ClockCircleOutlined />,
                              anim: 'icon-spin-slow',
                              isNumber: false
                            },
                            {
                              title: 'แก้ไขแล้ว / ทั้งหมด',
                              value: `${m.stats?.resolved || 0}/${m.stats?.total || 0}`,
                              icon: <CheckSquareOutlined />,
                              bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              shadow: 'rgba(16, 185, 129, 0.4)',
                              bgIcon: <CheckSquareOutlined />,
                              anim: 'icon-pulse',
                              isNumber: false
                            },
                            {
                              title: `มูลค่างวด (${payStatus})`,
                              value: parseFloat(m.payment_amount) || 0,
                              icon: <DollarCircleOutlined />,
                              bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              shadow: 'rgba(139, 92, 246, 0.4)',
                              bgIcon: <DollarCircleOutlined />,
                              anim: 'icon-float',
                              isCurrency: true
                            }
                          ];
                        }
                      })();

                      return (
                        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                          {milestoneCards.map(s => (
                            <Col xs={12} sm={6} key={s.title}>
                              <div className="stat-card" style={{ 
                                position: 'relative', overflow: 'hidden',
                                background: s.bg, borderRadius: 12, padding: isMobile ? '12px 8px' : '16px 12px', color: 'white', textAlign: 'center',
                                boxShadow: `0 4px 12px ${s.shadow}`, transition: 'transform 0.3s ease', cursor: 'default',
                                minHeight: isMobile ? '100px' : '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                              }}>
                                <div className={`stat-icon-bg ${s.anim}`}>{s.bgIcon}</div>
                                <div style={{ opacity: 0.9, marginBottom: 2, position: 'relative', zIndex: 1 }}>
                                  {React.cloneElement(s.icon, { style: { fontSize: isMobile ? 18 : 22 } })}
                                </div>
                                {s.isCurrency ? (
                                  <Title level={3} style={{ color: 'white', margin: 0, fontWeight: 900, position: 'relative', zIndex: 1 }}>
                                    <AnimatedNumber value={s.value} isCurrency={true} /> ฿
                                  </Title>
                                ) : s.isNumber ? (
                                  <Title level={3} style={{ color: 'white', margin: 0, fontWeight: 900, position: 'relative', zIndex: 1 }}>
                                    <AnimatedNumber value={s.value} />
                                  </Title>
                                ) : (
                                  <Title level={3} style={{ color: 'white', margin: 0, fontWeight: 900, position: 'relative', zIndex: 1, fontSize: isMobile ? 13 : 16 }}>
                                    {s.value}
                                  </Title>
                                )}
                                <Text style={{ color: 'white', fontSize: isMobile ? 10 : 12, opacity: 0.95, fontWeight: 500, position: 'relative', zIndex: 1 }}>
                                  {s.title}
                                </Text>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      );
                    })()}

                    {/* Milestone Sub-Tabs */}
                    <Tabs
                      type="card"
                      size={isMobile ? 'small' : 'middle'}
                      activeKey={activeMilestoneTab}
                      onChange={setActiveMilestoneTab}
                      tabBarStyle={{ marginBottom: 12 }}
                      items={[
                        {
                          key: 'overview',
                          label: <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 600 }}>📊 ภาพรวม</span>,
                          children: (() => {
                            const allStatusMap = {};
                            milestoneData.milestones?.forEach(m => {
                              m.status_breakdown?.forEach(s => {
                                if (!allStatusMap[s.name]) allStatusMap[s.name] = { name: s.name, value: 0, color: s.color };
                                allStatusMap[s.name].value += s.value;
                              });
                            });
                            const allStatusData = Object.values(allStatusMap);
                            const milestoneCompare = (milestoneData.milestones || []).map(m => ({
                              name: `งวด ${m.installment_no}`,
                              total: m.stats?.total || 0,
                              resolved: m.stats?.resolved || 0,
                              breached: m.stats?.sla_breached || 0
                            }));
                            const allTickets = (milestoneData.milestones || []).flatMap(m => m.tickets || []);
                            return (
                              <Row gutter={[16, 16]}>
                                <Col xs={24} lg={9}>
                                  <Card title={<span style={{ color: 'var(--text-main)', fontSize: 14 }}>📊 สัดส่วนสถานะรวม</span>} variant="borderless" style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }} styles={{ header: { backgroundColor: 'var(--bg-app)', padding: '8px 16px' }, body: { padding: 12 } }}>
                                    {allStatusData.length > 0 ? (
                                      <div style={{ width: '100%', height: isMobile ? 260 : 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                          <PieChart>
                                            <Pie data={allStatusData} cx="50%" cy="45%" innerRadius={isMobile ? 45 : 60} outerRadius={isMobile ? 70 : 90} paddingAngle={4} dataKey="value">
                                              {allStatusData.map((entry, i) => <Cell key={`ov-${i}`} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                                          </PieChart>
                                        </ResponsiveContainer>
                                      </div>
                                    ) : <Empty description="ไม่มีข้อมูล" />}
                                  </Card>
                                </Col>
                                <Col xs={24} lg={15}>
                                  <Card title={<span style={{ color: 'var(--text-main)', fontSize: 14 }}>📊 เปรียบเทียบงวดงาน</span>} variant="borderless" style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }} styles={{ header: { backgroundColor: 'var(--bg-app)', padding: '8px 16px' }, body: { padding: 12 } }}>
                                    {milestoneCompare.length > 0 ? (
                                      <div style={{ width: '100%', height: isMobile ? 260 : 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={milestoneCompare} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-sub)' }} />
                                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-sub)' }} allowDecimals={false} />
                                            <RechartsTooltip />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey="total" name="ทั้งหมด" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="resolved" name="แก้ไขแล้ว" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="breached" name="หลุด SLA" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    ) : <Empty description="ไม่มีข้อมูล" />}
                                  </Card>
                                </Col>
                                <Col xs={24}>
                                  <Card title={<span style={{ color: 'var(--text-main)', fontSize: 14 }}>📋 ใบงานล่าสุดทุกงวด</span>} variant="borderless" style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }} styles={{ header: { backgroundColor: 'var(--bg-app)', padding: '8px 16px' }, body: { padding: 0 } }}>
                                    <Table columns={tableColumns} dataSource={allTickets.slice(0, 20)} rowKey="ticket_id" pagination={false} size="small" scroll={{ x: 600 }} />
                                  </Card>
                                </Col>
                              </Row>
                            );
                          })()
                        },
                        ...(milestoneData.milestones || []).map(m => {
                          const msColor = m.status === 'Completed' ? '#10b981' : m.status === 'In Progress' ? '#f59e0b' : '#94a3b8';
                          return {
                            key: String(m.milestone_id),
                            label: (
                              <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 600 }}>
                                <Badge color={msColor} style={{ marginRight: 4 }} />
                                งวด {m.installment_no}
                              </span>
                            ),
                            children: (
                              <div>
                                {/* Milestone Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
                                  <div>
                                    <Text strong style={{ fontSize: 15, color: 'var(--text-main)' }}>{m.title || `งวดที่ ${m.installment_no}`}</Text>
                                    <div style={{ marginTop: 4 }}>
                                      <Tag color={msColor} style={{ borderRadius: 6, fontSize: 11 }}>{m.status === 'Completed' ? 'เสร็จสมบูรณ์' : m.status === 'In Progress' ? 'กำลังดำเนินการ' : 'รอเริ่ม'}</Tag>
                                      {m.start_date && m.end_date && <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{dayjs(m.start_date).format('DD/MM/YY')} — {dayjs(m.end_date).format('DD/MM/YY')}</Text>}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <Text style={{ fontSize: 12, color: 'var(--text-sub)' }}>ความคืบหน้า</Text>
                                    <div style={{ width: isMobile ? 100 : 150, height: 8, borderRadius: 4, backgroundColor: 'var(--border-color)', marginTop: 4 }}>
                                      <div style={{ width: `${m.progress_percent || 0}%`, height: '100%', borderRadius: 4, backgroundColor: msColor, transition: 'width 0.5s ease' }} />
                                    </div>
                                    <Text style={{ fontSize: 11, color: msColor, fontWeight: 700 }}>{m.progress_percent || 0}%</Text>
                                  </div>
                                </div>

                                {/* Stats Grid */}
                                <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
                                  {[
                                    { label: 'ใบงานทั้งหมด', value: m.stats?.total || 0, icon: <FileTextOutlined />, color: '#6366f1' },
                                    { label: 'กำลังดำเนินการ', value: m.stats?.active || 0, icon: <HourglassOutlined />, color: '#f59e0b' },
                                    { label: 'แก้ไขแล้ว', value: m.stats?.resolved || 0, icon: <CheckSquareOutlined />, color: '#10b981' },
                                    { label: 'CM (ด่วน)', value: m.stats?.cm || 0, icon: <ThunderboltOutlined />, color: '#ef4444' },
                                    { label: 'หลุด SLA', value: m.stats?.sla_breached || 0, icon: <FireOutlined />, color: '#be123c' },
                                    { label: 'ค่าปรับ', value: `${(m.stats?.total_penalty || 0).toLocaleString()} ฿`, icon: <DollarCircleOutlined />, color: '#7c3aed' }
                                  ].map((s, i) => (
                                    <Col xs={8} sm={4} key={i}>
                                      <div style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '12px 8px', borderRadius: 10, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
                                        <div style={{ color: s.color, fontSize: isMobile ? 16 : 20 }}>{s.icon}</div>
                                        <div style={{ fontWeight: 800, fontSize: isMobile ? 14 : 18, color: s.color, margin: '2px 0' }}>{s.value}</div>
                                        <Text style={{ fontSize: isMobile ? 9 : 11, color: 'var(--text-sub)' }}>{s.label}</Text>
                                      </div>
                                    </Col>
                                  ))}
                                </Row>

                                {/* Charts */}
                                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                  <Col xs={24} lg={10}>
                                    <Card title={<span style={{ color: 'var(--text-main)', fontSize: 13 }}>สัดส่วนสถานะ</span>} variant="borderless" size="small" style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }} styles={{ header: { backgroundColor: 'var(--bg-app)', padding: '6px 14px' }, body: { padding: 8 } }}>
                                      {(m.status_breakdown || []).length > 0 ? (
                                        <div style={{ width: '100%', height: isMobile ? 220 : 260 }}>
                                          <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                              <Pie data={m.status_breakdown} cx="50%" cy="45%" innerRadius={isMobile ? 35 : 50} outerRadius={isMobile ? 60 : 80} paddingAngle={4} dataKey="value">
                                                {m.status_breakdown.map((entry, i) => <Cell key={`ms-${i}`} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
                                              </Pie>
                                              <RechartsTooltip />
                                              <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
                                            </PieChart>
                                          </ResponsiveContainer>
                                        </div>
                                      ) : <Empty description="ไม่มีข้อมูล" style={{ padding: '30px 0' }} />}
                                    </Card>
                                  </Col>
                                  <Col xs={24} lg={14}>
                                    <Card title={<span style={{ color: 'var(--text-main)', fontSize: 13 }}>จำนวนต่อหมวดหมู่</span>} variant="borderless" size="small" style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }} styles={{ header: { backgroundColor: 'var(--bg-app)', padding: '6px 14px' }, body: { padding: 8 } }}>
                                      {(m.category_breakdown || []).length > 0 ? (
                                        <div style={{ width: '100%', height: isMobile ? 220 : 260 }}>
                                          <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={m.category_breakdown} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-sub)' }} allowDecimals={false} />
                                              <YAxis dataKey="name" type="category" width={isMobile ? 80 : 120} tick={{ fontSize: isMobile ? 10 : 11, fill: 'var(--text-sub)' }} />
                                              <RechartsTooltip />
                                              <Bar dataKey="value" name="จำนวน" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                          </ResponsiveContainer>
                                        </div>
                                      ) : <Empty description="ไม่มีข้อมูล" style={{ padding: '30px 0' }} />}
                                    </Card>
                                  </Col>
                                </Row>

                                {/* Tickets Table */}
                                <Card title={<span style={{ color: 'var(--text-main)', fontSize: 13 }}>📋 รายการใบงานในงวด ({m.stats?.total || 0} รายการ)</span>} variant="borderless" size="small" style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }} styles={{ header: { backgroundColor: 'var(--bg-app)', padding: '6px 14px' }, body: { padding: 0 } }}>
                                  {(m.tickets || []).length > 0 ? (
                                    <Table
                                      columns={tableColumns}
                                      dataSource={m.tickets}
                                      rowKey="ticket_id"
                                      pagination={{ pageSize: 10, size: 'small', showSizeChanger: false, showTotal: (total) => `${total} รายการ` }}
                                      size="small"
                                      scroll={{ x: 600 }}
                                    />
                                  ) : <Empty description="ไม่มีใบงานในงวดนี้" style={{ padding: '30px 0' }} />}
                                </Card>
                              </div>
                            )
                          };
                        })
                      ]}
                    />
                  </div>
                )
              },
              {
                key: '2',
                label: (
                  <div style={{ padding: isMobile ? '2px 4px' : '4px 16px', fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold' }}>
                    <AppstoreOutlined style={{ marginRight: 4 }} /> กระดานใบงาน
                  </div>
                ),
                children: (
                  <div style={{ 
                    display: 'flex', 
                    width: '100%', 
                    gap: isMobile ? '12px' : '20px', 
                    paddingBottom: 15, 
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch'
                  }} className="kanban-container">
                    {boardColumns.map(column => {
                      // ✅ กรองตาม status_id
                      const columnTickets = tickets.filter(t => t.status_id === column.id);
                      const isDark = document.body.classList.contains('dark-mode');
                      const colBg = isDark ? `${column.color}25` : column.bgColor;
                      return (
                        <div key={column.id} style={{ 
                          flex: isMobile ? '0 0 280px' : 1, 
                          minWidth: 260, 
                          backgroundColor: colBg, 
                          borderRadius: 16, 
                          padding: '12px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          border: `1px solid ${column.borderColor}`,
                          maxHeight: '70vh'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Space size={4}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: column.color }}></div>
                              <Text strong style={{ margin: 0, color: column.color, fontSize: 14 }}>{column.title}</Text>
                            </Space>
                            <Badge count={columnTickets.length} style={{ backgroundColor: column.color, fontSize: 10 }} />
                          </div>
                          
                          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }} className="kanban-container">
                            {columnTickets.length > 0 ? (
                              columnTickets.map(t => <TicketCard key={t.ticket_id} ticket={t} colorTheme={column.color} />)
                            ) : (
                              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีรายการ" style={{ margin: '20px 0' }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            ]}
          />
        </Card>
      )}

      <Modal title={<span><FileTextOutlined /> ส่งผลงาน: <Text type="danger">{selectedTicket?.ticket_number}</Text></span>} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null} destroyOnHidden width={isMobile ? '95%' : 520}>
        <Form form={form} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item name="root_cause_and_solution" label="รายละเอียดการดำเนินการ" rules={[{ required: true, message: 'กรุณาระบุสิ่งที่ทำไป' }]}>
            <TextArea rows={4} placeholder="ระบุการดำเนินการที่ได้ทำไป..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="แนบไฟล์รูปภาพอ้างอิง">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }} block={isMobile}>เลือกไฟล์</Button>
            </Upload>
          </Form.Item>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <Button onClick={() => setIsModalVisible(false)} style={{ borderRadius: 8 }}>ยกเลิก</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#28a745', borderRadius: 8 }}>ส่งผลงาน</Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
}
