import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Typography, Tag, Button, Spin, Result, Form, Select, Input, Row, Col, Divider, Space, Steps, Upload, Timeline, Card, message, Avatar } from 'antd'; 
import { ArrowLeftOutlined, SaveOutlined, PrinterOutlined, FileImageOutlined, UserOutlined, UserSwitchOutlined, RollbackOutlined, CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined, UploadOutlined, DesktopOutlined, MessageOutlined } from '@ant-design/icons';
import axios from 'axios';
import { alertSuccess, alertError, alertConfirm } from '../utils/alert';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [logs, setLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  
  const [fileList, setFileList] = useState([]);
  const [assignForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectFileList, setRejectFileList] = useState([]);
  const [rejectForm] = Form.useForm();

  const [elapsedTime, setElapsedTime] = useState('กำลังคำนวณ...');

  const currentUser = JSON.parse(localStorage.getItem('lims_user'));

  const fetchData = async () => {
    try {
      const [ticketRes, logsRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/tickets/${id}`),
        axios.get(`http://localhost:3000/api/tickets/${id}/logs`).catch(() => ({ data: [] }))
      ]);
      setTicket(ticketRes.data);
      setLogs(logsRes.data);
      updateForm.setFieldsValue({ root_cause_and_solution: ticketRes.data.root_cause_and_solution || '' });
      assignForm.setFieldsValue({ assigned_to: ticketRes.data.assigned_to });
      
      if (currentUser?.role !== 'user' && currentUser?.project_id) {
        fetchTechnicians(currentUser.project_id);
      }
    } catch (err) {
      alertError('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลรายละเอียดใบงานได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async (projectId) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/technicians?project_id=${projectId}`);
      setTechnicians(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [id]);

  // ⏱️ ระบบนับเวลาแบบ Real-time (วินาทีเดินแบบสดๆ)
  useEffect(() => {
    if (!ticket) return;

    const calculateTime = () => {
      const startTime = new Date(ticket.created_at).getTime();
      let endTime = new Date().getTime(); 

      if (ticket.status === 'Closed') {
        const closeLog = logs.find(l => l.action === 'ปิดเคสสมบูรณ์');
        if (closeLog) endTime = new Date(closeLog.created_at).getTime();
        else endTime = new Date(ticket.updated_at || new Date()).getTime();
      }

      const diff = endTime - startTime;
      if (diff < 0) return;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(`${hours} ชม. ${minutes} นาที ${seconds} วินาที`);
    };

    calculateTime(); 
    
    if (ticket.status !== 'Closed') {
      const timer = setInterval(calculateTime, 1000);
      return () => clearInterval(timer);
    }
  }, [ticket, logs]);

  const handleUploadChange = ({ fileList: newFileList, file }) => {
    setFileList(newFileList);
    if (file.status !== 'removed' && file.name) message.success(`เลือกไฟล์ ${file.name} สำเร็จ!`);
  };

  const handleRejectUploadChange = ({ fileList: newFileList, file }) => {
    setRejectFileList(newFileList);
    if (file.status !== 'removed' && file.name) message.success(`เลือกไฟล์ ${file.name} สำหรับตีกลับแล้ว!`);
  };

  const addLog = async (actionName, detailMsg) => {
    const actor_name = `${currentUser?.first_name} ${currentUser?.last_name}`;
    try {
      await axios.post(`http://localhost:3000/api/tickets/${id}/logs`, { action: actionName, actor_name, detail: detailMsg });
    } catch (err) { console.error('Failed to save log'); }
  };

  const renderLogDetailWithFiles = (detailText) => {
    if (!detailText) return null;
    const fileRegex = /\[แนบไฟล์(?:เพิ่มเติม)?:\s*(.*?)\]/;
    const match = detailText.match(fileRegex);
    if (!match) return <Text style={{ display: 'block', whiteSpace: 'pre-wrap', color: '#555' }}>{detailText}</Text>;

    const textWithoutFiles = detailText.replace(fileRegex, '').trim();
    const files = match[1].split(',').map(f => f.trim());

    return (
      <div>
        <Text style={{ display: 'block', whiteSpace: 'pre-wrap', color: '#555', marginBottom: 10 }}>{textWithoutFiles}</Text>
        <Space wrap>
          {files.map((file, idx) => (
            <Button key={idx} size="small" type="dashed" icon={<FileImageOutlined style={{ color: '#1890ff' }} />} onClick={() => window.open(`http://localhost:3000/uploads/${file}`)}>
              {file}
            </Button>
          ))}
        </Space>
      </div>
    );
  };

  const handleAssign = async (values) => {
    try {
      await axios.put(`http://localhost:3000/api/tickets/${id}/assign`, { assigned_to: values.assigned_to });
      const techName = technicians.find(t => t.user_id === values.assigned_to)?.full_name || 'ช่าง';
      await addLog('มอบหมายงาน', `จ่ายงานให้: ${techName}`);
      await alertSuccess('สำเร็จ!', 'มอบหมายงานเรียบร้อยแล้ว');
      fetchData(); 
    } catch (error) { alertError('เกิดข้อผิดพลาด!'); }
  };

  const handleSelfAssign = async () => {
    try {
      await axios.put(`http://localhost:3000/api/tickets/${id}/assign`, { assigned_to: currentUser.user_id });
      await addLog('รับงาน', 'ช่างกดรับผิดชอบงานนี้เข้าตัวเอง');
      await alertSuccess('รับงานสำเร็จ!', 'ระบบเริ่มจับเวลาการแก้ไขของคุณแล้ว');
      fetchData(); 
    } catch (error) { alertError('เกิดข้อผิดพลาด!'); }
  };

  const handleReturnTicket = async () => {
    const result = await alertConfirm('ยืนยันการตีกลับงาน?', 'คุณต้องการคืนงานนี้ให้หัวหน้าใช่หรือไม่?');
    if (result.isConfirmed) {
      try {
        await axios.put(`http://localhost:3000/api/tickets/${id}/return`);
        await addLog('ตีกลับงาน (ช่าง)', 'ช่างยกเลิกการรับงานและส่งคืนหัวหน้า');
        await alertSuccess('ตีกลับสำเร็จ!', 'ส่งงานคืนให้หัวหน้าช่างเรียบร้อยแล้ว');
        fetchData();
      } catch (error) { alertError('เกิดข้อผิดพลาด!'); }
    }
  };

  const handleSubmitFix = async (values) => {
    try {
      const formData = new FormData();
      formData.append('status', 'Resolved');
      formData.append('root_cause_and_solution', values.root_cause_and_solution);
      formData.append('technician_id', currentUser?.user_id);
      fileList.forEach(file => formData.append('attachments', file.originFileObj));

      const res = await axios.put(`http://localhost:3000/api/tickets/${id}/update-status`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const savedFiles = res.data.files || [];
      const attachMsg = savedFiles.length > 0 ? `\n[แนบไฟล์: ${savedFiles.join(',')}]` : '';
      
      await addLog('ส่งตรวจสอบ', `วิธีแก้ไข: ${values.root_cause_and_solution}${attachMsg}`);
      await alertSuccess('ส่งตรวจสอบสำเร็จ!', 'รอผู้แจ้งยืนยันการปิดงาน');
      setFileList([]); fetchData(); 
    } catch (error) { alertError('เกิดข้อผิดพลาด!'); }
  };

  const handleApproveTicket = async () => {
    try {
      await axios.put(`http://localhost:3000/api/tickets/${id}/update-status`, { status: 'Closed', technician_id: ticket.technician_id });
      await addLog('ปิดเคสสมบูรณ์', 'ผู้แจ้งตรวจสอบและยืนยันการปิดงาน');
      await alertSuccess('ปิดงานสำเร็จ!');
      fetchData();
    } catch (error) { alertError('เกิดข้อผิดพลาด!'); }
  };

  const handleRejectSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('status', 'In Progress');
      formData.append('technician_id', ticket.technician_id);
      rejectFileList.forEach(file => formData.append('attachments', file.originFileObj));

      const res = await axios.put(`http://localhost:3000/api/tickets/${id}/update-status`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const savedFiles = res.data.files || [];
      const attachMsg = savedFiles.length > 0 ? `\n[แนบไฟล์เพิ่มเติม: ${savedFiles.join(',')}]` : '';
      
      await addLog('ตีกลับให้แก้ไขใหม่', `เหตุผลที่ตีกลับ: ${values.reject_reason}${attachMsg}`);
      await alertSuccess('ส่งกลับให้ช่างแก้ไขใหม่แล้ว (สถานะ: แก้ไข)');
      setIsRejecting(false); rejectForm.resetFields(); setRejectFileList([]); fetchData();
    } catch (error) { alertError('เกิดข้อผิดพลาด!'); }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;
  if (!ticket) return <Result status="404" title="ไม่พบข้อมูล" />;

  const getStepCurrent = () => {
    if (ticket.status === 'Pending') return 1;       
    if (ticket.status === 'In Progress') return 2;   
    if (ticket.status === 'Resolved') return 3;      
    if (ticket.status === 'Closed') return 4;        
    return 0;
  };

  const stepItems = [
    { title: 'แจ้งเคส', description: 'ส่งเข้าระบบ' },
    { title: 'รับงาน/มอบหมาย', description: 'รอช่างเข้ารับงาน' },
    { title: ticket.resolved_at && ticket.status === 'In Progress' ? 'แก้ไขใหม่ ↩️' : 'กำลังดำเนินการ', description: 'ช่างสามารถตีกลับ ↩️' },
    { title: 'ตรวจสอบ', description: 'ส่งแก้ ↩️ / ปิดงาน ⏭️' },
    { title: 'ปิดเคส', description: 'งานเสร็จสมบูรณ์' }
  ];

  const modernCardStyle = { borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: 'none', marginBottom: 20 };

  return (
    <div style={{ width: '100%', padding: '10px 20px', margin: '0 auto', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ borderRadius: 8 }}>ย้อนกลับ</Button>
        <Link to={`/print/${ticket.ticket_id}`} target="_blank">
          <Button type="primary" icon={<PrinterOutlined />} style={{ backgroundColor: '#28a745', borderColor: '#28a745', borderRadius: 8 }}>พิมพ์ใบงาน</Button>
        </Link>
      </div>

      <Card style={modernCardStyle} bodyStyle={{ padding: '24px 40px' }}>
        <Steps current={getStepCurrent()} size="small" items={stepItems} status={ticket.status === 'In Progress' && ticket.resolved_at ? 'error' : 'process'} />
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          
          <Card style={modernCardStyle} bodyStyle={{ padding: '30px' }}>
            
            {/* ✅ สลับ Layout ตามรูปวาด: เลขใบงานอยู่ซ้าย / สถานะอยู่ขวาสุด */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Title level={3} style={{ margin: 0, color: '#2a1a4a' }}>ใบงาน {ticket.ticket_number}</Title>
              <Tag color={ticket.status === 'Closed' ? 'default' : ticket.status === 'Resolved' ? 'green' : ticket.status === 'In Progress' ? 'cyan' : 'orange'} style={{ fontSize: 15, padding: '6px 20px', borderRadius: 20, margin: 0 }}>
                {ticket.status}
              </Tag>
            </div>

            {/* ✅ สลับ Layout ตามรูปวาด: ข้อมูลผู้แจ้งอยู่ในบรรทัดเดียวกัน */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
              <Avatar size={50} icon={<UserOutlined />} style={{ backgroundColor: '#ef8157', marginRight: 15 }} />
              <div>
                <Text strong style={{ fontSize: 16 }}>{ticket.reporter_name}</Text>
                <Text type="secondary" style={{ marginLeft: 10, fontSize: 14 }}>
                  ผู้แจ้ง • {ticket.reporter_department || 'ไม่ระบุหน่วยงาน'} • {new Date(ticket.created_at).toLocaleString('th-TH')}
                </Text>
              </div>
            </div>

            <Space size="large" style={{ marginBottom: 15, display: 'flex', flexWrap: 'wrap' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>หมวดหมู่ระบบ</Text>
                <Tag color="blue" icon={<DesktopOutlined />} style={{ padding: '4px 10px', fontSize: 14, borderRadius: 6 }}>{ticket.category_name}</Tag>
              </div>
              <div>
                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>เลขครุภัณฑ์ / อุปกรณ์</Text>
                <Text strong>{ticket.equipment_no || '-'}</Text>
              </div>
            </Space>

            <div>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>รายละเอียดปัญหาเบื้องต้น</Text>
              <div style={{ backgroundColor: '#f8f9fa', padding: 16, borderRadius: 8, fontSize: 15, color: '#333', whiteSpace: 'pre-wrap', border: '1px solid #f0f0f0' }}>
                {ticket.problem_detail}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 5 }}><FileImageOutlined /> ไฟล์แนบ (ตอนเปิดใบงาน)</Text>
              {ticket.attachment ? (
                <Button type="dashed" style={{ borderRadius: 6 }} onClick={() => window.open(`http://localhost:3000/uploads/${ticket.attachment}`)}>
                  {ticket.attachment}
                </Button>
              ) : <Text type="secondary">ไม่มีไฟล์แนบ</Text>}
            </div>
          </Card>

          {logs.filter(log => ['ส่งตรวจสอบ', 'ตีกลับให้แก้ไขใหม่'].includes(log.action)).length > 0 && (
            <Card title={<><MessageOutlined /> ประวัติการคุยและการแก้ไข</>} style={modernCardStyle} headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
              {logs.filter(log => ['ส่งตรวจสอบ', 'ตีกลับให้แก้ไขใหม่'].includes(log.action)).map(log => {
                const isTech = log.action === 'ส่งตรวจสอบ';
                const avatarColor = isTech ? '#1890ff' : '#ef8157'; 
                
                return (
                  <div key={log.log_id} style={{ display: 'flex', marginBottom: 20, flexDirection: isTech ? 'row-reverse' : 'row' }}>
                     <Avatar size={45} icon={<UserOutlined />} style={{ backgroundColor: avatarColor, margin: isTech ? '0 0 0 15px' : '0 15px 0 0' }} />

                     <div style={{ backgroundColor: isTech ? '#e6f7ff' : '#fff1f0', border: `1px solid ${isTech ? '#91d5ff' : '#ffa39e'}`, padding: '12px 16px', borderRadius: 12, maxWidth: '80%' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                         <Text strong style={{ color: isTech ? '#0050b3' : '#a8071a' }}>
                           {log.actor_name} {isTech ? '(ช่าง)' : '(ผู้แจ้ง)'}
                         </Text>
                         <Text type="secondary" style={{ fontSize: 11, marginLeft: 15 }}>{new Date(log.created_at).toLocaleString('th-TH')}</Text>
                       </div>
                       {renderLogDetailWithFiles(log.detail)}
                     </div>
                  </div>
                );
              })}
            </Card>
          )}
        </Col>

        <Col xs={24} lg={9}>
          
          <Card title="⚡ การดำเนินการ" style={modernCardStyle} headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
            
            <div style={{ marginBottom: 20 }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>ผู้รับผิดชอบปัจจุบัน</Text>
              {ticket.assigned_to_name ? (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f5ff', padding: '10px 15px', borderRadius: 8, border: '1px solid #adc6ff' }}>
                  {/* ไอคอนสีฟ้าสำหรับช่าง */}
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', marginRight: 15 }} size="large" />
                  <Text strong style={{ color: '#1d39c4', fontSize: 16 }}>{ticket.assigned_to_name}</Text>
                </div>
              ) : (
                <Tag color="default" style={{ borderRadius: 6, padding: '4px 10px' }}>ยังไม่มีผู้รับผิดชอบ</Tag>
              )}
            </div>

            {currentUser?.role !== 'user' && (
              <>
                {ticket.status === 'Pending' && (
                  <div style={{ marginTop: 20 }}>
                    {(currentUser?.role === 'admin' || currentUser?.role === 'head_technician') ? (
                      <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
                        <Form.Item name="assigned_to" rules={[{ required: true, message: 'กรุณาเลือกช่าง' }]}>
                          <Select placeholder="-- เลือกช่างเพื่อจ่ายงาน --" size="large">
                            {technicians.map(t => (<Option key={t.user_id} value={t.user_id}>{t.full_name}</Option>))}
                          </Select>
                        </Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block style={{ borderRadius: 8 }}>บันทึกการจ่ายงาน</Button>
                      </Form>
                    ) : (
                      <Button type="primary" onClick={handleSelfAssign} style={{ backgroundColor: '#2a1a4a', borderRadius: 8 }} size="large" block>🙋‍♂️ กดรับผิดชอบงานนี้</Button>
                    )}
                  </div>
                )}

                {ticket.status === 'In Progress' && (
                  <div style={{ marginTop: 20 }}>
                    {ticket.assigned_to === currentUser?.user_id || currentUser?.role === 'head_technician' || currentUser?.role === 'admin' ? (
                      <Form form={updateForm} layout="vertical" onFinish={handleSubmitFix}>
                        <Form.Item name="root_cause_and_solution" label="บันทึกวิธีแก้ไขปัญหา" rules={[{ required: true, message: 'กรุณาระบุวิธีแก้ไข!' }]}>
                          <TextArea rows={4} placeholder="ระบุสิ่งที่ได้ดำเนินการแก้ไข..." style={{ borderRadius: 8 }} />
                        </Form.Item>
                        <Form.Item label="อัปโหลดไฟล์/รูปภาพ (ถ้ามี)">
                          <Upload multiple beforeUpload={() => false} fileList={fileList} onChange={handleUploadChange}>
                            <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>เลือกไฟล์แนบเพิ่ม</Button>
                          </Upload>
                        </Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block style={{ backgroundColor: '#ef8157', borderColor: '#ef8157', borderRadius: 8 }}>
                          ส่งผลงานให้ตรวจ
                        </Button>
                        {ticket.assigned_to === currentUser?.user_id && (
                          <Button type="text" danger onClick={handleReturnTicket} block style={{ marginTop: 10 }}>ยกเลิกการรับงาน (คืนหัวหน้า)</Button>
                        )}
                      </Form>
                    ) : <Text type="secondary">รอช่างผู้รับผิดชอบดำเนินการ...</Text>}
                  </div>
                )}
              </>
            )}

            {(currentUser?.role === 'user' || currentUser?.role === 'admin') && ticket.status === 'Resolved' && (
               <div style={{ marginTop: 20 }}>
                 <Text strong style={{ color: '#389e0d' }}>ช่างดำเนินการแก้ไขแล้ว</Text>
                 <Text type="secondary" style={{ display: 'block', marginBottom: 15 }}>กรุณาตรวจสอบการใช้งานและยืนยันการปิดเคส</Text>
                 {!isRejecting ? (
                   <Space direction="vertical" style={{ width: '100%' }}>
                     <Button type="primary" size="large" block style={{ backgroundColor: '#52c41a', borderRadius: 8 }} onClick={handleApproveTicket}>✅ ใช้งานได้ปกติ (ปิดเคส)</Button>
                     <Button danger size="large" block style={{ borderRadius: 8 }} onClick={() => setIsRejecting(true)}>❌ ยังใช้งานไม่ได้ (ตีกลับ)</Button>
                   </Space>
                 ) : (
                   <Form form={rejectForm} layout="vertical" onFinish={handleRejectSubmit} style={{ marginTop: 15, padding: 15, backgroundColor: '#fff1f0', borderRadius: 8, border: '1px solid #ffa39e' }}>
                     <Form.Item name="reject_reason" label="เหตุผลที่ตีกลับ" rules={[{ required: true, message: 'กรุณาระบุเหตุผล!' }]}>
                       <TextArea rows={3} placeholder="อธิบายให้ช่างทราบ..." style={{ borderRadius: 8 }} />
                     </Form.Item>
                     <Form.Item label="แนบไฟล์เพิ่มเติม (ถ้ามี)">
                       <Upload multiple beforeUpload={() => false} fileList={rejectFileList} onChange={handleRejectUploadChange}>
                         <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>เลือกไฟล์แนบ</Button>
                       </Upload>
                     </Form.Item>
                     <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                       <Button onClick={() => setIsRejecting(false)}>ยกเลิก</Button>
                       <Button type="primary" danger htmlType="submit">ยืนยันตีกลับ</Button>
                     </Space>
                   </Form>
                 )}
               </div>
            )}

            {ticket.status === 'Closed' && (
              <Result status="success" title="งานนี้ปิดสมบูรณ์แล้ว" style={{ padding: 10 }} />
            )}
          </Card>

          <Card title={<><HistoryOutlined /> Timeline & SLA</>} style={modernCardStyle} headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ backgroundColor: '#fafafa', padding: 15, borderRadius: 8, marginBottom: 20, textAlign: 'center', border: '1px solid #f0f0f0' }}>
              <Text type="secondary">เวลาที่ใช้แก้ไขทั้งหมด</Text><br/>
              <Title level={3} style={{ margin: '5px 0', color: '#ef8157' }}>{elapsedTime}</Title>
              <div>
                <Text style={{ fontSize: 12 }}><b>SLA:</b> {ticket.category_type === 'ฮาร์ดแวร์' ? '12 ชม.' : '6 ชม.'} </Text>
                <Tag color="green" style={{ borderRadius: 10 }}>อยู่ในเกณฑ์</Tag>
              </div>
            </div>
            
            <Timeline style={{ paddingLeft: 10 }}>
              <Timeline.Item color="green">
                <Text strong>แจ้งเคส</Text><br/>
                <Text type="secondary" style={{ fontSize: 12 }}>{new Date(ticket.created_at).toLocaleString('th-TH')}</Text>
              </Timeline.Item>
              
              {logs.map(log => {
                let color = 'blue';
                if (log.action.includes('ตีกลับ')) color = 'red';
                if (log.action.includes('ส่งตรวจสอบ')) color = 'orange';
                if (log.action.includes('ปิดเคส')) color = 'green';

                return (
                  <Timeline.Item key={log.log_id} color={color}>
                    <Text strong>{log.action}</Text><br/>
                    <Text type="secondary" style={{ fontSize: 12 }}>{new Date(log.created_at).toLocaleString('th-TH')} • {log.actor_name}</Text>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </Card>

        </Col>
      </Row>
    </div>
  );
}