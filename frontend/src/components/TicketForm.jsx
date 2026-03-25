import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Typography, Result, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

// ✅ นำเข้า SweetAlert2 Helper ที่เราสร้างไว้
import { alertSuccess, alertError } from '../utils/alert';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ✅ รับ props 'project' ที่ส่งมาจาก App.jsx
export default function TicketForm({ project }) {
  const [categories, setCategories] = useState([]);
  const [form] = Form.useForm();
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  
  // ✅ เพิ่มสถานะ Loading ป้องกันผู้ใช้กดส่งซ้ำรัวๆ
  const [loading, setLoading] = useState(false);
  
  const [fileList, setFileList] = useState([]);

  // ✅ ดึงข้อมูลพนักงานที่กำลังล็อกอินอยู่ เพื่อเอา user_id ไปใช้
  const currentUser = JSON.parse(localStorage.getItem('lims_user'));

  useEffect(() => {
    // โหลดข้อมูลหมวดหมู่
    axios.get('http://localhost:3000/api/categories')
      .then(res => {
        // 🔮 อนาคต: กรองให้แสดงเฉพาะหมวดหมู่ของโปรเจกต์ที่เลือกอยู่ 
        // (ถ้ายังไม่มีการแยก project_id ในหมวดหมู่ ให้แสดงทั้งหมดไปก่อน)
        if (project && project.project_id) {
           const filtered = res.data.filter(cat => cat.project_id === project.project_id || !cat.project_id);
           setCategories(filtered.length > 0 ? filtered : res.data);
        } else {
           setCategories(res.data);
        }
      })
      .catch(err => alertError('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลระบบงาน/อุปกรณ์ได้'));
  }, [project]);

  const handleUploadChange = ({ fileList: newFileList, file }) => {
    setFileList(newFileList.slice(-1)); 
    // ✅ เพิ่มการแจ้งเตือนเมื่อเลือกไฟล์
    if (file.status !== 'removed' && file.name) {
      message.success(`แนบไฟล์ ${file.name} สำเร็จ! (ข้อมูลจะถูกส่งเมื่อกดปุ่มส่งใบงาน)`);
    }
  };

  const onFinish = async (values) => {
    setLoading(true); // เปิดโหมดโหลด
    try {
      const formData = new FormData();
      
      // ✅ ใช้ ID ของผู้ใช้งานจริง แทนการจำลอง
      formData.append('reporter_id', currentUser?.user_id); 
      formData.append('category_id', values.category_id);
      formData.append('equipment_no', values.equipment_no || '');
      formData.append('problem_detail', values.problem_detail);

      if (fileList.length > 0) {
        formData.append('attachment', fileList[0].originFileObj);
      }

      const res = await axios.post('http://localhost:3000/api/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setTicketNumber(res.data.ticket_number);
      
      // ✅ ใช้ SweetAlert2 แจ้งเตือนความสำเร็จ (รอให้กดปิดก่อนค่อยสลับหน้า)
      await alertSuccess('ส่งใบแจ้งซ่อมสำเร็จ!', `หมายเลขใบงานของคุณคือ: ${res.data.ticket_number}`);
      
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      // ✅ ใช้ SweetAlert2 แจ้งเตือนข้อผิดพลาด
      alertError('เกิดข้อผิดพลาด!', 'ระบบไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false); // ปิดโหมดโหลด
    }
  };

  const handleReset = () => {
    form.resetFields();
    setFileList([]);
    setIsSuccess(false);
  };

  // หน้าจอแสดงความสำเร็จ (ใช้ของ antd เหมือนเดิมสวยแล้วครับ)
  if (isSuccess) {
    return (
      <div className="old-style-card" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <Result
          status="success"
          title="สร้างใบงานสำเร็จ!"
          subTitle={`ระบบได้รับข้อมูลแล้ว หมายเลขใบแจ้งซ่อมของคุณคือ: ${ticketNumber}`}
          extra={[
            <Button type="primary" key="console" onClick={handleReset} style={{ backgroundColor: '#2a1a4a', borderColor: '#2a1a4a' }}>
              สร้างใบงานใหม่
            </Button>
          ]}
        />
      </div>
    );
  }

  return (
    <div className="old-style-card" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4} style={{ borderBottom: '2px solid #ef8157', paddingBottom: 10, marginBottom: 20 }}>
        📝 สร้างใบงาน (แจ้งปัญหาการใช้งาน)
      </Title>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="category_id" label={<b>หมวดหมู่ของระบบ / อุปกรณ์ *</b>} rules={[{ required: true, message: 'กรุณาเลือกระบบที่พบปัญหา!' }]}>
          <Select placeholder="-- กรุณาเลือกระบบที่พบปัญหา --" size="large" showSearch optionFilterProp="children">
            {categories.map(cat => (
              <Option key={cat.category_id} value={cat.category_id}>
                [{cat.category_type}] {cat.category_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="equipment_no" label={<b>เลขครุภัณฑ์ / เลขเครื่อง (ถ้ามี)</b>}>
          <Input placeholder="เช่น L17426 หรือ IP Address" size="large" />
        </Form.Item>

        <Form.Item name="problem_detail" label={<b>รายละเอียดปัญหา *</b>} rules={[{ required: true, message: 'กรุณาระบุรายละเอียดปัญหา!' }]}>
          <TextArea rows={5} placeholder="อธิบายอาการที่พบอย่างละเอียด..." size="large" />
        </Form.Item>

        <Form.Item label={<b>แนบไฟล์รูปภาพ / เอกสารประกอบ (ถ้ามี)</b>}>
           <Upload 
             beforeUpload={() => false}
             fileList={fileList}
             onChange={handleUploadChange}
             accept="image/*,.pdf"
           >
             <Button icon={<UploadOutlined />}>คลิกเพื่อเลือกไฟล์รูปภาพ</Button>
           </Upload>
        </Form.Item>

        <Form.Item style={{ textAlign: 'center', marginTop: 30 }}>
          {/* ✅ ผูก loading เข้ากับปุ่ม */}
          <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ backgroundColor: '#ef8157', borderColor: '#ef8157', width: 200, fontWeight: 'bold' }}>
            {loading ? 'กำลังส่งข้อมูล...' : 'ส่งใบแจ้งซ่อม'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}