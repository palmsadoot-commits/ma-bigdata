import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Typography, Tag, Avatar, Button, Modal, Form, Input, Upload, Space, Empty, Spin, Tabs, Table, Tooltip as AntTooltip, Statistic, Select, Divider, Grid, Badge } from 'antd';
import { 
  ClockCircleOutlined, UserOutlined, FileTextOutlined, UploadOutlined, DashboardOutlined, SyncOutlined, 
  CalendarOutlined, HourglassOutlined, PlusCircleOutlined, CheckSquareOutlined, PrinterOutlined, 
  EditOutlined, BarChartOutlined, AppstoreOutlined, FireOutlined, DollarCircleOutlined, AlertOutlined,
  ThunderboltOutlined, InfoCircleOutlined, TagOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
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
      const [ticketRes, statusRes] = await Promise.all([
        axiosInstance.get('/tickets', { 
          params: { project_id: project.project_id },
          signal: signal instanceof AbortSignal ? signal : undefined
        }),
        axiosInstance.get('/statuses', {
          signal: signal instanceof AbortSignal ? signal : undefined
        })
      ]);

      const data = ticketRes.data || [];
      setTickets(data);
      setStatuses(statusRes.data || []);

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
    { title: 'TOTAL TICKETS', value: tickets.length, bg: '#1e293b', border: '#334155', color: '#f8fafc', icon: <FileTextOutlined /> },
    { title: 'MONTHLY VOLUME', value: tickets.filter(t => t.created_at?.startsWith(currentMonth)).length, bg: '#1e293b', border: '#334155', color: '#f8fafc', icon: <CalendarOutlined /> },
    { title: 'IN PROGRESS', value: tickets.filter(t => t.status_id === 1 || t.status_id === 2).length, bg: '#1e293b', border: '#f59e0b', color: '#f59e0b', icon: <HourglassOutlined /> },
    { title: 'RESOLVED / CLOSED', value: tickets.filter(t => t.status_id === 3 || t.status_id === 4).length, bg: '#1e293b', border: '#10b981', color: '#10b981', icon: <CheckSquareOutlined /> },
    { title: 'NEW TODAY', value: tickets.filter(t => t.created_at?.startsWith(today)).length, bg: '#0f172a', border: '#2563eb', color: '#3b82f6', icon: <PlusCircleOutlined /> },
    { title: 'RECENT UPDATES', value: tickets.filter(t => t.created_at?.startsWith(today)).length, bg: '#0f172a', border: '#14b8a6', color: '#2dd4bf', icon: <SyncOutlined /> },
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <Title level={isMobile ? 4 : 2} style={{ color: 'var(--text-main)', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>SYSTEM OVERVIEW</Title>
        <Button type="primary" icon={<SyncOutlined />} onClick={fetchData} loading={loading} size={isMobile ? "middle" : "large"} style={{ borderRadius: 6, fontWeight: 600 }}>REFRESH</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {stats.map(s => (
          <Col xs={12} sm={8} lg={4} key={s.title}>
            <div className="stat-card" style={{ 
              position: 'relative', overflow: 'hidden',
              background: s.bg, borderRadius: 12, padding: '24px 16px', color: s.color, textAlign: 'center',
              border: `1px solid ${s.border}`,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <div style={{ opacity: 0.6, marginBottom: 8 }}>{React.cloneElement(s.icon, { style: { fontSize: 20 } })}</div>
              <Title level={2} style={{ color: s.color, margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}><AnimatedNumber value={s.value} /></Title>
              <Text style={{ color: s.color, fontSize: 10, opacity: 0.7, fontWeight: 700, letterSpacing: '0.05em' }}>{s.title}</Text>
            </div>
          </Col>
        ))}
      </Row>

      {(currentUser?.role === 'admin' || currentUser?.role === 'head_technician' || currentUser?.role === 'technician') && (
        <Card style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', marginBottom: 32 }} styles={{ body: { padding: isMobile ? '16px' : '24px' } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
            <Title level={isMobile ? 5 : 4} style={{ color: 'var(--text-main)', margin: 0, fontWeight: 700, letterSpacing: '-0.01em' }}>
              SLA PERFORMANCE MONITOR
            </Title>
            <Space orientation={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
              <Text strong style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.05em' }}>EVALUATION PERIOD:</Text>
              <Select value={selectedPeriod} onChange={setSelectedPeriod} style={{ width: isMobile ? '100%' : 180 }} size="small" variant="filled">
                <Option value="all">ALL TIME</Option>
                {availablePeriods.map(p => (
                  <Option key={p} value={p}>{dayjs(p).format('MMM YYYY').toUpperCase()}</Option>
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
        <Card styles={{ body: { padding: isMobile ? '8px' : '24px' } }} style={{ borderRadius: 12, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <Tabs 
            className="custom-tabs" 
            activeKey={activeTab}
            onChange={setActiveTab}
            size={isMobile ? "small" : "large"}
            tabBarStyle={{ marginBottom: 24 }}
            items={[
              {
                key: '1',
                label: (
                  <div style={{ padding: isMobile ? '2px 4px' : '4px 16px', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
                    ANALYTICS & LIST
                  </div>
                ),
                children: (
                  <Row gutter={[24, 24]} style={{ marginTop: 8 }}>
                    <Col xs={24} lg={9}>
                      <Card 
                        title={<span style={{ color: 'var(--text-main)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>TICKET DISTRIBUTION</span>} 
                        variant="borderless" 
                        style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                        styles={{ header: { backgroundColor: 'var(--bg-app)', padding: '12px 16px' }, body: { padding: 16 } }}
                      >
                        {chartData.length > 0 ? (
                          <div style={{ width: '100%', height: isMobile ? 300 : 400, minHeight: 300 }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={300}>
                              <PieChart>
                                <Pie data={chartData} cx="50%" cy="45%" innerRadius={isMobile ? 60 : 80} outerRadius={isMobile ? 90 : 110} paddingAngle={4} dataKey="value">
                                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 20 }}/>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : <Empty description="NO DATA AVAILABLE" />}
                      </Card>
                    </Col>
                    <Col xs={24} lg={15}>
                      <Card 
                        title={<span style={{ color: 'var(--text-main)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>LATEST ENTRIES</span>} 
                        variant="borderless" 
                        style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                        styles={{ header: { backgroundColor: 'var(--bg-app)', padding: '12px 16px' }, body: { padding: 0 } }}
                      >
                        <Table columns={tableColumns} dataSource={activeRecentTickets} rowKey="ticket_id" pagination={false} size="small" scroll={{ x: 600 }} />
                      </Card>
                    </Col>
                  </Row>
                )
              },
              {
                key: '2',
                label: (
                  <div style={{ padding: isMobile ? '2px 4px' : '4px 16px', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
                    KANBAN BOARD
                  </div>
                ),
                children: (
                  <div style={{ 
                    display: 'flex', 
                    width: '100%', 
                    gap: isMobile ? '16px' : '24px', 
                    paddingBottom: 8, 
                    overflowX: isMobile ? 'auto' : 'hidden',
                    flexWrap: isMobile ? 'nowrap' : 'nowrap',
                    WebkitOverflowScrolling: 'touch'
                  }} className="kanban-container">
                    {boardColumns.map(column => {
                      const columnTickets = tickets.filter(t => t.status_id === column.id);
                      const isDark = document.body.classList.contains('dark-mode');
                      const colBg = isDark ? `${column.color}15` : column.bgColor;
                      return (
                        <div key={column.id} style={{ 
                          flex: isMobile ? '0 0 85%' : `1 1 ${100 / boardColumns.length}%`, 
                          minWidth: isMobile ? '280px' : '240px', 
                          backgroundColor: colBg, 
                          borderRadius: 12, 
                          padding: '16px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          border: `1px solid ${column.borderColor}`,
                          maxHeight: '75vh',
                          transition: 'flex 0.3s ease'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Space size={8}>
                              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: column.color }}></div>
                              <Text strong style={{ margin: 0, color: column.color, fontSize: 12, letterSpacing: '0.05em' }}>{column.title.toUpperCase()}</Text>
                            </Space>
                            <Badge count={columnTickets.length} showZero style={{ backgroundColor: column.color, fontSize: 10, boxShadow: 'none' }} />
                          </div>
                          
                          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }} className="kanban-scroll">
                            {columnTickets.length > 0 ? (
                              columnTickets.map(t => <TicketCard key={t.ticket_id} ticket={t} colorTheme={column.color} />)
                            ) : (
                              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary" style={{ fontSize: 11 }}>NO ENTRIES</Text>} style={{ margin: '40px 0' }} />
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
