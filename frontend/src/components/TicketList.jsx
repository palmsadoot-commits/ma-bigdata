import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Typography, Space, Input, Select, Row, Col } from 'antd';
import { SearchOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Link } from 'react-router-dom';

// ✅ นำเข้า Alert Helper
import { alertError } from '../utils/alert';

const { Title } = Typography;
const { Option } = Select;

export default function TicketList({ project }) {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchTickets();
  }, [project]);

  const fetchTickets = async () => {
    if (!project) return; 
    
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/tickets?project_id=${project.project_id}`);
      setTickets(res.data);
      setFilteredTickets(res.data); 
    } catch (err) {
      console.error(err);
      alertError('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลรายการใบงานได้'); // ✅ ใช้ SweetAlert2 ดักจับ Error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = tickets;

    if (filterStatus !== 'All') {
      result = result.filter(t => t.status === filterStatus);
    }

    if (searchText) {
      const keyword = searchText.toLowerCase();
      result = result.filter(t => 
        (t.ticket_number && t.ticket_number.toLowerCase().includes(keyword)) ||
        (t.reporter_name && t.reporter_name.toLowerCase().includes(keyword))
      );
    }

    setFilteredTickets(result);
  }, [searchText, filterStatus, tickets]);

  const columns = [
    { title: 'เลขที่ใบงาน', dataIndex: 'ticket_number', key: 'ticket_number', render: (text) => <b>{text}</b> },
    { title: 'วันที่แจ้ง', dataIndex: 'created_at', key: 'created_at', render: (date) => new Date(date).toLocaleString('th-TH') },
    { title: 'ผู้แจ้ง', dataIndex: 'reporter_name', key: 'reporter_name' },
    { title: 'ระบบงาน', dataIndex: 'category_name', key: 'category_name' },
    { 
      title: 'สถานะ', 
      key: 'status', 
      dataIndex: 'status', 
      render: (status) => {
        let color = 'blue';
        if (status === 'Pending') color = 'orange';
        if (status === 'In Progress') color = 'cyan';
        if (status === 'Resolved') color = 'green';
        if (status === 'Closed') color = 'default';
        return <Tag color={color}>{status}</Tag>;
      } 
    },
    { 
      title: 'จัดการ', 
      key: 'action', 
      render: (_, record) => (
        <Space>
          <Link to={`/ticket/${record.ticket_id}`}>
            <Button type="primary" size="small" icon={<EyeOutlined />} style={{ backgroundColor: '#2a1a4a', borderColor: '#2a1a4a' }}>
              เปิดดู
            </Button>
          </Link>
          {record.status !== 'Pending' && (
            <Link to={`/print/${record.ticket_id}`} target="_blank">
              <Button size="small" icon={<PrinterOutlined />}>พิมพ์</Button>
            </Link>
          )}
        </Space>
      )
    },
  ];

  return (
    <div className="old-style-card" style={{ minHeight: '80vh' }}>
      <Title level={4} style={{ borderBottom: '2px solid #ef8157', paddingBottom: 10, marginBottom: 20 }}>
        🗂️ รายการใบแจ้งซ่อมทั้งหมด
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12} lg={8}>
          <Input placeholder="ค้นหาเลขที่ใบงาน หรือ ชื่อผู้แจ้ง..." prefix={<SearchOutlined />} size="large" allowClear onChange={(e) => setSearchText(e.target.value)} />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Select defaultValue="All" size="large" style={{ width: '100%' }} onChange={(value) => setFilterStatus(value)}>
            <Option value="All">📋 แสดงสถานะทั้งหมด</Option>
            <Option value="Pending">🟠 รอดำเนินการ (Pending)</Option>
            <Option value="In Progress">🔵 กำลังดำเนินการ (In Progress)</Option>
            <Option value="Resolved">🟢 แก้ไขเสร็จสิ้น (Resolved)</Option>
            <Option value="Closed">⚪ ปิดงาน (Closed)</Option>
          </Select>
        </Col>
      </Row>

      <Table 
        columns={columns} 
        dataSource={filteredTickets} 
        rowKey="ticket_id" 
        loading={loading} 
        pagination={{ pageSize: 10, showSizeChanger: true }}
        bordered
        scroll={{ x: 800 }}
      />
    </div>
  );
}