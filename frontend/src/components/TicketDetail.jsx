import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Typography, Tag, Button, Spin, Result, Form, Select, Input, Row, Col, Divider, Space, Steps, Upload, Timeline, Card, Avatar, theme, App, Alert, Tooltip, Popover, Modal, Grid } from 'antd'; 
import { 
  ArrowLeftOutlined, ClockCircleOutlined, OrderedListOutlined, PrinterOutlined, 
  FileImageOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FilePptOutlined, FileOutlined,
  UserOutlined, UploadOutlined, DesktopOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, InfoCircleOutlined, QuestionCircleOutlined, BulbOutlined, RocketOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError, alertConfirm } from '../utils/alert';
import { formatThaiDate } from '../utils/dateUtils';
import { API_BASE_URL } from '../utils/config';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { useToken } = theme;
const BACKEND_URL = API_BASE_URL;

export default function TicketDetail() {
  const { message } = App.useApp();
  const { user: currentUser } = useAuth();
  const { token } = useToken();
  const screens = Grid.useBreakpoint();
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [logs, setLogs] = useState([]); 
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  
  const [fileList, setFileList] = useState([]);
  const [assignForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectFileList, setRejectFileList] = useState([]);
  const [rejectForm] = Form.useForm();

  const [elapsedTime, setElapsedTime] = useState('กำลังคำนวณ...');

  // --- Document Preview States ---
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState(''); // 'office', 'pdf', 'image'
  const [previewFilename, setPreviewFilename] = useState('');

  const handlePreviewFile = (filename) => {
    if (!filename) return;
    const fileUrl = `${BACKEND_URL}/uploads/${filename}`;
    // ✅ บังคับใช้ Public Domain เสมอ เพื่อให้ Microsoft Server วิ่งมาดึงไฟล์จากเซิร์ฟเวอร์จริงได้
    const publicFileUrl = `https://ma-bigdata.mol.go.th/uploads/${filename}`;
    
    const ext = filename.split('.').pop().toLowerCase();
    
    setPreviewFilename(filename);
    
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      setPreviewUrl(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicFileUrl)}`);
      setPreviewType('office');
      setPreviewModalVisible(true);
    } else if (ext === 'pdf') {
      setPreviewUrl(fileUrl);
      setPreviewType('pdf');
      setPreviewModalVisible(true);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      setPreviewUrl(fileUrl);
      setPreviewType('image');
      setPreviewModalVisible(true);
    } else {
      window.open(fileUrl);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketRes, logsRes, statusesRes] = await Promise.all([
        axiosInstance.get(`/tickets/${id}`),
        axiosInstance.get(`/tickets/${id}/logs`),
        axiosInstance.get(`/statuses`).catch(() => ({ data: [] }))
      ]);
      
      setTicket(ticketRes.data);
      setLogs(logsRes.data);
      setStatuses(statusesRes?.data || []);
      
      if (currentUser?.role !== 'user' && (currentUser?.project_id || ticketRes.data.project_id)) {
        fetchTechnicians(currentUser.project_id || ticketRes.data.project_id);
      }
    } catch (err) {
      console.error(err);
      alertError('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลรายละเอียดใบงานได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async (projectId) => {
    try {
      const res = await axiosInstance.get(`/users/technicians?project_id=${projectId}`);
      setTechnicians(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (!ticket) return;

    const calculateTime = () => {
      const startTime = new Date(ticket.created_at).getTime();
      let endTime = new Date().getTime(); 

      if (Number(ticket.status_id) >= 4) {
        const resolveLog = logs.find(l => l.action === 'ส่งตรวจสอบ');
        if (resolveLog) {
          endTime = new Date(resolveLog.created_at).getTime();
        } else {
          endTime = new Date(ticket.updated_at || new Date()).getTime();
        }
      }

      const diff = Math.max(0, endTime - startTime);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsedTime(`${hours} ชม. ${minutes} นาที ${seconds} วินาที`);
    };

    calculateTime(); 
    if (Number(ticket.status_id) < 4) {
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
    const actor_name = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'เจ้าหน้าที่';
    try {
      await axiosInstance.post(`/tickets/${id}/logs`, { action: actionName, actor_name, detail: detailMsg });
    } catch (err) { console.error('Failed to save log'); }
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FileOutlined />;
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImageOutlined style={{ color: '#1677ff' }} />;
    if (ext === 'pdf') return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (['doc', 'docx'].includes(ext)) return <FileWordOutlined style={{ color: '#2b579a' }} />;
    if (['xls', 'xlsx'].includes(ext)) return <FileExcelOutlined style={{ color: '#217346' }} />;
    if (['ppt', 'pptx'].includes(ext)) return <FilePptOutlined style={{ color: '#d24726' }} />;
    return <FileOutlined style={{ color: '#8c8c8c' }} />;
  };

  const renderLogDetailWithFiles = (detailText) => {
    if (!detailText) return null;
    const fileRegex = /\[แนบไฟล์(?:เพิ่มเติม|.*?)?:\s*(.*?)\]/;
    const match = detailText.match(fileRegex);
    let textWithoutFiles = detailText;
    let files = [];
    if (match) {
        textWithoutFiles = detailText.replace(fileRegex, '').trim();
        files = match[1].split(',').map(f => f.trim());
    }
    return (
      <div>
        <div style={{ marginBottom: '15px' }}>
          {textWithoutFiles.split('\n').map((line, index) => (
            <div key={index} style={{ borderBottom: `1px dashed ${token.colorBorder}`, minHeight: '28px', lineHeight: '28px', fontSize: '14px' }}>
                {line || '\u00A0'} 
            </div>
          ))}
        </div>
        {files.length > 0 && (
          <Space wrap style={{ marginTop: 10 }}>
            {files.map((file, idx) => (
              <Button key={idx} size="small" type="dashed" icon={getFileIcon(file)} onClick={() => handlePreviewFile(file)}>
                {file.length > 25 ? `${file.substring(0, 25)}...` : file}
              </Button>
            ))}
          </Space>
        )}
      </div>
    );
  };

  const handleAssign = async (values) => {
    const hide = message.loading('กำลังมอบหมายงาน...', 0);
    try {
      await axiosInstance.put(`/tickets/${id}/assign`, { assigned_to: values.assigned_to });
      const techName = technicians.find(t => t.user_id === values.assigned_to)?.full_name || 'ช่าง';
      await addLog('มอบหมายงาน', `จ่ายงานให้: ${techName}`);
      hide();
      await alertSuccess('สำเร็จ!', 'มอบหมายงานเรียบร้อยแล้ว');
      await fetchData(); 
    } catch (error) { hide(); alertError('เกิดข้อผิดพลาด!', 'ไม่สามารถมอบหมายงานได้'); }
  };

  const handleSelfAssign = async () => {
    const hide = message.loading('กำลังรับงาน...', 0);
    try {
      await axiosInstance.put(`/tickets/${id}/assign`, { assigned_to: currentUser.user_id });
      await addLog('รับงาน', 'ช่างกดรับผิดชอบงานนี้เข้าตัวเอง');
      hide();
      await alertSuccess('รับงานสำเร็จ!', 'ระบบเริ่มจับเวลาการแก้ไขของคุณแล้ว');
      await fetchData(); 
    } catch (error) { hide(); alertError('เกิดข้อผิดพลาด!', 'ไม่สามารถรับงานได้'); }
  };

  const handleReturnTicket = async () => {
    const result = await alertConfirm('ยืนยันการตีกลับงาน?', 'คุณต้องการคืนงานนี้ให้หัวหน้าใช่หรือไม่?');
    if (result.isConfirmed) {
      try {
        await axiosInstance.put(`/tickets/${id}/return`);
        await addLog('ตีกลับงาน (ช่าง)', 'ช่างยกเลิกการรับงานและส่งคืนหัวหน้า');
        await alertSuccess('ตีกลับสำเร็จ!', 'ส่งงานคืนให้หัวหน้าช่างเรียบร้อยแล้ว');
        fetchData();
      } catch (error) { alertError('เกิดข้อผิดพลาด!'); }
    }
  };

  const handleSubmitFix = async (values) => {
    try {
      const formData = new FormData();
      // ✅ Logic ใหม่: ถ้า Status เป็น 5 (ตรวจสอบแล้ว/รอคู่มือ) ให้อัปโหลดแล้วปิดเคสเลย (Status 6)
      // ถ้าเป็น Status 4 (หรือต่ำกว่า) แล้วกดส่งงาน ให้เป็น 4 (หรือ 5 ถ้าอัปโหลดคู่มือล่วงหน้า ตาม logic backend)
      let targetStatus = 4;
      if (Number(ticket.status_id) >= 4) {
          targetStatus = Number(ticket.status_id) === 5 ? 6 : 5;
      }

      formData.append('status_id', targetStatus.toString());
      if (values.root_cause_and_solution) {
          formData.append('root_cause_and_solution', values.root_cause_and_solution);
      }
      fileList.forEach(file => formData.append('attachments', file.originFileObj));

      const res = await axiosInstance.put(`/tickets/${id}/update-status`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const savedFiles = res.data.files || [];
      const attachMsg = savedFiles.length > 0 ? `\n[แนบไฟล์/คู่มือ: ${savedFiles.join(',')}]` : '';

      const logActionName = targetStatus === 6 ? 'อัปโหลดคู่มือและปิดเคสสมบูรณ์' : (Number(ticket.status_id) >= 4 ? 'อัปโหลดคู่มือการแก้ไข' : 'ส่งตรวจสอบ');
      await addLog(logActionName, `วิธีแก้ไข/รายละเอียด: ${values.root_cause_and_solution || 'อัปโหลดไฟล์คู่มือ'}${attachMsg}`);

      await alertSuccess('สำเร็จ!', targetStatus === 6 ? 'อัปโหลดคู่มือและปิดเคสอัตโนมัติเรียบร้อยแล้ว' : 'บันทึกข้อมูลเรียบร้อยแล้ว');
      setFileList([]); fetchData();
    } catch (error) { alertError('เกิดข้อผิดพลาด!'); }
  };

  const handleApproveTicket = async () => {
    const manualExists = logs.some(l => l.action.includes('คู่มือ') || l.detail.includes('[แนบไฟล์/คู่มือ'));
    const targetStatus = manualExists ? 6 : 5;
    try {
      await axiosInstance.put(`/tickets/${id}/update-status`, { status_id: targetStatus });
      await addLog('ปิดเคสสมบูรณ์', 'ผู้แจ้งตรวจสอบและยืนยันการปิดงาน' + (targetStatus === 5 ? ' (รอช่างอัปโหลดคู่มือ)' : ''));
      await alertSuccess('ดำเนินการสำเร็จ!', targetStatus === 5 ? 'แจ้งช่างให้อัปโหลดคู่มือเรียบร้อยแล้ว' : 'ปิดงานสมบูรณ์');
      fetchData();
    } catch (error) { alertError('เกิดข้อผิดพลาด!'); }
  };

  const handleRejectSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('status_id', '3'); 
      rejectFileList.forEach(file => formData.append('attachments', file.originFileObj));

      const res = await axiosInstance.put(`/tickets/${id}/update-status`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const savedFiles = res.data.files || [];
      const attachMsg = savedFiles.length > 0 ? `\n[แนบไฟล์เพิ่มเติม: ${savedFiles.join(',')}]` : '';
      
      await addLog('ตีกลับให้แก้ไขใหม่', `เหตุผลที่ตีกลับ: ${values.reject_reason}${attachMsg}`);
      await alertSuccess('ส่งกลับให้ช่างแก้ไขใหม่แล้ว');
      setIsRejecting(false); rejectForm.resetFields(); setRejectFileList([]); fetchData();
    } catch (error) { alertError('เกิดข้อผิดพลาด!'); }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;
  if (!ticket) return <Result status="404" title="ไม่พบข้อมูล" />;

  const getStatusName = (statusId) => {
    const sid = Number(statusId);
    const dbStatus = statuses.find(s => Number(s.status_id) === sid);
    return dbStatus?.status_name || 'ไม่ระบุสถานะ';
  };

  const getStatusColor = (statusId) => {
    const sid = Number(statusId);
    const dbStatus = statuses.find(s => Number(s.status_id) === sid);
    return dbStatus?.status_color || '#d9d9d9';
  };

  const getStepCurrent = () => {
    const currentStatus = statuses.find(s => Number(s.status_id) === Number(ticket.status_id));
    if (currentStatus && currentStatus.sort_order) return Number(currentStatus.sort_order) - 1;
    const sorted = [...statuses].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(s => Number(s.status_id) === Number(ticket.status_id));
    return idx >= 0 ? idx : 0;
  };

  const isRejected = Number(ticket.status_id) === 3;
  const isResolved = Number(ticket.status_id) === 4;
  const isWaitManual = Number(ticket.status_id) === 5;
  const isClosed = Number(ticket.status_id) === 6;

  const sortedStatuses = [...statuses].sort((a, b) => a.sort_order - b.sort_order);
  const stepItems = sortedStatuses.length > 0 
    ? sortedStatuses.map(status => {
        const titleText = status.status_name;
        const subTitle = Number(status.status_id) === 1 ? 'รอรับงาน' : 
                         Number(status.status_id) === 2 ? 'ดำเนินการ' :
                         Number(status.status_id) === 3 ? 'ตีกลับ/แก้ไข' :
                         Number(status.status_id) === 4 ? 'ตรวจสอบ' : 
                         Number(status.status_id) === 5 ? 'รอคู่มือ' : 'สมบูรณ์';
        return {
          title: Number(status.status_id) === 3 ? `${titleText} ↩️` : titleText,
          description: subTitle
        };
      })
    : [];

  const getStatusTag = (statusId) => {
    const sid = Number(statusId || ticket.status_id);
    const titleText = getStatusName(sid);
    const color = getStatusColor(sid);
    return <Tag color={color} style={{ fontSize: 16, padding: '4px 16px', borderRadius: 20 }}>{titleText}</Tag>;
  };

  const modernCardStyle = { borderRadius: 12, boxShadow: token.boxShadowTertiary, border: 'none', marginBottom: 20 };

  return (
    <div style={{ width: '100%', padding: screens.xs ? '10px 12px' : '10px 24px', margin: '0 auto', backgroundColor: token.colorBgLayout, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ borderRadius: 8 }}>ย้อนกลับ</Button>
        <Space>
            <Tooltip title="กดเพื่อดูไกด์การใช้งาน">
                <Button shape="circle" icon={<QuestionCircleOutlined />} onClick={() => {
                    const guideText = currentUser?.role === 'user' 
                        ? 'ไกด์สำหรับผู้แจ้ง: เมื่อช่างแก้ไขเสร็จ สถานะจะเป็น "ดำเนินการแล้ว" ให้ท่านเข้ามาตรวจสอบงานและกดปุ่ม "ใช้งานได้ปกติ" หากงานเรียบร้อยดีครับ'
                        : 'ไกด์สำหรับช่าง: เมื่อแก้ไขเสร็จ ให้กด "ส่งผลงานให้ตรวจ" เพื่อหยุดเวลา SLA หลังจากนั้นต้องอัปโหลด "คู่มือการแก้ไข" เพื่อให้ผู้แจ้งปิดงานได้สมบูรณ์ครับ';
                    message.info(guideText, 5);
                }} />
            </Tooltip>
            <Link to={`/print/${ticket.ticket_id}`} target="_blank">
            <Button type="primary" icon={<PrinterOutlined />} style={{ backgroundColor: '#28a745', borderColor: '#28a745', borderRadius: 8 }}>พิมพ์ใบงาน</Button>
            </Link>
        </Space>
      </div>

      <Card style={modernCardStyle} styles={{ body: { padding: screens.xs ? '16px 12px' : '24px 40px' } }}>
        <Steps current={getStepCurrent()} size="small" items={stepItems} status={isRejected ? 'error' : 'process'} style={screens.xs ? { gap: '4px' } : {}} />
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Card style={modernCardStyle} styles={{ body: { padding: screens.xs ? '16px' : '30px' } }}>
            <div style={{ display: 'flex', flexDirection: screens.xs ? 'column' : 'row', justifyContent: 'space-between', alignItems: screens.xs ? 'flex-start' : 'center', gap: screens.xs ? 12 : 0, marginBottom: 20, paddingBottom: 20, borderBottom: `2px solid ${token.colorBorderSecondary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: screens.xs ? '100%' : 'auto', alignItems: 'center' }}>
                <Title level={screens.xs ? 4 : 3} style={{ margin: 0 }}>รหัสใบงาน {ticket.ticket_number}</Title>
                {screens.xs && getStatusTag(ticket.status_id)}
              </div>
              <Title level={5} style={{ margin: 0 }}>วันเวลาที่แจ้ง <Text>{formatThaiDate(ticket.created_at)}</Text></Title>
              {!screens.xs && getStatusTag(ticket.status_id)}
            </div>
            <div style={{ display: 'flex', alignItems: screens.xs ? 'flex-start' : 'center', marginBottom: 20 }}>
              <Avatar size={55} icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary, marginRight: 15, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Title level={5} style={{ display: 'flex', alignItems: 'left', marginBottom: -2 }}>ผู้แจ้ง </Title>
                <Text type="secondary" style={{ display: 'block', wordBreak: 'break-word' }}>
                  ชื่อ: {ticket.reporter_name_snap || ticket.reporter_name} | หน่วยงาน: {ticket.reporter_agency_snap || ticket.agency || 'ไม่ระบุ'}
                </Text>
              </div>
            </div>
            <Space size="large" style={{ marginBottom: 15, display: 'flex', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>หมวดหมู่ระบบ</Text>
                <Tag color="blue" icon={<DesktopOutlined />} style={{ padding: '4px 10px', fontSize: 14, borderRadius: 6, whiteSpace: 'normal', height: 'auto', display: 'inline-flex', alignItems: 'flex-start', maxWidth: '100%' }}>
                  <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{ticket.category_name}</span>
                </Tag>
              </div>
              <div>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>เลขครุภัณฑ์ / อุปกรณ์</Text>
                <Text strong>{ticket.equipment_no || '-'}</Text>
              </div>
            </Space>
            <div style={{ marginBottom: 25, marginTop: 15 }}>
              <Divider titlePlacement="center" style={{ borderColor: token.colorBorderSecondary }}><><DesktopOutlined /> รายละเอียดปัญหาเบื้องต้น</></Divider>
              <div style={{ backgroundColor: token.colorFillAlter, padding: '15px 20px', borderRadius: '8px', border: `1px solid ${token.colorBorderSecondary}` }}>
                {ticket.problem_detail ? <div style={{ fontSize: '15px', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: ticket.problem_detail }} /> : <Text type="secondary">-</Text>}
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 5 }}><FileImageOutlined /> ไฟล์แนบ (ตอนเปิดใบงาน)</Text>
              {ticket.attachment ? <Button type="dashed" style={{ borderRadius: 6 }} onClick={() => handlePreviewFile(ticket.attachment)}>{ticket.attachment}</Button> : <Text type="secondary">ไม่มีไฟล์แนบ</Text>}
            </div>
          </Card>

          {currentUser?.role !== 'user' ? (
            <Card title={<><RocketOutlined /> การดำเนินการ (สำหรับช่าง)</>} style={modernCardStyle} styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` } }}>
              <div style={{ marginBottom: 20 }}>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>ผู้รับผิดชอบปัจจุบัน</Text>
                {ticket.assigned_to_name_snap || ticket.assigned_to_name ? (
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: token.colorInfoBg, padding: '10px 15px', borderRadius: 8, border: `1px solid ${token.colorInfoBorder}` }}>
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: token.colorInfo, marginRight: 15 }} size="large" />
                    <div>
                      <Text strong style={{ color: token.colorInfoText, fontSize: 16, display: 'block' }}>{ticket.assigned_to_name_snap || ticket.assigned_to_name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{ticket.assigned_to_vendor_snap || 'เจ้าหน้าที่ไอที'}</Text>
                    </div>
                  </div>
                ) : <Tag color="default" style={{ borderRadius: 6, padding: '4px 10px' }}>ยังไม่มีผู้รับผิดชอบ</Tag>}
              </div>

              {(Number(ticket.status_id) === 1) && (
                <div style={{ marginTop: 20 }}>
                  <Alert description="กรุณามอบหมายงานหรือกดรับงานเพื่อเริ่มดำเนินการแก้ไข" type="warning" showIcon style={{ marginBottom: 15 }} />
                  {(currentUser?.role === 'admin' || currentUser?.role === 'head_technician') ? (
                    <Form form={assignForm} layout="vertical" onFinish={handleAssign} initialValues={{ assigned_to: ticket.assigned_to }}>
                      <Form.Item name="assigned_to" rules={[{ required: true, message: 'กรุณาเลือกช่าง' }]}>
                        <Select placeholder="-- เลือกช่างเพื่อจ่ายงาน --" size="large">
                          {technicians.map(t => (<Option key={t.user_id} value={t.user_id}>{t.full_name}</Option>))}
                        </Select>
                      </Form.Item>
                      <Button type="primary" htmlType="submit" size="large" block style={{ borderRadius: 8 }}>บันทึกการจ่ายงาน</Button>
                    </Form>
                  ) : <Button type="primary" onClick={handleSelfAssign} style={{ backgroundColor: token.colorPrimaryActive, borderRadius: 8 }} size="large" block>🙋‍♂️ กดรับผิดชอบงานนี้</Button>}
                </div>
              )}

              {(Number(ticket.status_id) >= 2 && Number(ticket.status_id) <= 5) && (
                <div style={{ marginTop: 20 }}>
                  {(ticket.assigned_to === currentUser?.user_id || currentUser?.role === 'head_technician') ? (
                    <Form form={updateForm} layout="vertical" onFinish={handleSubmitFix} initialValues={{ root_cause_and_solution: ticket.root_cause_and_solution || '' }}>
                      {(Number(ticket.status_id) === 2 || Number(ticket.status_id) === 3) && (
                        <>
                          <Popover content="บันทึกรายละเอียดการซ่อมเบื้องต้น และกดส่งผลงานเพื่อให้ผู้แจ้งตรวจสอบ" title="ขั้นตอนการส่งงาน">
                            <Text strong><BulbOutlined /> คำแนะนำ:</Text> บันทึกวิธีแก้ไขและกดปุ่มด้านล่างเพื่อหยุดเวลา SLA
                          </Popover>
                          <Form.Item name="root_cause_and_solution" label="บันทึกวิธีแก้ไขปัญหา" rules={[{ required: true, message: 'กรุณาระบุวิธีแก้ไข!' }]}>
                            <TextArea rows={4} placeholder="ระบุสิ่งที่ได้ดำเนินการแก้ไข..." style={{ borderRadius: 8, marginTop: 10 }} />
                          </Form.Item>
                          <Form.Item label="แนบไฟล์ยืนยันการแก้ไข (ถ้ามี)">
                            <Upload multiple beforeUpload={() => false} fileList={fileList} onChange={handleUploadChange}>
                              <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>เลือกไฟล์ (รูปภาพ/เอกสาร)</Button>
                            </Upload>
                          </Form.Item>
                        </>
                      )}
                      
                      {(Number(ticket.status_id) === 4 || Number(ticket.status_id) === 5) && (
                        <>
                          <Alert description="✨ ขั้นตอนสุดท้าย: กรุณาอัปโหลดคู่มือการแก้ไขปัญหา หรือรูปภาพยืนยันการจบงานเพื่อความสมบูรณ์ของประวัติ" type="success" showIcon style={{ marginBottom: 15 }} />
                          <Form.Item label="อัปโหลดไฟล์คู่มือการแก้ไข (บังคับ)" rules={[{ required: true, message: 'กรุณาอัปโหลดคู่มือ!' }]}>
                            <Upload multiple beforeUpload={() => false} fileList={fileList} onChange={handleUploadChange}>
                              <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>เลือกไฟล์คู่มือ (Manual/Screenshot)</Button>
                            </Upload>
                          </Form.Item>
                        </>
                      )}

                      <Button type="primary" htmlType="submit" size="large" block style={{ backgroundColor: token.colorPrimary, borderColor: token.colorPrimary, borderRadius: 8, height: '50px', fontSize: '18px' }}>
                        {Number(ticket.status_id) >= 4 ? 'บันทึกคู่มือและอัปเดตงาน' : '🚀 ส่งผลงานให้ตรวจ (หยุดเวลาซ่อม)'}
                      </Button>
                      
                      {(Number(ticket.status_id) === 2 || Number(ticket.status_id) === 3) && ticket.assigned_to === currentUser?.user_id && (
                        <Button type="text" danger onClick={handleReturnTicket} block style={{ marginTop: 10 }}>ยกเลิกการรับงาน (คืนหัวหน้า)</Button>
                      )}
                    </Form>
                  ) : <Text type="secondary">รอช่างผู้รับผิดชอบดำเนินการ...</Text>}
                </div>
              )}
              {isClosed && <Result status="success" title="งานนี้ปิดสมบูรณ์แล้ว" subTitle="ข้อมูลถูกบันทึกลงฐานข้อมูลเรียบร้อย" />}
            </Card>
          ) : (
            <Card title={<><CheckCircleOutlined /> ผลการดำเนินการ</>} style={modernCardStyle} styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` } }}>
              {(isResolved || isWaitManual) ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ backgroundColor: token.colorSuccessBg || '#f6ffed', padding: 20, borderRadius: 12, marginBottom: 20, border: '2px solid ' + (token.colorSuccessBorder || '#b7eb8f'), textAlign: 'center' }}>
                    <RocketOutlined style={{ fontSize: 40, color: token.colorSuccess, marginBottom: 10 }} />
                    <Title level={4} style={{ color: token.colorSuccessText, margin: 0 }}>ช่างดำเนินการแก้ไขเรียบร้อยแล้ว!</Title>
                    <Text strong style={{ color: token.colorSuccessText, display: 'block', marginTop: 5 }}>✨ กรุณาตรวจสอบการใช้งานและยืนยันการปิดเคส</Text>
                  </div>

                  {ticket.root_cause_and_solution && (
                    <div style={{ backgroundColor: '#fafafa', padding: 20, borderRadius: 12, marginBottom: 25, borderLeft: `4px solid ${token.colorPrimary}` }}>
                      <Text strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, marginBottom: 10 }}>
                        <InfoCircleOutlined style={{ color: token.colorPrimary }} /> บันทึกผลการแก้ไขจากช่าง:
                      </Text>
                      <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{ticket.root_cause_and_solution}</Paragraph>
                      
                      {/* ตรวจหาไฟล์แนบจาก Log เพื่อดึงมาแสดงให้ผู้แจ้งเห็นง่ายๆ */}
                      {(() => {
                         const manualLogs = logs.filter(l => l.detail && l.detail.includes('[แนบไฟล์/คู่มือ:'));
                         if (manualLogs.length === 0) return null;
                         const latestLog = manualLogs[0]; // Log ล่าสุดที่อัปโหลดคู่มือ
                         const fileRegex = /\[แนบไฟล์\/คู่มือ:\s*(.*?)\]/;
                         const match = latestLog.detail.match(fileRegex);
                         if (!match) return null;
                         const uploadedFiles = match[1].split(',').map(f => f.trim());
                         
                         return (
                            <div style={{ marginTop: 15 }}>
                              <Text strong style={{ display: 'block', marginBottom: 8 }}><FileOutlined /> ไฟล์คู่มือ/รายละเอียดแนบ:</Text>
                              <Space wrap>
                                {uploadedFiles.map((file, idx) => (
                                  <Button key={idx} size="small" type="dashed" icon={getFileIcon(file)} onClick={() => handlePreviewFile(file)}>
                                    {file.length > 25 ? `${file.substring(0, 25)}...` : file}
                                  </Button>
                                ))}
                              </Space>
                            </div>
                         );
                      })()}
                    </div>
                  )}

                  {!isRejecting ? (
                    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                      <Button type="primary" size="large" block style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: 10, height: 60, fontSize: 20, fontWeight: 'bold' }} onClick={handleApproveTicket}>✅ ใช้งานได้ปกติ (ปิดเคส)</Button>
                      <Button danger size="large" block style={{ borderRadius: 10, height: 50 }} onClick={() => setIsRejecting(true)}>❌ ยังใช้งานไม่ได้ (ตีกลับให้แก้ไข)</Button>
                    </Space>
                  ) : (
                    <Form form={rejectForm} layout="vertical" onFinish={handleRejectSubmit} style={{ marginTop: 15, padding: 20, backgroundColor: token.colorErrorBg, borderRadius: 12, border: `1px solid ${token.colorErrorBorder}` }}>
                      <Form.Item name="reject_reason" label={<Text strong><CloseCircleOutlined /> ระบุเหตุผลที่ตีกลับ</Text>} rules={[{ required: true, message: 'กรุณาระบุเหตุผล!' }]}>
                        <TextArea rows={3} placeholder="อธิบายปัญหาที่ยังพบเพื่อให้ช่างดำเนินการแก้ไขต่อ..." style={{ borderRadius: 8 }} />
                      </Form.Item>
                      <Form.Item label="แนบรูปภาพปัญหาเพิ่มเติม (ถ้ามี)">
                        <Upload multiple beforeUpload={() => false} fileList={rejectFileList} onChange={handleRejectUploadChange}>
                          <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>เลือกไฟล์แนบ</Button>
                        </Upload>
                      </Form.Item>
                      <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={() => setIsRejecting(false)}>ยกเลิก</Button>
                        <Button type="primary" danger htmlType="submit">ยืนยันการตีกลับงาน</Button>
                      </Space>
                    </Form>
                  )}
                </div>
              ) : isClosed ? (
                <Result status="success" title="งานนี้ปิดสมบูรณ์แล้ว" subTitle="ขอบคุณที่ใช้บริการ หากมีปัญหาเพิ่มเติมสามารถแจ้งผ่านระบบได้เสมอครับ" extra={[<Button key="home" onClick={() => navigate('/tickets')}>กลับหน้าหลัก</Button>]} />
              ) : (
                <Result icon={<ClockCircleOutlined style={{ color: token.colorPrimary }} />} title="กำลังรอดำเนินการ" subTitle="เจ้าหน้าที่กำลังเร่งตรวจสอบและแก้ไขปัญหาให้ท่าน โปรดรอการอัปเดตสถานะ" />
              )}
            </Card>
          )}
        </Col>

        <Col xs={24} lg={9}>
          {logs.filter(log => ['ส่งตรวจสอบ', 'ตีกลับให้แก้ไขใหม่', 'อัปโหลดคู่มือการแก้ไข'].includes(log.action)).length > 0 && (
            <Card title={<><OrderedListOutlined style={{ fontSize: '30px', color: token.colorError }} />  ประวัติการแก้ไข</>} style={{ ...modernCardStyle, marginBottom: 24 }} styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}`, backgroundColor: token.colorFillAlter } }}>
              {[...logs].filter(log => ['ส่งตรวจสอบ', 'ตีกลับให้แก้ไขใหม่', 'อัปโหลดคู่มือการแก้ไข'].includes(log.action)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(log => {
                const isTech = log.action === 'ส่งตรวจสอบ' || log.action === 'อัปโหลดคู่มือการแก้ไข';
                const avatarColor = isTech ? token.colorInfo : token.colorPrimary; 
                return (
                  <div key={log.log_id} style={{ display: 'flex', marginBottom: 20, flexDirection: isTech ? 'row-reverse' : 'row' }}>
                     <Avatar size={45} icon={<UserOutlined />} style={{ backgroundColor: avatarColor, margin: isTech ? '0 0 0 15px' : '0 15px 0 0', flexShrink: 0 }} />
                     <div style={{ width: screens.xs ? '90%' : '45%', minWidth: screens.xs ? 'auto' : '300px', backgroundColor: isTech ? token.colorInfoBg : token.colorErrorBg, border: `1px solid ${isTech ? token.colorInfoBorder : token.colorErrorBorder}`, padding: screens.xs ? '12px 15px' : '15px 20px', borderRadius: 12 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}><Text strong style={{ color: isTech ? token.colorInfoText : token.colorErrorText, fontSize: '15px' }}>{log.actor_name} {isTech ? '(ช่าง)' : '(ผู้แจ้ง)'}</Text></div>
                       {renderLogDetailWithFiles(log.detail)}
                       <div style={{ textAlign: 'right' }}><Text type="secondary" style={{ fontSize: 11 }}>{formatThaiDate(log.created_at)}</Text></div>
                     </div>
                  </div>
                );
              })}
            </Card>
          )}

          <Card title={<><ClockCircleOutlined spin style={{ fontSize: '30px', color: token.colorPrimary }} /> Timeline & SLA</>} style={modernCardStyle} styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` } }}>
            <div style={{ backgroundColor: Number(ticket.is_cm) === 1 ? (ticket.is_sla_breached === 1 ? token.colorErrorBg : token.colorSuccessBg) : token.colorBgLayout, padding: 15, borderRadius: 8, marginBottom: 20, textAlign: 'center', border: `1px solid ${Number(ticket.is_cm) === 1 ? (ticket.is_sla_breached === 1 ? token.colorErrorBorder : token.colorSuccessBorder) : token.colorBorderSecondary}` }}>
              <Text type="secondary">{(Number(ticket.status_id) >= 4) ? 'เวลาที่ใช้ในการแก้ไข' : 'เวลาที่ใช้ไปแล้ว (ขณะนี้)'}</Text><br/>
              <Title level={3} style={{ margin: '5px 0', color: Number(ticket.is_cm) === 1 && ticket.is_sla_breached === 1 ? token.colorError : token.colorText }}>{elapsedTime}</Title>
              <div style={{ textAlign: 'left', marginTop: 15, fontSize: 13, backgroundColor: token.colorBgContainer, padding: 10, borderRadius: 6, border: `1px solid ${token.colorBorderSecondary}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: `1px dashed ${token.colorBorderSecondary}`, paddingBottom: 8 }}>
                  <Text><b>แจ้งเมื่อ:</b></Text><Text>{formatThaiDate(ticket.created_at)}</Text>
                </div>
                {Number(ticket.is_cm) === 1 ? (
                  <>
                    {['Hardware', 'Software'].includes(ticket.category_type) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: `1px dashed ${token.colorBorderSecondary}`, paddingBottom: 8 }}>
                        <Text><b>เข้าดำเนินการ (2 ชม.):</b></Text>
                        {ticket.acknowledged_at ? <Tag color="blue" style={{ margin: 0 }}>รับงานแล้ว {new Date(ticket.acknowledged_at).toLocaleTimeString('th-TH')}</Tag> : (Number(ticket.status_id) === 1 ? <Tag color="warning" style={{ margin: 0 }}>รอช่างกดรับงาน</Tag> : <Tag color="default" style={{ margin: 0 }}>-</Tag>)}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text><b>สถานะ SLA:</b></Text>
                      {ticket.is_sla_breached === 1 ? <Tag color="red" style={{ margin: 0 }}>เกินเวลา (ปรับ {parseFloat(ticket.penalty_amount || 0).toLocaleString()} ฿)</Tag> : (Number(ticket.status_id) >= 4 ? <Tag color="green" style={{ margin: 0 }}>ซ่อมเสร็จทันเวลา</Tag> : <Tag color="processing" style={{ margin: 0 }}>อยู่ในเกณฑ์เวลา</Tag>)}
                    </div>
                  </>
                ) : <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Text><b>ประเภท:</b></Text><Tag color="default" style={{ margin: 0 }}>ใบงานทั่วไป (ไม่นำมาคิด SLA)</Tag></div>}
                {ticket.sla_deadline && Number(ticket.is_cm) === 1 && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><Text type="secondary">กำหนดเสร็จ:</Text><Text type="secondary">{new Date(ticket.sla_deadline).toLocaleString('th-TH').slice(0, -3)} น.</Text></div>}
              </div>
            </div>
            <Timeline style={{ paddingLeft: 10, marginTop: 20 }} mode="start" items={[
                { timestamp: new Date(ticket.created_at), color: getStatusColor(1), content: (<div style={{ marginBottom: 10 }}><Text strong style={{ color: getStatusColor(1) }}>{getStatusName(1)}</Text><br/><Text type="secondary" style={{ fontSize: 12 }}>{formatThaiDate(ticket.created_at)} • {ticket.reporter_name_snap || ticket.reporter_name}</Text></div>) },
                ...logs.map(log => {
                  let color = '#d9d9d9'; let sid = null;
                  if (log.action.includes('รับงาน') || log.action.includes('มอบหมาย')) sid = 2;
                  if (log.action.includes('ตีกลับ')) sid = 3;
                  if (log.action.includes('ส่งตรวจสอบ')) sid = 4;
                  if (log.action.includes('คู่มือ')) sid = 5;
                  if (log.action.includes('ปิดเคส')) sid = 6;
                  if (sid) color = statuses.find(s => Number(s.status_id) === sid)?.status_color || color;
                  return { timestamp: new Date(log.created_at), color: color, content: (<div style={{ marginBottom: 10 }}><Text strong style={{ color: color }}>{log.action}</Text><br/><Text type="secondary" style={{ fontSize: 12 }}>{formatThaiDate(log.created_at)} • {log.actor_name || 'เจ้าหน้าที่ระบบ'}</Text></div>) };
                })
              ].sort((a, b) => a.timestamp - b.timestamp)}
            />
          </Card>
        </Col>
      </Row>

      {/* --- Document Preview Modal --- */}
      <Modal
        title={<><FileOutlined /> ตัวอย่างเอกสาร: {previewFilename}</>}
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setPreviewUrl('');
        }}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => window.open(`${BACKEND_URL}/uploads/${previewFilename}`)}>
            ดาวน์โหลดไฟล์ต้นฉบับ
          </Button>,
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            ปิดหน้าต่าง
          </Button>
        ]}
        width="80vw"
        style={{ top: 20 }}
        styles={{ body: { height: '80vh', padding: 0 } }}
        destroyOnHidden
      >
        {previewType === 'image' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
            <img src={previewUrl} alt={previewFilename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        )}
        {(previewType === 'pdf' || previewType === 'office') && (
          <iframe 
            src={previewUrl} 
            title="Document Preview" 
            width="100%" 
            height="100%" 
            style={{ border: 'none' }} 
            allowFullScreen 
          />
        )}
      </Modal>
    </div>
  );
}
