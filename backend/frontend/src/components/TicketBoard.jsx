import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Avatar, Button, Modal, Form, Input, Upload, Space, Empty, Spin, message, Select } from 'antd';
import { 
  ClockCircleOutlined, UserOutlined, FileTextOutlined, 
  UploadOutlined, CheckCircleOutlined, SyncOutlined, 
  ExclamationCircleOutlined, FireOutlined 
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../services/api/axiosInstance';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// ตั้งค่าภาษาไทยให้วันที่
dayjs.locale('th');

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function TicketBoard() {
  const { user: currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State สำหรับ Modal อัปเดตสถานะ
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketRes, statusRes] = await Promise.all([
        axiosInstance.get('/tickets'),
        axiosInstance.get('/statuses')
      ]);
      setTickets(ticketRes.data);
      setStatuses(statusRes.data);
    } catch (error) {
      message.error('ไม่สามารถโหลดข้อมูลใบงานได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ฟังก์ชันเปิด Modal อัปเดตสถานะ
  const handleOpenUpdateModal = (ticket) => {
    setSelectedTicket(ticket);
    setFileList([]);
    setIsModalVisible(true);
    
    setTimeout(() => {
      form.resetFields();
      // ตั้งค่าเริ่มต้นให้ฟอร์ม
      form.setFieldsValue({
        status: ticket.status === 'Pending' ? 'In Progress' : (ticket.status === 'In Progress' ? 'Resolved' : ticket.status)
      });
    }, 100);
  };

  // ฟังก์ชันบันทึกการอัปเดตสถานะ
  const handleUpdateStatus = async (values) => {
    const formData = new FormData();
    formData.append('status', values.status);
    if (values.root_cause_and_solution) {
      formData.append('root_cause_and_solution', values.root_cause_and_solution);
    }

    // แนบไฟล์
    fileList.forEach(file => {
      formData.append('attachments', file.originFileObj);
    });

    try {
      await axiosInstance.put(`/tickets/${selectedTicket.ticket_id}/update-status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('อัปเดตสถานะใบงานเรียบร้อยแล้ว!');
      setIsModalVisible(false);
      fetchData(); // โหลดกระดานใหม่
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // Props สำหรับ Upload Component
  const uploadProps = {
    onRemove: (file) => {
      setFileList(prev => prev.filter(item => item.uid !== file.uid));
    },
    beforeUpload: (file) => {
      setFileList(prev => [...prev, file]);
      return false; // หยุดไม่ให้อัปโหลดอัตโนมัติ
    },
    fileList,
  };

  // คอมโพเนนต์การ์ดใบงาน (Ticket Card)
  const TicketCard = ({ ticket, colorTheme }) => (
    <Card 
      hoverable 
      style={{ 
        marginBottom: 16, 
        borderRadius: 12, 
        borderLeft: `6px solid ${colorTheme}`,
        boxShadow: 'var(--card-shadow)',
        backgroundColor: 'var(--bg-card)'
      }}
      styles={{ body: { padding: '16px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <Text strong style={{ fontSize: 16, color: 'var(--text-main)' }}>{ticket.ticket_number}</Text>
        <Tag color={colorTheme} style={{ borderRadius: 10, margin: 0 }}>
          {ticket.category_name || 'ทั่วไป'}
        </Tag>
      </div>
      
      <Text type="secondary" ellipsis={{ tooltip: ticket.problem_detail }} style={{ display: 'block', marginBottom: 12, minHeight: 44, color: 'var(--text-sub)' }}>
        {ticket.problem_detail}
      </Text>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space size="small">
          <Avatar size="small" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-sub)' }} icon={<UserOutlined />} />
          <Text type="secondary" style={{ fontSize: 12, color: 'var(--text-sub)' }}>{ticket.reporter_name}</Text>
        </Space>
        <Space size="small" style={{ color: 'var(--text-sub)', fontSize: 12 }}>
          <ClockCircleOutlined />
          {dayjs(ticket.created_at).format('DD MMM')}
        </Space>
      </div>

      {currentUser.role !== 'user' && (
        <Button 
          type="dashed" 
          block 
          style={{ borderRadius: 8, color: colorTheme, borderColor: colorTheme }}
          onClick={() => handleOpenUpdateModal(ticket)}
        >
          {ticket.status === 'Pending' ? 'เริ่มดำเนินการ' : 'อัปเดตสถานะ'}
        </Button>
      )}
    </Card>
  );

  return (
    <div style={{ padding: '20px', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ color: 'var(--text-main)', margin: 0 }}><FireOutlined style={{ color: '#ef4444' }}/> กระดานสถานะใบงาน (Kanban Board)</Title>
        <Button type="primary" icon={<SyncOutlined />} onClick={fetchData} loading={loading}>รีเฟรชข้อมูล</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
          {statuses.map(status => {
            const columnTickets = tickets.filter(t => t.status === status.status_name);
            const colorTheme = status.status_color || '#3b82f6';
            const isDark = document.body.classList.contains('dark-mode');
            const bgColor = isDark ? `${colorTheme}25` : `${colorTheme}10`;
            const borderColor = `${colorTheme}40`;

            return (
              <div key={status.status_id} style={{ 
                minWidth: '300px', flex: 1, backgroundColor: bgColor, 
                borderRadius: 16, padding: '16px', border: `1px solid ${borderColor}`,
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Space>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: colorTheme }}></div>
                    <Title level={4} style={{ color: 'var(--text-main)', margin: 0 }}>{status.status_name} ({columnTickets.length})</Title>
                  </Space>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '70vh' }}>
                  {columnTickets.length > 0 ? (
                    columnTickets.map(t => <TicketCard key={t.ticket_id} ticket={t} colorTheme={colorTheme} />)
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีใบงาน" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal สำหรับอัปเดตสถานะ */}
      <Modal
        title={<span><FileTextOutlined /> อัปเดตสถานะใบงาน: <Text type="danger">{selectedTicket?.ticket_number}</Text></span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnHidden
        forceRender
      >
        <div style={{ backgroundColor: 'var(--bg-app)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <Text strong style={{ color: 'var(--text-main)' }}>ปัญหาที่แจ้ง:</Text> <br/>
          <Text type="secondary" style={{ color: 'var(--text-sub)' }}>{selectedTicket?.problem_detail}</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item name="status" label="เปลี่ยนสถานะเป็น" rules={[{ required: true }]}>
            <Select size="large">
              {statuses.map(s => (
                <Select.Option key={s.status_id} value={s.status_name}>
                  <Tag color={s.status_color}>{s.status_name}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="root_cause_and_solution" label="สาเหตุและวิธีแก้ไข (บังคับกรอกเมื่อปิดงาน)">
            <TextArea 
              rows={4} 
              placeholder="ระบุสาเหตุของปัญหา และวิธีการแก้ไขที่ได้ทำไป..." 
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item label="แนบไฟล์เอกสาร / รูปภาพอ้างอิง (ถ้ามี)">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>คลิกเพื่อเลือกไฟล์</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 30, marginBottom: 0 }}>
            <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 10, borderRadius: 8 }}>ยกเลิก</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#1890ff', borderRadius: 8 }}>บันทึกสถานะ</Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
