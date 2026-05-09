import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Typography, Space, Input, Select, Row, Col, Card, Radio, Tooltip, Empty, Grid, theme, Divider } from 'antd';
import { 
  SearchOutlined, EyeOutlined, PrinterOutlined, AppstoreOutlined, 
  BarsOutlined, UserOutlined, ClockCircleOutlined, ThunderboltOutlined, FolderOpenOutlined
} from '@ant-design/icons';
import axiosInstance from '../services/api/axiosInstance';
import { Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { alertError } from '../utils/alert';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;
const { useToken } = theme;

export default function TicketList({ project }) {
  const { token } = useToken();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงค่าจาก URL หรือใช้ค่า Default
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [filterStatusId, setFilterStatusId] = useState(searchParams.get('status') || 'All');
  const [viewMode, setViewMode] = useState(searchParams.get('view') || 'card');
  
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // ฟังก์ชันอัปเดต URL เมื่อสถานะเปลี่ยน
  const updateUrlParams = useCallback((search, status, view) => {
    const params = {};
    if (search) params.search = search;
    if (status !== 'All') params.status = status;
    if (view !== 'card') params.view = view;
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // ซิงค์ URL เมื่อ State เปลี่ยน
  useEffect(() => {
    updateUrlParams(searchText, filterStatusId, viewMode);
  }, [searchText, filterStatusId, viewMode, updateUrlParams]);

  useEffect(() => {
    fetchTickets();
    fetchStatuses();
  }, [project]);

  // ลอจิกการค้นหาและกรองข้อมูล
  useEffect(() => {
    let result = tickets;
    
    if (filterStatusId !== 'All') {
      result = result.filter(t => t.status_id === filterStatusId);
    }
    
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(t => 
        (t.ticket_number || '').toLowerCase().includes(lowerSearch) ||
        (t.reporter_name || '').toLowerCase().includes(lowerSearch) ||
        (t.problem_detail || '').replace(/<[^>]*>?/gm, '').toLowerCase().includes(lowerSearch)
      );
    }
    
    setFilteredTickets(result);
  }, [searchText, filterStatusId, tickets]);

  const fetchTickets = async () => {
    if (!project) return; 
    
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/tickets?project_id=${project.project_id}`);
      setTickets(res.data);
      setFilteredTickets(res.data); 
    } catch (err) {
      console.error(err);
      alertError('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลรายการใบงานได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await axiosInstance.get('/statuses');
      setStatuses(res.data);
    } catch (err) {
      console.error('Failed to load statuses', err);
    }
  };

  // Helper สำหรับตัด Tag HTML ออก
  const stripHtml = (html) => {
    if (!html) return '-';
    return html.replace(/<[^>]*>?/gm, '');
  };

  // ==========================================
  // การตั้งค่าคอลัมน์สำหรับ "โหมดตาราง"
  // ==========================================
  const columns = [
    { 
      title: 'เลขที่ใบงาน', 
      dataIndex: 'ticket_number', 
      key: 'ticket_number', 
      width: 120,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.is_cm === 1 && <Tag color="error" style={{ fontSize: 10, marginTop: 4 }}>CM</Tag>}
        </Space>
      ) 
    },
    { 
      title: 'รายละเอียดปัญหา', 
      dataIndex: 'problem_detail', 
      key: 'problem_detail',
      render: (text) => (
        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, maxWidth: 300 }}>
          {stripHtml(text)}
        </Paragraph>
      )
    },
    { 
      title: 'ผู้แจ้ง / หมวดหมู่', 
      key: 'reporter_category',
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Text><UserOutlined /> {record.reporter_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}><FolderOpenOutlined /> {record.category_name || '-'}</Text>
        </Space>
      )
    },
    { 
      title: 'วันที่แจ้ง', 
      dataIndex: 'created_at', 
      key: 'created_at',
      width: 150,
      render: (val) => <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(val).format('DD/MM/YY HH:mm')} น.</Text>
    },
    { 
      title: 'สถานะ', 
      key: 'status', 
      align: 'center',
      width: 150,
      render: (_, record) => (
        <Tag color={record.status_color || 'default'} style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 'bold' }}>
          {record.status_name}
        </Tag>
      )
    },
    { 
      title: 'จัดการ', 
      key: 'action', 
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Link to={`/ticket/${record.ticket_id}`}>
            <Button type="primary" size="small" icon={<EyeOutlined />} style={{ borderRadius: 6 }} />
          </Link>
          <Link to={`/print/${record.ticket_id}`} target="_blank">
            <Button type="default" size="small" icon={<PrinterOutlined />} style={{ borderRadius: 6 }} />
          </Link>
        </Space>
      )
    },
  ];

  // ==========================================
  // Render "โหมดการ์ด" (Card View) - ปรับปรุงใหม่
  // ==========================================
  const renderCardView = () => {
    if (filteredTickets.length === 0) {
      return <Empty description="ไม่พบข้อมูลใบแจ้งซ่อม" style={{ marginTop: 50 }} />;
    }

    return (
      <Row gutter={[isMobile ? 12 : 24, isMobile ? 12 : 24]}>
        {filteredTickets.map(ticket => (
          <Col xs={24} sm={12} lg={8} key={ticket.ticket_id}>
            <Card 
              hoverable 
              style={{ 
                borderRadius: isMobile ? '16px' : '24px',
                border: `1px solid ${token.colorBorderSecondary}`, 
                boxShadow: token.boxShadowTertiary,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'all 0.3s ease'
              }}
              styles={{ body: { padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', flex: 1 } }}
              onMouseEnter={(e) => { if(!isMobile) { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = token.boxShadow; } }}
              onMouseLeave={(e) => { if(!isMobile) { e.currentTarget.style.transform = 'translateY(0px)'; e.currentTarget.style.boxShadow = token.boxShadowTertiary; } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? 10 : 15 }}>
                <div>
                  <Title level={5} style={{ margin: 0, fontSize: isMobile ? '15px' : '17px' }}>{ticket.ticket_number}</Title>
                  <div style={{ marginTop: 4 }}>
                    {ticket.is_cm === 1 ? (
                      <Tag color="error" icon={<ThunderboltOutlined />} style={{ borderRadius: 10, fontSize: '10px', margin: 0 }}>CM</Tag>
                    ) : (
                      <Tag color="default" style={{ borderRadius: 10, fontSize: '10px', margin: 0 }}>แจ้งทั่วไป</Tag>
                    )}
                  </div>
                </div>
                <Tag color={ticket.status_color || 'default'} style={{ borderRadius: 12, margin: 0, fontWeight: 'bold', fontSize: isMobile ? '10px' : '11px', padding: '1px 8px' }}>
                  {ticket.status_name}
                </Tag>
              </div>

              <div style={{ flex: 1, marginBottom: isMobile ? 12 : 18 }}>
                <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: isMobile ? '13px' : '14.5px', minHeight: isMobile ? '36px' : '44px', marginBottom: 12, fontWeight: 500, lineHeight: '1.4' }}>
                  {stripHtml(ticket.problem_detail)}
                </Paragraph>
                <div style={{ backgroundColor: token.colorFillAlter, padding: isMobile ? '8px 12px' : '12px', borderRadius: '12px', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Space orientation="vertical" size={isMobile ? 2 : 6} style={{ width: '100%', fontSize: isMobile ? '11px' : '12px' }}>
                    <Text type="secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FolderOpenOutlined style={{ color: token.colorPrimary, fontSize: isMobile ? '12px' : '14px' }} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{ticket.category_name || 'ไม่ระบุ'}</span>
                    </Text>
                    <Text type="secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserOutlined style={{ color: token.colorPrimary, fontSize: isMobile ? '12px' : '14px' }} /> <span>{ticket.reporter_name}</span>
                    </Text>
                    <Text type="secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ClockCircleOutlined style={{ color: token.colorPrimary, fontSize: isMobile ? '12px' : '14px' }} /> <span>{dayjs(ticket.created_at).format('DD MMM YY HH:mm')}</span>
                    </Text>
                  </Space>
                </div>
              </div>

              <div style={{ borderTop: `1px dashed ${token.colorBorderSecondary}`, paddingTop: isMobile ? 12 : 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Link to={`/print/${ticket.ticket_id}`} target="_blank">
                  <Button icon={<PrinterOutlined />} style={{ borderRadius: 10, height: isMobile ? '34px' : '38px', width: isMobile ? '34px' : '38px' }} />
                </Link>
                <Link to={`/ticket/${ticket.ticket_id}`} style={{ flex: 1 }}>
                  <Button type="primary" block style={{ borderRadius: 10, fontWeight: 'bold', height: isMobile ? '34px' : '38px', fontSize: isMobile ? '12px' : '14px' }}>
                    <EyeOutlined /> {isMobile ? 'ดู' : 'ดูรายละเอียด'}
                  </Button>
                </Link>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="old-style-card" style={{ minHeight: '80vh', padding: isMobile ? '12px' : '24px', backgroundColor: token.colorBgLayout, borderRadius: 16 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${token.colorPrimary}`, paddingBottom: 15, marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
          🗂️ รายการใบแจ้งซ่อม
        </Title>
        
        <Radio.Group 
          value={viewMode} 
          onChange={(e) => setViewMode(e.target.value)} 
          buttonStyle="solid"
          size={isMobile ? "small" : "middle"}
        >
          <Radio.Button value="card" style={{ borderRadius: '8px 0 0 8px' }}><AppstoreOutlined /> {isMobile ? '' : 'การ์ด'}</Radio.Button>
          <Radio.Button value="table" style={{ borderRadius: '0 8px 8px 0' }}><BarsOutlined /> {isMobile ? '' : 'ตาราง'}</Radio.Button>
        </Radio.Group>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12} lg={10}>
          <Input 
            placeholder="ค้นหาใบงาน..." 
            prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />} 
            size={isMobile ? "middle" : "large"} 
            allowClear 
            onChange={(e) => setSearchText(e.target.value)} 
            style={{ borderRadius: 10 }}
          />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Select 
            value={filterStatusId} 
            size={isMobile ? "middle" : "large"} 
            style={{ width: '100%' }} 
            onChange={(value) => setFilterStatusId(value)}
            options={[
              { value: 'All', label: '📋 แสดงทั้งหมด' },
              ...statuses.map(s => ({
                value: s.status_id,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.status_color, marginRight: 8 }}></div>
                    {s.status_name}
                  </div>
                )
              }))
            ]}
          />
        </Col>
      </Row>

      {/* สลับการแสดงผลตาม State (viewMode) */}
      {viewMode === 'card' ? (
        renderCardView()
      ) : (
        <Table 
          columns={columns} 
          dataSource={filteredTickets} 
          rowKey="ticket_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
          style={{ backgroundColor: token.colorBgContainer, borderRadius: 12, overflow: 'hidden', border: `1px solid ${token.colorBorderSecondary}` }}
        />
      )}
      
    </div>
  );
}
