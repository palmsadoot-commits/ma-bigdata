import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Tag, Space, Button, Input, DatePicker, Row, Col } from 'antd';
import { HistoryOutlined, SyncOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import axiosInstance from '../services/api/axiosInstance';
import { formatThaiDate } from '../utils/dateUtils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/audit');
      setLogs(res.data);
    } catch (error) {
      console.error("Fetch audit logs error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionTag = (action) => {
    let color = 'default';
    if (action.includes('LOGIN_SUCCESS')) color = 'success';
    if (action.includes('LOGIN_FAILED')) color = 'error';
    if (action.includes('TICKET_CREATED')) color = 'blue';
    if (action.includes('TICKET_STATUS')) color = 'orange';
    if (action.includes('USER_DELETED')) color = 'magenta';
    if (action.includes('PROFILE')) color = 'purple';
    
    return <Tag color={color}>{action}</Tag>;
  };

  const columns = [
    {
      title: 'วันเวลา (Date Time)',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 200,
      render: (text) => <Text style={{ fontSize: 13 }}>{formatThaiDate(text)}</Text>,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'ผู้ใช้งาน (User)',
      key: 'user',
      width: 180,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <Text strong>{record.username || 'System/Guest'}</Text>
        </Space>
      )
    },
    {
      title: 'เหตุการณ์ (Action)',
      dataIndex: 'action',
      key: 'action',
      width: 180,
      render: (text) => getActionTag(text)
    },
    {
      title: 'รายละเอียด (Detail)',
      dataIndex: 'detail',
      key: 'detail',
      render: (text) => <Text type="secondary">{text}</Text>
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
      render: (text) => <Tag style={{ fontFamily: 'monospace' }}>{text}</Tag>
    }
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={2} style={{ color: '#2a1a4a', margin: 0 }}><HistoryOutlined /> บันทึกการเข้าใช้งาน (Audit Logs)</Title>
        <Button icon={<SyncOutlined />} onClick={fetchLogs} loading={loading}>รีเฟรชข้อมูล</Button>
      </div>

      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Input placeholder="ค้นหาเหตุการณ์ หรือ รายละเอียด..." prefix={<SearchOutlined />} size="large" onChange={e => setSearchText(e.target.value)} />
            </Col>
            <Col xs={24} md={8}>
              <RangePicker size="large" style={{ width: '100%' }} />
            </Col>
          </Row>
        </div>

        <Table 
          columns={columns} 
          dataSource={logs.filter(l => 
            l.action?.toLowerCase().includes(searchText.toLowerCase()) || 
            l.detail?.toLowerCase().includes(searchText.toLowerCase()) ||
            l.username?.toLowerCase().includes(searchText.toLowerCase())
          )} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
