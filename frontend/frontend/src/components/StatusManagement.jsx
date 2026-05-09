import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Table, Button, Space, Typography, Tag, Modal, Form, 
  Input, InputNumber, Popconfirm, ColorPicker, Switch, theme, App, Row, Col, Divider
} from 'antd';
import { 
  TagsOutlined, PlusOutlined, EditOutlined, DeleteOutlined, 
  FormatPainterOutlined, SortAscendingOutlined, 
  CheckCircleOutlined, StopOutlined
} from '@ant-design/icons';
import axiosInstance from '../services/api/axiosInstance';

const { Title, Text } = Typography;

export default function StatusManagement() {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [form] = Form.useForm();

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/statuses');
      const validData = Array.isArray(res.data) 
        ? res.data.filter(item => item && (item.status_id || item.status_name)) 
        : [];
      setStatuses(validData);
    } catch (error) {
      message.error('ไม่สามารถโหลดข้อมูลสถานะได้');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  const showModal = (record = null) => {
    setEditingStatus(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        is_active: record.is_active === 1
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ 
        sort_order: statuses.length + 1, 
        is_active: true,
        status_color: '#1677ff'
      });
    }
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        status_color: typeof values.status_color === 'string' ? values.status_color : values.status_color.toHexString(),
        is_active: values.is_active ? 1 : 0
      };

      if (editingStatus) {
        await axiosInstance.put(`/statuses/${editingStatus.status_id}`, payload);
        message.success('อัปเดตป้ายสถานะเรียบร้อยแล้ว');
      } else {
        await axiosInstance.post('/statuses', payload);
        message.success('เพิ่มป้ายสถานะใหม่เรียบร้อยแล้ว');
      }
      setIsModalVisible(false);
      fetchStatuses();
    } catch (error) {
      message.error('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/statuses/${id}`);
      message.success('ลบสถานะเรียบร้อยแล้ว');
      fetchStatuses();
    } catch (error) {
      message.error('ไม่สามารถลบสถานะนี้ได้');
    }
  };

  const toggleStatus = async (record, checked) => {
      try {
          await axiosInstance.put(`/statuses/${record.status_id}`, {
              ...record,
              is_active: checked ? 1 : 0
          });
          message.success(`เปลี่ยนสถานะ "${record.status_name}" เรียบร้อย`);
          fetchStatuses();
      } catch (e) { message.error('เปลี่ยนสถานะล้มเหลว'); }
  };

  const columns = [
    { 
      title: 'ลำดับ (Order)', 
      dataIndex: 'sort_order', 
      key: 'sort_order', 
      align: 'center', 
      width: 120,
      render: (val) => <Text strong style={{ color: '#64748b' }}>{val}</Text>
    },
    { 
      title: 'ชื่อสถานะ (ป้ายแท็ก)', 
      dataIndex: 'status_name', 
      key: 'status_name',
      width: 300,
      render: (text, record) => (
        <Tag color={record.status_color} style={{ fontSize: '15px', padding: '4px 16px', borderRadius: '12px', fontWeight: 'bold', border: 'none' }}>
          {text}
        </Tag>
      )
    },
    { 
      title: 'รหัสสี (Color)', 
      dataIndex: 'status_color', 
      key: 'status_color', 
      align: 'center',
      width: 180,
      render: (color) => (
        <Space>
            <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: color, border: '1px solid #e2e8f0' }} />
            <Text code style={{ fontSize: '13px' }}>{color.toUpperCase()}</Text>
        </Space>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center',
      width: 120,
      render: (active, record) => (
        <Switch 
            checked={active === 1} 
            onChange={(checked) => toggleStatus(record, checked)}
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<StopOutlined />}
        />
      )
    },
    {
      title: 'จัดการ',
      key: 'action',
      align: 'center',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" size="large" icon={<EditOutlined style={{ color: '#3b82f6' }} />} onClick={() => showModal(record)} />
          <Popconfirm title="ยืนยันการลบ?" onConfirm={() => handleDelete(record.status_id)} okText="ลบ" cancelText="ยกเลิก">
            <Button type="text" size="large" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <style>{`
        .status-mgmt-card { background: #ffffff !important; border-radius: 20px !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05) !important; }
        .ant-table-thead > tr > th { 
          background: #e2e8f0 !important; 
          color: #334155 !important; 
          font-size: 16px !important; 
          font-weight: 800 !important; 
          padding: 18px 16px !important;
        }
        .ant-table-tbody > tr > td { 
          font-size: 15px !important; 
          padding: 16px 16px !important;
          background: #ffffff !important;
        }
        .management-header { background: #fff; padding: 24px 32px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .ant-btn-primary { background: #0f172a !important; border: none !important; border-radius: 8px !important; height: 42px !important; }
      `}</style>

      <div className="management-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
                <div style={{ background: '#0f172a', padding: '14px', borderRadius: '14px' }}><TagsOutlined style={{ color: 'white', fontSize: '28px' }} /></div>
                <div>
                    <Title level={2} style={{ margin: 0, color: '#0f172a' }}>Status Management</Title>
                    <Text type="secondary" style={{ fontSize: 15 }}>บริหารจัดการป้ายสถานะและลำดับขั้นตอนการทำงาน (SLA Ready)</Text>
                </div>
            </Space>
          </Col>
          <Col><Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => showModal()}>เพิ่มสถานะใหม่</Button></Col>
        </Row>
      </div>

      <Card className="status-mgmt-card" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={statuses} 
          rowKey="status_id" 
          loading={loading} 
          pagination={false}
          scroll={{ x: 900 }}
          size="large"
        />
      </Card>

      <Modal 
        title={<Space size="middle"><FormatPainterOutlined style={{ color: '#3b82f6' }} /> <Text strong style={{ fontSize: 20 }}>{editingStatus ? "แก้ไขป้ายสถานะ" : "เพิ่มป้ายสถานะใหม่"}</Text></Space>}
        open={isModalVisible} 
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={560}
        okText="บันทึกข้อมูล"
        cancelText="ยกเลิก"
        styles={{ body: { paddingTop: 24 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item name="status_name" label={<Text strong>ชื่อสถานะ (Label Name)</Text>} rules={[{ required: true, message: 'กรุณาระบุชื่อสถานะ' }]}>
            <Input placeholder="เช่น ตรวจสอบงานเรียบร้อย" style={{ borderRadius: 8 }} />
          </Form.Item>
          
          <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="status_color" label={<Text strong>สีและระดับความโปร่งใส</Text>} rules={[{ required: true }]}>
                    <ColorPicker 
                        showText 
                        allowClear={false} 
                        presets={[{ label: 'Recommended', colors: ['#f5222d', '#fa8c16', '#52c41a', '#1677ff', '#722ed1', '#8c8c8c'] }]}
                    />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="sort_order" label={<Text strong>ลำดับขั้นตอน (Order)</Text>} rules={[{ required: true }]}>
                    <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} prefix={<SortAscendingOutlined />} />
                </Form.Item>
              </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />

          <Form.Item name="is_active" label={<Text strong>สถานะ</Text>} valuePropName="checked">
            <Switch checkedChildren="เปิดใช้งาน" unCheckedChildren="ปิดใช้งาน" />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: -10 }}>อนุญาตให้ใช้สถานะนี้ในการบันทึกใบงาน</Text>
        </Form>
      </Modal>
    </div>
  );
}
