import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Typography, Popconfirm, theme } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined } from '@ant-design/icons';
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError } from '../utils/alert';

const { Title } = Typography;
const { useToken } = theme;

export default function VendorManagement() {
  const { token } = useToken();
  const [vendors, setVendors] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [form] = Form.useForm();

  const fetchVendors = async () => {
    try {
      const res = await axiosInstance.get('/vendors');
      setVendors(res.data);
    } catch (err) {
      console.error('โหลดข้อมูลผู้รับจ้างไม่สำเร็จ', err);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const openModal = (vendor = null) => {
    setEditingVendor(vendor);
    setIsModalVisible(true);
    
    // ✅ Fix: Use setTimeout to ensure form is connected before setting values
    setTimeout(() => {
      if (vendor) {
        form.setFieldsValue(vendor);
      } else {
        form.resetFields();
      }
    }, 100);
  };

  const handleFinish = async (values) => {
    try {
      if (editingVendor) {
        await axiosInstance.put(`/vendors/${editingVendor.vendor_id}`, values);
        alertSuccess('อัปเดตข้อมูลสำเร็จ');
      } else {
        await axiosInstance.post('/vendors', values);
        alertSuccess('เพิ่มผู้รับจ้างสำเร็จ');
      }
      setIsModalVisible(false);
      fetchVendors();
    } catch (error) {
      alertError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/vendors/${id}`);
      alertSuccess('ลบข้อมูลสำเร็จ');
      fetchVendors();
    } catch (error) {
      alertError('ไม่สามารถลบได้ (อาจมีข้อมูลสัญญาผูกอยู่)');
    }
  };

  const columns = [
    { title: 'รหัส', dataIndex: 'vendor_id', key: 'vendor_id', width: 80 },
    { title: 'ชื่อบริษัท / ผู้รับจ้าง', dataIndex: 'vendor_name', key: 'vendor_name' },
    { title: 'ชื่อผู้ติดต่อ', dataIndex: 'contact_name', key: 'contact_name' },
    { title: 'เบอร์โทร', dataIndex: 'contact_phone', key: 'contact_phone' },
    { title: 'อีเมล', dataIndex: 'contact_email', key: 'contact_email' },
    {
      title: 'จัดการ', key: 'action', width: 150, align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal(record)} style={{ color: token.colorPrimary }} />
          <Popconfirm title="ยืนยันการลบ?" onConfirm={() => handleDelete(record.vendor_id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ backgroundColor: token.colorBgContainer, padding: 24, borderRadius: 8, margin: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={4}><ShopOutlined /> ฐานข้อมูลผู้รับจ้าง (Vendors)</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} style={{ borderRadius: 8 }}>เพิ่มผู้รับจ้าง</Button>
      </div>
      
      <Table columns={columns} dataSource={vendors} rowKey="vendor_id" />

      <Modal 
        title={editingVendor ? "แก้ไขข้อมูลผู้รับจ้าง" : "เพิ่มผู้รับจ้างใหม่"} 
        open={isModalVisible} 
        onCancel={() => setIsModalVisible(false)} 
        footer={null} 
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="vendor_name" label="ชื่อบริษัท / ผู้รับจ้าง" rules={[{ required: true, message: 'กรุณากรอกชื่อบริษัท' }]}>
            <Input placeholder="เช่น บริษัท โอเพ่น เทคโนโลยี่ จำกัด" />
          </Form.Item>
          <Form.Item name="contact_name" label="ชื่อผู้ติดต่อประสานงาน">
            <Input placeholder="ชื่อ-นามสกุล" />
          </Form.Item>
          <Form.Item name="contact_phone" label="เบอร์โทรศัพท์">
            <Input placeholder="08X-XXX-XXXX" />
          </Form.Item>
          <Form.Item name="contact_email" label="อีเมล">
            <Input type="email" placeholder="example@domain.com" />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 15 }}>
            <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 10, borderRadius: 8 }}>ยกเลิก</Button>
            <Button type="primary" htmlType="submit" style={{ borderRadius: 8 }}>บันทึก</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
