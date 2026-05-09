import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Typography, Result, Upload, message, Card, Row, Col, Alert, Space, Tag, Divider, Radio, Grid } from 'antd';
import { UploadOutlined, ClockCircleOutlined, ToolOutlined, InfoCircleOutlined, DesktopOutlined, AppstoreOutlined, ThunderboltOutlined, GlobalOutlined, CheckSquareOutlined } from '@ant-design/icons';
import axiosInstance from '../services/api/axiosInstance';

// ✅ 1. นำเข้า React Quill เวอร์ชันใหม่ (react-quill-new)
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 

// ✅ 2. นำเข้า DOMPurify สำหรับทำความสะอาด HTML
import DOMPurify from 'dompurify';

import { alertSuccess, alertError } from '../utils/alert';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

export default function TicketForm({ project }) {
  const { user: currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [equipments, setEquipments] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState(null); 
  
  const [form] = Form.useForm();
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const [ticketType, setTicketType] = useState('general'); 
  const [subType, setSubType] = useState(null); 
  const [selectedCatType, setSelectedCatType] = useState(null); 

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, eqRes] = await Promise.all([
          axiosInstance.get('/categories'),
          axiosInstance.get('/equipments').catch(() => ({ data: [] }))
        ]);

        const sortedCats = catRes.data.sort((a, b) => Number(a.category_id) - Number(b.category_id));
        const sortedEqs = (eqRes.data || []).sort((a, b) => Number(a.equipment_id) - Number(b.equipment_id));

        if (project && project.project_id) {
           const filtered = sortedCats.filter(cat => cat.project_id === project.project_id || !cat.project_id);
           setCategories(filtered.length > 0 ? filtered : sortedCats);
        } else {
           setCategories(sortedCats);
        }
        setEquipments(sortedEqs);
      } catch (err) {
        alertError('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลระบบได้');
      }
    };
    fetchData();
  }, [project]);

  useEffect(() => {
    if (subType === 'hardware') setSelectedCatType('Hardware');
    else if (subType === 'software') setSelectedCatType('Software');
    else if (subType === 'app_cm' || subType === 'app_update') setSelectedCatType('Application');
    else setSelectedCatType(null);
  }, [subType]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const relatedEqs = equipments.filter(eq => eq.category_id === categoryId && eq.status === 'Active');

    if (relatedEqs.length === 0) {
      form.setFieldsValue({ equipment_no: 'ไม่มีข้อมูล' });
    } else if (relatedEqs.length === 1) {
      const eq = relatedEqs[0];
      let prefix = '';
      if (eq.serial_number) {
          prefix = selectedCatType === 'Application' ? 'URL: ' : 'S/N: ';
      }
      form.setFieldsValue({ equipment_no: eq.serial_number ? `${prefix}${eq.serial_number}` : eq.equipment_name });
    } else {
      form.setFieldsValue({ equipment_no: undefined });
    }
  };

  const handleUploadChange = ({ fileList: newFileList, file }) => {
    setFileList(newFileList.slice(-1)); 
    if (file.status !== 'removed' && file.name) {
      message.success(`แนบไฟล์ ${file.name} สำเร็จ!`);
    }
  };

  const onFinish = async (values) => {
    const cleanHTML = DOMPurify.sanitize(values.problem_detail);

    if (!cleanHTML || cleanHTML === '<p><br></p>' || cleanHTML.trim() === '') {
      message.error('กรุณาระบุรายละเอียดปัญหา!');
      return;
    }

    setLoading(true); 
    try {
      const formData = new FormData();
      formData.append('category_id', values.category_id);
      formData.append('equipment_no', values.equipment_no || 'ไม่มีข้อมูล');
      formData.append('problem_detail', cleanHTML); 

      let slaHours = 0;
      if (ticketType === 'cm') {
        slaHours = (selectedCatType === 'Hardware' || selectedCatType === 'Software') ? 6 : 12;
      }
      formData.append('is_cm', ticketType === 'cm' ? '1' : '0');
      formData.append('sla_hours', slaHours);

      if (fileList.length > 0) {
        formData.append('attachment', fileList[0].originFileObj);
      }

      const res = await axiosInstance.post('/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setTicketNumber(res.data.ticket_number);
      await alertSuccess('ส่งใบแจ้งซ่อมสำเร็จ!', `หมายเลขใบงานของคุณคือ: ${res.data.ticket_number}`);
      setIsSuccess(true);
    } catch (err) {
      alertError('เกิดข้อผิดพลาด!', 'ระบบไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false); 
    }
  };

  const handleReset = () => {
    form.resetFields();
    setFileList([]);
    setIsSuccess(false);
    setTicketType('general');
    setSubType(null);
    setSelectedCatType(null);
    setSelectedCategory(null);
  };

  const getFilteredCategories = () => {
    if (subType === 'app_update' || subType === 'app_cm') return categories.filter(c => c.category_type === 'Application');
    if (subType === 'service') return categories.filter(c => c.category_type === 'Service');
    if (subType === 'hardware') return categories.filter(c => c.category_type === 'Hardware');
    if (subType === 'software') return categories.filter(c => c.category_type === 'Software');
    return [];
  };

  const activeEqs = equipments.filter(eq => eq.category_id === selectedCategory && eq.status === 'Active');

  if (isSuccess) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <Card style={{ borderRadius: '16px', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-color)' }}>
          <Result
            status="success"
            title={<span style={{ color: 'var(--text-main)' }}>สร้างใบงานสำเร็จ!</span>}
            subTitle={<span style={{ color: 'var(--text-sub)' }}>ระบบได้รับข้อมูลแล้ว หมายเลขใบแจ้งซ่อมของคุณคือ: <strong style={{color: '#1890ff', fontSize: '18px'}}>{ticketNumber}</strong></span>}
            extra={[
              <Button type="primary" size="large" key="console" onClick={handleReset} style={{ borderRadius: '8px', padding: '0 30px' }}>
                สร้างใบงานใหม่
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  const renderSLADisplay = () => {
    if (ticketType !== 'cm' || !selectedCatType) return null;
    const isDark = document.body.classList.contains('dark-mode');

    if (selectedCatType === 'Hardware' || selectedCatType === 'Software') {
      return (
        <Alert
          title={<Text strong style={{ color: isDark ? '#fca5a5' : '#991b1b', fontSize: '15px' }}>⏱️ เงื่อนไข SLA: ฮาร์ดแวร์ / ซอฟต์แวร์</Text>}
          description={
            <ul style={{ margin: 0, paddingLeft: '20px', color: isDark ? '#fecaca' : '#7f1d1d', marginTop: '8px' }}>
              <li>ช่างต้องเข้าดำเนินการแก้ไข ภายใน <b>2 ชั่วโมง</b></li>
              <li>ซ่อมแซมหรือหาอุปกรณ์ทดแทนให้แล้วเสร็จ ภายใน <b>6 ชั่วโมง</b></li>
            </ul>
          }
          type="error"
          showIcon
          icon={<ThunderboltOutlined style={{ fontSize: '24px' }}/>}
          style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', borderColor: isDark ? 'rgba(239, 68, 68, 0.5)' : '#fecaca', borderRadius: '12px', marginBottom: '20px', border: isDark ? '2px solid #ef4444' : '1px solid #fecaca' }}
        />
      );
    }

    if (selectedCatType === 'Application') {
      return (
        <Alert
          title={<Text strong style={{ color: isDark ? '#fde047' : '#854d0e', fontSize: '15px' }}>⏱️ เงื่อนไข SLA: ระบบสารสนเทศ</Text>}
          description={
            <ul style={{ margin: 0, paddingLeft: '20px', color: isDark ? '#fef08a' : '#713f12', marginTop: '8px' }}>
              <li>ช่างต้องเข้าดำเนินการตรวจสอบทันทีที่ได้รับแจ้ง</li>
              <li>แก้ไขให้ระบบสามารถใช้งานได้ ภายใน <b>12 ชั่วโมง</b></li>
            </ul>
          }
          type="warning"
          showIcon
          icon={<ClockCircleOutlined className="spinning-clock" style={{ fontSize: '24px' }}/>} 
          style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fefce8', borderColor: isDark ? 'rgba(245, 158, 11, 0.5)' : '#fef08a', borderRadius: '12px', marginBottom: '20px', border: isDark ? '2px solid #f59e0b' : '1px solid #fef08a' }}
        />
      );
    }
    return null;
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div style={{ maxWidth: 1000, margin: isMobile ? '0' : '20px auto' }}>
      <style>{`
        .ticket-type-card {
          position: relative;
          border: 2px solid var(--border-color);
          border-radius: 20px;
          padding: ${isMobile ? '20px 12px' : '24px 20px'};
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: var(--bg-card, #ffffff);
          box-shadow: var(--card-shadow);
        }

        .ticket-type-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--card-shadow-hover);
          border-color: #ffffff;
        }

        .ticket-type-card.active-general {
          border-color: #3b82f6;
          border-width: 3px;
          background: var(--bg-card);
        }
        .ticket-type-card.active-cm {
          border-color: #ef4444;
          border-width: 3px;
          background: var(--bg-card);
        }

        .icon-wrapper {
          width: ${isMobile ? '50px' : '60px'};
          height: ${isMobile ? '50px' : '60px'};
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          background: var(--bg-app);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          transition: all 0.3s ease;
          font-size: ${isMobile ? '24px' : '28px'};
        }

        .type-title { font-weight: 800; color: var(--text-main); font-size: ${isMobile ? '15px' : '17px'}; margin-bottom: 4px; }
        .type-desc { font-size: 12px; color: var(--text-sub); font-weight: 500; }

        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinning-clock { animation: spin-slow 8s linear infinite; }
        
        .quill-custom .ql-container { border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; font-family: inherit; font-size: 15px; min-height: 180px; color: var(--text-main); border-color: var(--border-color) !important; border-width: 2px !important; }
        .quill-custom .ql-toolbar { border-top-left-radius: 12px; border-top-right-radius: 12px; background-color: var(--bg-app); border-color: var(--border-color) !important; border-width: 2px !important; }
        
        /* 🚀 ปรับปรุง Quill Picker สำหรับโหมดมืด */
        body.dark-mode .ql-snow .ql-picker { color: #ffffff !important; }
        body.dark-mode .ql-snow .ql-picker-options { background-color: var(--bg-card) !important; border-color: var(--border-color) !important; }
        body.dark-mode .ql-snow .ql-picker-item { color: #ffffff !important; }
        body.dark-mode .ql-stroke { stroke: #ffffff !important; }
        body.dark-mode .ql-fill { fill: #ffffff !important; }
        body.dark-mode .ql-picker-label { color: #ffffff !important; }
        
        /* 🚀 ปรับปรุง Radio Style ตามที่ระบุมา (ประยุกต์ใช้สำหรับ 2 โหมด) */
        .ant-radio-wrapper {
          --ant-radio-radio-size: 18;
          --ant-radio-dot-size: 10;
          --ant-radio-button-solid-checked-bg: #18da0e;
          --ant-radio-radio-color: #ffffff;
          --ant-radio-radio-bg-color: #18da0e;
          --ant-radio-dot-color: #ffffff;
          font-weight: 500;
        }

        /* 🌑 สไตล์สำหรับ DARK MODE */
        body.dark-mode .ant-radio-wrapper {
          color: #ffffff !important;
          --ant-color-border: #ffffff; /* บังคับขอบขาว */
          --ant-color-bg-container: transparent;
        }
        body.dark-mode .ant-radio-inner {
          border-color: #ffffff !important;
          border-width: 2px !important;
          background-color: transparent !important;
          width: 20px !important;
          height: 20px !important;
        }
        body.dark-mode .ant-radio-checked .ant-radio-inner {
          border-color: #18da0e !important;
          background-color: #18da0e !important;
        }
        body.dark-mode .ant-radio-checked .ant-radio-inner::after {
          background-color: #ffffff !important;
          transform: scale(0.5) !important;
        }

        /* ☀️ สไตล์สำหรับ LIGHT MODE */
        body:not(.dark-mode) .ant-radio-wrapper {
          color: #1e293b !important;
          --ant-color-border: #d1d5db;
          --ant-color-bg-container: #ffffff;
        }
        body:not(.dark-mode) .ant-radio-inner {
          border-color: #94a3b8 !important;
          border-width: 2px !important;
        }
        body:not(.dark-mode) .ant-radio-checked .ant-radio-inner {
          border-color: #18da0e !important;
          background-color: #18da0e !important;
        }

        /* บังคับกรอบ (Frames) เฉพาะ Dark Mode */
        body.dark-mode .ant-input, 
        body.dark-mode .ant-select-selector,
        body.dark-mode .ant-card {
          border-color: #ffffff !important;
          border-width: 2px !important;
        }
        body.dark-mode .ant-select-selection-placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
        }

        /* 🚀 บังคับ Placeholder ของ Rich Text Editor (Quill) ให้ขาวชัดเจน */
        body.dark-mode .ql-editor.ql-blank::before {
          color: rgba(255, 255, 255, 0.6) !important;
          font-style: normal !important;
        }

        /* สำหรับ Light Mode - คืนค่าเดิมเพื่อไม่ให้เพี้ยน */
        body:not(.dark-mode) .ant-radio-inner { border-color: #d9d9d9; }
        body:not(.dark-mode) .ant-radio-wrapper { color: rgba(0, 0, 0, 0.88); }
      `}</style>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card style={{ borderRadius: '24px', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-color)' }} styles={{ body: { padding: isMobile ? '20px' : '32px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(239, 129, 87, 0.1)', border: '1px solid #ef8157', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                <ToolOutlined style={{ color: '#ef8157', fontSize: '20px' }} />
              </div>
              <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                สร้างใบงานแจ้งปัญหา
              </Title>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish}>
              
              <Form.Item label={<Text strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>1. เลือกประเภทใบงานที่ต้องการแจ้ง</Text>} required>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <div 
                      className={`ticket-type-card ${ticketType === 'general' ? 'active-general' : ''}`}
                      onClick={() => { 
                        setTicketType('general'); 
                        setSubType(null); 
                        setSelectedCategory(null);
                        form.setFieldsValue({ subType: undefined, category_id: undefined, equipment_no: undefined }); 
                      }}
                    >
                      <div className="icon-wrapper">
                        <InfoCircleOutlined />
                      </div>
                      <div className="type-title">แจ้งปัญหาทั่วไป</div>
                      <div className="type-desc">ปรับปรุงระบบ / งานบริการข้อมูล</div>
                      <Tag variant="filled" style={{ marginTop: 12, borderRadius: 6, background: ticketType === 'general' ? '#dbeafe' : 'var(--bg-app)', color: ticketType === 'general' ? '#1e40af' : 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                        ไม่มี SLA
                      </Tag>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div 
                      className={`ticket-type-card ${ticketType === 'cm' ? 'active-cm' : ''}`}
                      onClick={() => { 
                        setTicketType('cm'); 
                        setSubType(null); 
                        setSelectedCategory(null);
                        form.setFieldsValue({ subType: undefined, category_id: undefined, equipment_no: undefined }); 
                      }}
                    >
                      <div className="icon-wrapper">
                        <ClockCircleOutlined className={ticketType === 'cm' ? 'spinning-clock' : ''} />
                      </div>
                      <div className="type-title">แจ้งซ่อมเร่งด่วน (CM)</div>
                      <div className="type-desc">Hardware / Software / App</div>
                      <Tag variant="filled" color="error" style={{ marginTop: 12, borderRadius: 6, opacity: 1, border: '1px solid #ef4444' }}>
                        นับเวลา SLA
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </Form.Item>

              <Divider dashed style={{ borderColor: 'var(--border-color)' }} />

              <Form.Item name="subType" label={<Text strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>2. ลักษณะปัญหา/กลุ่มงาน <span style={{color:'red'}}>*</span></Text>} rules={[{ required: true, message: 'กรุณาเลือกลักษณะปัญหา!' }]}>
                <Radio.Group 
                  onChange={(e) => { 
                    setSubType(e.target.value); 
                    setSelectedCategory(null);
                    form.setFieldsValue({ category_id: undefined, equipment_no: undefined }); 
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}
                >
                  {ticketType === 'general' ? (
                    <>
                      <Radio value="app_update" style={{ fontSize: '14.5px' }}>ปรับปรุงระบบสารสนเทศ (Application)</Radio>
                      <Radio value="service" style={{ fontSize: '14.5px' }}>งานบริการ (ด้านข้อมูล / Report / Database)</Radio>
                    </>
                  ) : (
                    <>
                      <Radio value="hardware" style={{ fontSize: '14.5px' }}>คอมพิวเตอร์แม่ข่ายและอุปกรณ์ (Hardware)</Radio>
                      <Radio value="software" style={{ fontSize: '14.5px' }}>ซอฟต์แวร์สำหรับระบบคอมพิวเตอร์แม่ข่าย (Software)</Radio>
                      <Radio value="app_cm" style={{ fontSize: '14.5px' }}>ระบบสารสนเทศ (Application)</Radio>
                    </>
                  )}
                </Radio.Group>
              </Form.Item>

              {subType && (
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                  
                  <Form.Item name="category_id" label={<Text strong style={{ color: 'var(--text-main)' }}>หมวดหมู่ระบบ / โครงการ <span style={{color:'red'}}>*</span></Text>} rules={[{ required: true, message: 'กรุณาเลือกระบบ!' }]}>
                    <Select placeholder="-- กรุณาเลือก --" size="large" showSearch optionFilterProp="children" onChange={handleCategoryChange} style={{ borderRadius: '8px' }}>
                      {getFilteredCategories().map((cat, idx) => (
                        <Option key={cat.category_id || idx} value={cat.category_id}>
                          {cat.category_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {renderSLADisplay()}

                  {selectedCategory && activeEqs.length > 0 && (
                    <Form.Item 
                      name="equipment_no" 
                      label={
                        <Text strong style={{ color: 'var(--text-main)' }}>
                          {selectedCatType === 'Application' ? (
                             <><GlobalOutlined /> URL ของระบบ (ถ้ามี) <span style={{color:'red'}}>*</span></>
                          ) : (
                             <><DesktopOutlined /> เลขครุภัณฑ์ / เลขเครื่อง (ถ้ามี) <span style={{color:'red'}}>*</span></>
                          )}
                        </Text>
                      }
                      rules={[{ required: true, message: 'กรุณาระบุข้อมูล' }]}
                    >
                      {activeEqs.length === 1 ? (
                        <Input size="large" readOnly style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: 8 }} />
                      ) : (
                        <Select size="large" placeholder="-- กรุณาเลือก --" style={{ borderRadius: 8 }}>
                          {activeEqs.map(eq => {
                            let optionPrefix = '';
                            if (eq.serial_number) {
                                optionPrefix = selectedCatType === 'Application' ? 'URL: ' : 'S/N: ';
                            }
                            return (
                                <Option key={eq.equipment_id} value={eq.serial_number ? `${optionPrefix}${eq.serial_number}` : eq.equipment_name}>
                                {eq.equipment_name} {eq.serial_number ? `(${optionPrefix}${eq.serial_number})` : ''}
                                </Option>
                            );
                          })}
                        </Select>
                      )}
                    </Form.Item>
                  )}

                  <Form.Item name="equipment_no" hidden>
                    <Input />
                  </Form.Item>

                </div>
              )}

              <Divider dashed style={{ borderColor: 'var(--border-color)' }} />

              <Form.Item 
                name="problem_detail" 
                label={<Text strong style={{ color: 'var(--text-main)' }}>3. รายละเอียดปัญหา <span style={{color:'red'}}>*</span></Text>} 
                rules={[{ required: true, message: 'กรุณาระบุรายละเอียดปัญหา!' }]}
                valuePropName="value"
                getValueFromEvent={(content) => content}
              >
                <ReactQuill 
                  theme="snow" 
                  modules={modules}
                  placeholder="อธิบายอาการที่พบอย่างละเอียด หรือขั้นตอนการเกิดปัญหา..."
                  className="quill-custom"
                />
              </Form.Item>

              <Divider dashed style={{ borderColor: 'var(--border-color)' }} />

              <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>4. แนบไฟล์รูปภาพ / เอกสาร (ถ้ามี)</Text>}>
                 <Upload 
                   beforeUpload={() => false}
                   fileList={fileList}
                   onChange={handleUploadChange}
                   accept="image/*,.pdf"
                 >
                   <Button icon={<UploadOutlined />} style={{ borderRadius: '8px', color: 'var(--text-main)', background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>คลิกเพื่อเลือกไฟล์รูปภาพ</Button>
                 </Upload>
              </Form.Item>

              <Divider dashed style={{ borderColor: 'var(--border-color)' }} />

              <Form.Item style={{ textAlign: 'right', marginTop: 30, marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ backgroundColor: '#ef8157', borderColor: '#ef8157', width: '100%', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', height: '45px' }}>
                  {loading ? 'กำลังส่งข้อมูล...' : 'ส่งใบแจ้งซ่อม'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <Card style={{ borderRadius: '24px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', textAlign: 'left' }}>
              <Title level={5} style={{ color: 'var(--text-main)', marginTop: 0 }}><InfoCircleOutlined /> คำแนะนำการแจ้งซ่อม</Title>
              <Text style={{ color: 'var(--text-sub)', fontSize: '13.5px', display: 'block', lineHeight: '1.6' }}>
                หากปัญหาส่งผลกระทบต่อระบบงานหลัก ทำให้ผู้ใช้ไม่สามารถทำงานได้ หรือระบบล่ม (System Down) 
                แนะนำให้เลือกประเภทใบงานเป็น <Tag variant="filled" color="error" style={{ borderRadius: '6px' }}>แจ้งซ่อมเร่งด่วน (CM)</Tag> 
                เพื่อให้ทีมวิศวกรเข้าแก้ไขตามระยะเวลาที่กำหนด (SLA)
              </Text>
            </Card>

            <Card style={{ borderRadius: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', textAlign: 'left' }}>
               <Title level={5} style={{ color: 'var(--text-main)', marginTop: 0 }}>การแบ่งหมวดหมู่ (Category)</Title>
               <ul style={{ padding: 0, color: 'var(--text-sub)', fontSize: '13.5px', margin: 0, lineHeight: '2.2', listStyle: 'none' }}>
                 <li><DesktopOutlined style={{ color: '#ef8157', marginRight: '8px' }} /> <b>ฮาร์ดแวร์ (Hardware):</b> เครื่องเซิร์ฟเวอร์, Storage</li>
                 <li><AppstoreOutlined style={{ color: '#ef8157', marginRight: '8px' }} /> <b>ซอฟต์แวร์ (Software):</b> OS, Database, ระบบพื้นฐาน</li>
                 <li><GlobalOutlined style={{ color: '#ef8157', marginRight: '8px' }} /> <b>แอปพลิเคชัน (Application):</b> Web Portal, แดชบอร์ด</li>
               </ul>
            </Card>
          </Space>
        </Col>

      </Row>
    </div>
  );
}
