import React, { useState, useEffect } from 'react';
import { Col, Row, Table, Tag, Button, Typography, Space } from 'antd'; // ❌ เอา message ออก
import { 
  FileTextOutlined, CalendarOutlined, HourglassOutlined, 
  ClockCircleOutlined, PlusCircleOutlined, CheckSquareOutlined,
  PrinterOutlined, EditOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Link } from 'react-router-dom';

// ✅ นำเข้า Alert Helper
import { alertError } from '../utils/alert';

const { Title, Text } = Typography;
const COLORS = ['#ef8157', '#a144de', '#ffc658', '#42a5f5', '#66bb6a'];

export default function TicketDashboard({ project }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    if (!project) return; 
    
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/tickets?project_id=${project.project_id}`);
      setTickets(res.data);
    } catch (err) {
      // ✅ เปลี่ยนจาก message เป็น SweetAlert2
      alertError('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTickets(); 
  }, [project]);

  // --- ส่วนคำนวณสถิติและ Render (เหมือนเดิมเป๊ะ ไม่เปลี่ยนแปลง) ---
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  const stats = [
    { title: 'ใบงานทั้งหมด', value: tickets.length, color: '#17a2b8', icon: <FileTextOutlined style={{fontSize: 24}}/> },
    { title: 'ใบงานเดือนนี้', value: tickets.filter(t => t.created_at?.startsWith(currentMonth)).length, color: '#28a745', icon: <CalendarOutlined style={{fontSize: 24}}/> },
    { title: 'ใบงานที่นับเวลา', value: tickets.filter(t => t.status === 'Pending' || t.status === 'In Progress').length, color: '#ffc107', icon: <HourglassOutlined style={{fontSize: 24}}/> },
    { title: 'ใบงานที่ไม่นับเวลา', value: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length, color: '#6c757d', icon: <ClockCircleOutlined style={{fontSize: 24}}/> },
    { title: 'ใบงานที่สร้างวันนี้', value: tickets.filter(t => t.created_at?.startsWith(today)).length, color: '#e83e8c', icon: <PlusCircleOutlined style={{fontSize: 24}}/> },
    { title: 'ใบงานที่ตรวจวันนี้', value: tickets.filter(t => t.updated_at?.startsWith(today) && (t.status === 'Resolved' || t.status === 'Closed')).length, color: '#20c997', icon: <CheckSquareOutlined style={{fontSize: 24}}/> },
  ];

  const categoryCount = {};
  tickets.forEach(t => {
    const name = t.category_name || 'ไม่ระบุ';
    categoryCount[name] = (categoryCount[name] || 0) + 1;
  });
  const chartData = Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] }));

  const columns = [
    { title: 'เลขที่', dataIndex: 'ticket_number', key: 'ticket_number', render: (text) => <b>{text}</b> },
    { title: 'วันที่แจ้ง', dataIndex: 'created_at', key: 'created_at', render: (date) => new Date(date).toLocaleDateString('th-TH') },
    { title: 'ผู้แจ้ง', dataIndex: 'reporter_name', key: 'reporter_name' },
    { title: 'ระบบงาน', dataIndex: 'category_name', key: 'category_name' },
    { title: 'สถานะ', key: 'status', dataIndex: 'status', render: (status) => <Tag color={status === 'Pending' ? 'orange' : 'green'}>{status}</Tag> },
    { 
      title: 'จัดการ', 
      key: 'action', 
      render: (_, record) => (
        <Space>
          <Link to={`/ticket/${record.ticket_id}`}>
            <Button type="primary" size="small" icon={<EditOutlined />} style={{ backgroundColor: '#ef8157', borderColor: '#ef8157' }}>
             รายละเอียด / อัปเดต
            </Button>
          </Link>
          {record.status !== 'Pending' && (
            <Link to={"/print/" + record.ticket_id} target="_blank">
              <Button size="small" icon={<PrinterOutlined />}>พิมพ์</Button>
            </Link>
          )}
        </Space>
      )
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {stats.map(s => (
          <Col xs={12} sm={8} lg={4} key={s.title}>
            <div className="stat-box" style={{ backgroundColor: s.color }}>
              <div style={{ marginBottom: 10 }}>{s.icon}</div>
              <Title level={2} style={{ color: 'white', margin: 0 }}>{s.value}</Title>
              <Text style={{ color: 'white', fontSize: 12 }}>{s.title}</Text>
            </div>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8} xl={7}>
          <div className="old-style-card">
            <Title level={5} style={{textAlign: 'center', marginBottom: 20}}>📊 สัดส่วนใบงาน</Title>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label>
                      {chartData.map((entry, index) => <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <Text type="secondary">ไม่มีข้อมูล</Text>}
          </div>
        </Col>
        <Col xs={24} lg={16} xl={17}>
          <div className="old-style-card" style={{ overflowX: 'auto', width: '100%' }}>
            <Title level={5} style={{marginBottom: 15}}>📋 รายการแจ้งซ่อมล่าสุด</Title>
            <Table columns={columns} dataSource={tickets} rowKey="ticket_id" loading={loading} pagination={{ pageSize: 5 }} size="small" scroll={{ x: 800 }} />
          </div>
        </Col>
      </Row>
    </div>
  );
}