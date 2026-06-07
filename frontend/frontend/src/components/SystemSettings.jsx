import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SettingOutlined,SaveOutlined,MessageOutlined,MailOutlined,ClockCircleOutlined,UploadOutlined,SafetyCertificateOutlined,RocketOutlined,UserOutlined,EyeOutlined,EyeInvisibleOutlined,SyncOutlined,BgColorsOutlined,FontSizeOutlined,PictureOutlined,BulbOutlined,FileTextOutlined,SecurityScanOutlined,BellOutlined,FileProtectOutlined,EditOutlined,GlobalOutlined,LinkOutlined,ApiOutlined,DatabaseOutlined,CloudServerOutlined,AppstoreOutlined,CodeOutlined,SafetyOutlined,DesktopOutlined,SearchOutlined,SmileOutlined,TagOutlined,InfoCircleOutlined,HddOutlined,CheckCircleOutlined,QuestionCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Form, Input, Button, Row, Col, Typography, InputNumber, Divider, Upload, Space, Spin, Switch, Tag, Select, Radio, ColorPicker, theme, App, Alert, Flex, Progress, Descriptions, Statistic, Popover, Tooltip, Modal, List } from 'antd';
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError } from '../utils/alert';
import { API_BASE_URL } from '../utils/config';
import { io } from 'socket.io-client';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;
const BACKEND_URL = API_BASE_URL;

/**
 * 🛠️ Professional Template Editor with Emoji & Variables
 */
const TemplateEditor = ({ value, onChange, placeholder, variables = [] }) => {
  const { token } = useToken();
  const textAreaRef = React.useRef(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [variableOpen, setVariableOpen] = useState(false);

  const emojis = ['🔔', '⚙️', '🔄', '✅', '⚠️', '🚨', '📌', '📝', '👤', '🖥️', '📱', '🚀', '⏩', '📥', '📤', '💡', '🔥', '✨', '🆕', '📋'];

  const insertText = (textToInsert, type) => {
    const el = textAreaRef.current?.resizableTextArea?.textArea;
    if (type === 'emoji') setEmojiOpen(false);
    if (type === 'variable') setVariableOpen(false);

    if (!el) {
      onChange((value || '') + textToInsert);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentText = value || '';
    const newValue = currentText.substring(0, start) + textToInsert + currentText.substring(end);
    onChange(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  return (
    <div style={{ border: `1px solid ${token.colorBorder}`, borderRadius: '12px', overflow: 'hidden', background: token.colorBgContainer }}>
      <div style={{ padding: '8px 12px', background: token.colorFillAlter, borderBottom: `1px solid ${token.colorBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space size="small">
          <Popover trigger="click" open={emojiOpen} onOpenChange={setEmojiOpen} title={<Text strong>เลือก Emoji</Text>}
            content={
              <div style={{ width: 220, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {emojis.map(e => (<Button key={e} type="text" style={{ fontSize: 20, height: 40, padding: 0 }} onClick={() => insertText(e, 'emoji')}>{e}</Button>))}
              </div>
            }
          >
            <Button icon={<SmileOutlined />} size="small">Emoji</Button>
          </Popover>
          <Popover trigger="click" open={variableOpen} onOpenChange={setVariableOpen} title={<Text strong>แทรกตัวแปร (Variables)</Text>}
            content={
              <div style={{ width: 250, maxHeight: 300, overflowY: 'auto' }}>
                {variables.map((v, idx) => (
                  <div key={v.key} style={{ cursor: 'pointer', padding: '8px 12px', borderBottom: idx === variables.length - 1 ? 'none' : `1px solid ${token.colorSplit}`, transition: 'background 0.2s' }} className="variable-item" onClick={() => insertText(v.key, 'variable')}>
                    <Flex align="center" gap={8}><Tag color="blue" style={{ margin: 0 }}>{v.key}</Tag><Text type="secondary" style={{ fontSize: 12 }}>{v.label}</Text></Flex>
                  </div>
                ))}
              </div>
            }
          >
            <Button icon={<TagOutlined />} size="small">ตัวแปร</Button>
          </Popover>
        </Space>
        <Tooltip title="ข้อมูลจะถูกส่งไปยัง LINE / Email ตามรูปแบบนี้"><Tag icon={<InfoCircleOutlined />} color="processing" style={{ margin: 0, borderRadius: 10 }}>Preview Mode</Tag></Tooltip>
      </div>
      <TextArea ref={textAreaRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={6} style={{ border: 'none', borderRadius: 0, padding: '12px', resize: 'vertical' }} />
      <style>{`.variable-item:hover { background-color: ${token.colorPrimary}10; }`}</style>
    </div>
  );
};

const DEFAULT_NEW_TICKET_TEMPLATE = `🆕 *มีใบงานแจ้งซ่อมใหม่: [ticket_no]*\n🖥️ **ระบบ/หมวดหมู่:** [category]\n📝 **รายละเอียดปัญหา:** [problem]\n\n🚀 กรุณาเข้าตรวจสอบและรับงานในระบบจัดการใบงาน (LMIS)`;
const DEFAULT_UPDATE_TICKET_TEMPLATE = `⚙️ *อัปเดตสถานะใบงาน: [ticket_no]*\n🔄 **สถานะปัจจุบัน:** [status]\n👤 **ผู้ดำเนินการ:** [technician]\n\nตรวจสอบรายละเอียดหรือพิมพ์ใบงานได้ที่หน้าประวัติการแจ้งซ่อมครับ`;

export default function SystemSettings() {
  const navigate = useNavigate();
  const { token } = useToken();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('system_settings_active_tab') || '1');
  const [fileList, setFileList] = useState([]);
  const [faviconFileList, setFaviconFileList] = useState([]);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [currentFavicon, setCurrentFavicon] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [webhookInfo, setWebhookStatus] = useState({ ngrok_url: null, last_captured_id: null });
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const socketRef = React.useRef(null);
  const [loadingTestLine, setLoadingTestLine] = useState(false);
  const [loadingTestEmail, setLoadingTestEmail] = useState(false);

  const handleTestLine = async () => {
    setLoadingTestLine(true);
    try {
      const r = await axiosInstance.post('/settings/test-line');
      alertSuccess('สำเร็จ', r.data.message);
    } catch (e) {
      alertError('ล้มเหลว', e.response?.data?.error || 'เกิดข้อผิดพลาดในการทดสอบ');
    } finally { setLoadingTestLine(false); }
  };

  const handleTestEmail = async () => {
    setLoadingTestEmail(true);
    try {
      const r = await axiosInstance.post('/settings/test-email');
      alertSuccess('สำเร็จ', r.data.message);
    } catch (e) {
      alertError('ล้มเหลว', e.response?.data?.error || 'เกิดข้อผิดพลาดในการทดสอบ');
    } finally { setLoadingTestEmail(false); }
  };

  const isDarkMode = token.mode === 'dark' || document.body.classList.contains('dark-mode');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/settings');
      if (res.data) {
        const settings = res.data;
        form.setFieldsValue({
          ...settings,
          msg_template_new: settings.msg_template_new || DEFAULT_NEW_TICKET_TEMPLATE,
          msg_template_update: settings.msg_template_update || DEFAULT_UPDATE_TICKET_TEMPLATE,
          default_sla_hours: settings.default_sla_hours ?? 2,
          default_penalty_rate: settings.default_penalty_rate ?? 0.001,
          security_strict_mode: settings.security_strict_mode === 1,
          max_file_size_mb: settings.max_file_size_mb ?? 5,
          allowed_file_types: settings.allowed_file_types ? settings.allowed_file_types.split(',').map(e => e.trim()) : ['jpg', 'jpeg', 'png', 'pdf'],
          admin_email: settings.admin_email ? settings.admin_email.split(',').map(e => e.trim()) : [],
          enable_line: settings.enable_line === 1,
          notify_backup_status: settings.notify_backup_status === 1,
          enable_email: settings.enable_email === 1,
          notify_new_ticket: settings.notify_new_ticket === 1,
          notify_status_change: settings.notify_status_change === 1,
          maintenance_mode: settings.maintenance_mode === 1,
          error_404_active: settings.error_404_active === 1,
          error_500_active: settings.error_500_active === 1,
          sla_hardware_hours: settings.sla_hardware_hours || 6,
          sla_software_hours: settings.sla_software_hours || 6,
          sla_app_hours: settings.sla_app_hours || 12,
          ack_limit_hours: settings.ack_limit_hours || 2,
          theme_mode: settings.theme_mode || 'light',
          primary_color: settings.primary_color || '#1677ff',
          system_font: settings.system_font || 'Inter'
        });
        if (settings.system_logo) setCurrentLogo(settings.system_logo);
        if (settings.system_favicon) setCurrentFavicon(settings.system_favicon);
        const savedScroll = localStorage.getItem('system_settings_scroll_y');
        if (savedScroll) { setTimeout(() => { window.scrollTo({ top: parseInt(savedScroll), behavior: 'smooth' }); }, 500); }
      }
    } catch (error) { alertError('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลการตั้งค่าระบบได้'); } finally { setLoading(false); }
  };

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await axiosInstance.get('/settings/health');
      setHealthData(res.data);
    } catch (error) {} finally { setLoadingHealth(false); }
  };

  const [pollingAttempt, setPollingAttempt] = useState(0);
  const [pollingInterval, setPollingInterval] = useState(10000);

  const fetchWebhookStatus = async (isManual = false) => {
    // ป้องกัน Event Object จาก React เข้ามาเป็น true
    const manual = isManual === true;

    if (manual) {
        setLoadingWebhook(true);
        setPollingAttempt(0); 
        setPollingInterval(10000);
    }
    
    try {
      const res = await axiosInstance.get('/settings/webhook-status');
      setWebhookStatus(res.data);
      
      if (manual) message.success('อัปเดตสถานะ Webhook แล้ว');

      // ถ้าเจอ ID ใหม่ ให้ Reset ระบบกลับมาโหมดเร็ว
      if (res.data.last_captured_id) {
          setPollingAttempt(0);
          setPollingInterval(10000);
      } else {
          setPollingAttempt(prev => prev + 1);
      }
    } catch (err) {
      console.error("Webhook status error:", err);
    } finally {
      if (isManual) setLoadingWebhook(false);
    }
  };

  // จัดการ Dynamic Polling Interval
  useEffect(() => {
    if (pollingAttempt >= 10 && pollingInterval === 10000) {
        console.log('🐌 Entering Power Saving Mode: Polling every 60s');
        setPollingInterval(60000);
    }
  }, [pollingAttempt]);

  useEffect(() => {
    fetchSettings();
    fetchHealth();
    fetchWebhookStatus();

    socketRef.current = io(BACKEND_URL);
    socketRef.current.on('line_id_captured', (data) => {
      setWebhookStatus(prev => ({ ...prev, last_captured_id: data.id }));
      message.success('ตรวจพบ ID ใหม่จาก LINE!');
      setPollingAttempt(0); // Reset on capture
      setPollingInterval(10000);
    });

    const handleScroll = () => { localStorage.setItem('system_settings_scroll_y', window.scrollY); };
    window.addEventListener('scroll', handleScroll);

    // Reset เมื่อกลับมาดูหน้าจอ
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            setPollingAttempt(0);
            setPollingInterval(10000);
            fetchWebhookStatus();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ตัวรัน Polling แยกตาม Interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchWebhookStatus();
      }
    }, pollingInterval);
    return () => clearInterval(interval);
  }, [pollingInterval]);

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const url = URL.createObjectURL(newFileList[0].originFileObj);
      setPreviewUrl(url);
    } else { setPreviewUrl(null); }
  };

  const handleFaviconUploadChange = ({ fileList: newFileList }) => {
    setFaviconFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const url = URL.createObjectURL(newFileList[0].originFileObj);
      setFaviconPreviewUrl(url);
    } else { setFaviconPreviewUrl(null); }
  };

  const handleFinish = async (values) => {
    setSaving(true);
    try {
      const allValues = form.getFieldsValue(true);
      const formData = new FormData();
      Object.keys(allValues).forEach(key => {
        let val = allValues[key];
        if (['security_strict_mode', 'notify_new_ticket', 'notify_status_change', 'enable_line', 'enable_email', 'maintenance_mode', 'error_404_active', 'error_500_active'].includes(key)) val = val ? 1 : 0;
        if ((key === 'admin_email' || key === 'allowed_file_types') && Array.isArray(val)) val = val.join(',');
        if (key === 'primary_color' && typeof val === 'object' && val !== null) val = val.toHexString ? val.toHexString() : val;
        formData.append(key, (val !== undefined && val !== null) ? val : '');
      });
      if (fileList.length > 0 && fileList[0].originFileObj) formData.append('system_logo', fileList[0].originFileObj);
      if (faviconFileList.length > 0 && faviconFileList[0].originFileObj) formData.append('system_favicon', faviconFileList[0].originFileObj);
      const res = await axiosInstance.put('/settings', formData);
      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('system_settings_updated'));
        alertSuccess('บันทึกสำเร็จ', 'อัปเดตการตั้งค่าระบบเรียบร้อยแล้ว');
        setFileList([]); setFaviconFileList([]); setPreviewUrl(null); setFaviconPreviewUrl(null);
        fetchSettings();
      } else { alertError('ไม่สำเร็จ', res.data.message || 'เกิดข้อผิดพลาดในการบันทึก'); }
    } catch (error) { 
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.error || 'ไม่สามารถบันทึกได้';
      alertError('เกิดข้อผิดพลาด', errorMsg); 
    } finally { setSaving(false); }
  };

  const renderGeneralTab = () => (
    <div style={{ padding: '10px 0' }}>
      <Row gutter={[32, 32]}>
        <Col xs={24} lg={12}>
          <div style={{ marginBottom: 32 }}>
            <Title level={5}><FileTextOutlined /> ข้อมูลระบบพื้นฐาน</Title>
            <Divider style={{ margin: '12px 0' }} />
            <Form.Item name="system_name" label="ชื่อระบบ (Browser Title)" rules={[{ required: true }]}><Input size="large" placeholder="เช่น LMIS Big Data" /></Form.Item>
            <Form.Item name="agency_name" label="ชื่อหน่วยงานที่แสดงในระบบ"><Input size="large" placeholder="เช่น บริษัท/หน่วยงานของคุณ" /></Form.Item>
            <Card variant="borderless" style={{ background: isDarkMode ? 'rgba(255, 120, 0, 0.12)' : '#fff7e6', border: `1px solid ${isDarkMode ? '#fa8c16' : '#ffd591'}`, borderRadius: 12 }}>
                <Text strong style={{ color: isDarkMode ? '#ffa940' : '#d46b08' }}><SafetyCertificateOutlined /> ความพร้อมใช้งาน (Availability Control)</Text>
                <Flex justify="space-around" wrap="wrap" gap="middle" style={{ marginTop: 15 }}>
                    <div style={{ textAlign: 'center' }}><Text style={{ fontSize: 12, display: 'block', marginBottom: 8, color: isDarkMode ? '#ffbb96' : 'inherit' }}>ปิดปรับปรุง</Text><Form.Item name="maintenance_mode" valuePropName="checked" noStyle><Switch checkedChildren="ON" unCheckedChildren="OFF" /></Form.Item></div>
                    <div style={{ textAlign: 'center' }}><Text style={{ fontSize: 12, display: 'block', marginBottom: 8, color: isDarkMode ? '#ffbb96' : 'inherit' }}>กลุ่มปัญหาฝั่งผู้ใช้ (4xx)</Text><Form.Item name="error_404_active" valuePropName="checked" noStyle><Switch checkedChildren="ON" unCheckedChildren="OFF" /></Form.Item></div>
                    <div style={{ textAlign: 'center' }}><Text style={{ fontSize: 12, display: 'block', marginBottom: 8, color: isDarkMode ? '#ffbb96' : 'inherit' }}>กลุ่มปัญหาฝั่งระบบ (5xx)</Text><Form.Item name="error_500_active" valuePropName="checked" noStyle><Switch checkedChildren="ON" unCheckedChildren="OFF" /></Form.Item></div>
                </Flex>
                <Divider style={{ margin: '15px 0' }} />
                <Button block icon={<EyeOutlined />} onClick={() => navigate('/error-test?mode=preview')} style={{ borderRadius: 8 }}>พรีวิวหน้า Error ทั้งหมด (2xx, 4xx, 5xx)</Button>
            </Card>
          </div>
          <div>
            <Title level={5}><BgColorsOutlined /> ธีมและการแสดงผล</Title>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16}>
              <Col span={12}><Form.Item name="theme_mode" label="โหมดสีพื้นฐาน"><Radio.Group buttonStyle="solid" style={{ width: '100%' }}><Radio.Button value="light" style={{ width: '50%', textAlign: 'center' }}><BulbOutlined /> Light</Radio.Button><Radio.Button value="dark" style={{ width: '50%', textAlign: 'center' }}><BulbOutlined style={{ color: '#fadb14' }} /> Dark</Radio.Button></Radio.Group></Form.Item></Col>
              <Col span={12}><Form.Item name="primary_color" label="สีหลัก"><ColorPicker showText style={{ width: '100%', justifyContent: 'flex-start' }} /></Form.Item></Col>
              <Col span={24}><Form.Item name="system_font" label="ฟอนต์ระบบ"><Select size="large" suffixIcon={<FontSizeOutlined />}><Select.Option value="Inter">Inter (Standard)</Select.Option><Select.Option value="Sarabun">Sarabun (ทางการ)</Select.Option><Select.Option value="Kanit">Kanit (ทันสมัย)</Select.Option><Select.Option value="Prompt">Prompt (สะอาดตา)</Select.Option></Select></Form.Item></Col>
            </Row>
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div style={{ background: token.colorBgContainer, padding: 24, borderRadius: 20, border: `1px solid ${token.colorBorderSecondary}` }}>
            <Title level={5}><PictureOutlined /> สื่อและอัตลักษณ์</Title>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ marginBottom: 32 }}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>โลโก้ระบบ</Text>
              <Flex align="start" gap="large">
                <div style={{ textAlign: 'center', width: 120 }}><div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgContainer, borderRadius: 12, border: `1px dashed ${token.colorBorder}`, padding: 8, marginBottom: 8 }}>{(previewUrl || currentLogo) ? (<img src={previewUrl || `${BACKEND_URL}/uploads/${currentLogo}`} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />) : <PictureOutlined style={{ fontSize: 32, color: token.colorTextQuaternary }} />}</div></div>
                <div style={{ paddingTop: 10 }}><Upload beforeUpload={() => false} showUploadList={false} onChange={handleUploadChange} maxCount={1} accept="image/*"><Button icon={<UploadOutlined />} size="large">อัปโหลดโลโก้</Button></Upload></div>
              </Flex>
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>Favicon</Text>
              <Flex align="start" gap="large">
                <div style={{ textAlign: 'center', width: 64 }}><div style={{ height: 64, width: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgContainer, borderRadius: 8, border: `1px dashed ${token.colorBorder}`, padding: 4, marginBottom: 8 }}>{(faviconPreviewUrl || currentFavicon) ? (<img src={faviconPreviewUrl || `${BACKEND_URL}/uploads/${currentFavicon}`} alt="Favicon" style={{ width: 32, height: 32 }} />) : <RocketOutlined style={{ fontSize: 24, color: token.colorTextQuaternary }} />}</div></div>
                <div style={{ paddingTop: 4 }}><Upload beforeUpload={() => false} showUploadList={false} onChange={handleFaviconUploadChange} maxCount={1} accept="image/x-icon,image/png"><Button icon={<UploadOutlined />} size="middle">เปลี่ยน Favicon</Button></Upload></div>
              </Flex>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  const renderSecurityTab = () => (
    <div style={{ padding: '10px 0' }}>
      <Title level={5}><FileProtectOutlined /> ความปลอดภัยและข้อกำหนดไฟล์</Title>
      <Divider style={{ margin: '12px 0' }} />
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Form.Item name="security_strict_mode" label="Strict Security Mode (ตรวจสอบไฟล์เข้มงวด)" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="max_file_size_mb" label="ขนาดไฟล์สูงสุดที่อนุญาต (MB)"><InputNumber min={1} max={100} size="large" style={{ width: '100%' }} /></Form.Item>
        </Col>
        <Col xs={24} md={12}><Form.Item name="allowed_file_types" label="นามสกุลไฟล์ที่อนุญาต (คั่นด้วยคอมม่า)"><Select mode="tags" size="large" style={{ width: '100%' }} tokenSeparators={[',']} placeholder="เช่น jpg, png, pdf" /></Form.Item></Col>
      </Row>
    </div>
  );

  const renderNotificationTab = () => (
    <div style={{ padding: '10px 0' }}>
      <Row gutter={[32, 32]}>
        <Col xs={24} lg={12}>
          <Title level={5}><BellOutlined /> การแจ้งเตือนและข้อความ</Title>
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item name="notify_backup_status" label="แจ้งเตือนผลการสำรองข้อมูลอัตโนมัติ" valuePropName="checked"><Switch checkedChildren="เปิด" unCheckedChildren="ปิด" /></Form.Item>
          <Form.Item name="notify_new_ticket" label="แจ้งเตือนเมื่อมีใบงานใหม่" valuePropName="checked"><Switch checkedChildren="เปิด" unCheckedChildren="ปิด" /></Form.Item>
          <Form.Item name="notify_status_change" label="แจ้งเตือนเมื่อมีการเปลี่ยนสถานะใบงาน" valuePropName="checked"><Switch checkedChildren="เปิด" unCheckedChildren="ปิด" /></Form.Item>
          <Divider style={{ margin: '24px 0 12px 0' }} /><Title level={5}><EditOutlined /> รูปแบบข้อความแจ้งเตือน (Templates)</Title>
          <Form.Item name="msg_template_new" label="ข้อความแจ้งใบงานใหม่"><TemplateEditor placeholder="รองรับตัวแปร [ticket_no], [category], [problem], [priority], [created_at]" variables={[{ key: '[ticket_no]', label: 'เลขที่ใบงาน' }, { key: '[category]', label: 'หมวดหมู่/ระบบ' }, { key: '[problem]', label: 'รายละเอียดปัญหา' }, { key: '[priority]', label: 'ระดับความสำคัญ' }, { key: '[created_at]', label: 'วัน-เวลาที่แจ้ง' }, { key: '[agency]', label: 'หน่วยงานผู้แจ้ง' }]} /></Form.Item>
          <Form.Item name="msg_template_update" label="ข้อความอัปเดตสถานะ"><TemplateEditor placeholder="รองรับตัวแปร [ticket_no], [status], [technician], [update_details]" variables={[{ key: '[ticket_no]', label: 'เลขที่ใบงาน' }, { key: '[status]', label: 'สถานะปัจจุบัน' }, { key: '[technician]', label: 'ชื่อผู้ดำเนินการ' }, { key: '[update_details]', label: 'หมายเหตุการอัปเดต' }, { key: '[updated_at]', label: 'วัน-เวลาที่อัปเดต' }]} /></Form.Item>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span><MessageOutlined style={{ color: '#00c300' }}/> LINE API & Webhook</span>} size="small" style={{ marginBottom: 20 }}>
            <Form.Item name="enable_line" label="เปิดใช้งาน LINE" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="line_notify_token" label="Channel Access Token"><Input.Password /></Form.Item>
            <Form.Item name="line_group_id" label="Group ID / User ID (สำหรับแจ้งเตือน)"><Input placeholder="ใส่ ID ของกลุ่มหรือบอท" /></Form.Item>
            <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.2)' : token.colorFillAlter, padding: 15, borderRadius: 8, marginTop: 15, border: isDarkMode ? '1px solid #333' : 'none' }}>
                <Title level={5} style={{ fontSize: 14 }}><ApiOutlined /> Webhook Configuration (Capture Group ID)</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>ใช้โดเมนจริงของคุณเพื่อสร้าง Webhook สำหรับดึง Group ID จาก LINE Messaging API</Text>
                <div style={{ marginTop: 10 }}>
                    <Alert type="info" title="Webhook URL สำหรับ LINE" description={<div><Text copyable strong>https://ma-bigdata.mol.go.th/api/line/webhook</Text><br/><Text style={{ fontSize: 12 }} type="secondary">นำ URL นี้ไปใส่ใน LINE Developers &gt; Messaging API &gt; Webhook URL</Text></div>} style={{ marginBottom: 10 }} />
                    <Flex gap="small">
                        <Button type="primary" ghost block icon={<SyncOutlined />} onClick={fetchWebhookStatus} loading={loadingWebhook}>ตรวจสอบสถานะ (Verify)</Button>
                        <Button danger ghost block onClick={handleResetWebhook} loading={loadingWebhook}>ล้างค่า ID (Reset)</Button>
                    </Flex>
                </div>
                <div style={{ marginTop: 15, padding: 10, background: token.colorBgContainer, borderRadius: 6, border: `1px dashed ${token.colorBorder}` }}>
                    <Text strong style={{ fontSize: 12 }}>ID ล่าสุดที่จับได้ (Group/User):</Text>
                    <div style={{ marginTop: 5 }}>
                        {webhookInfo.last_captured_id ? (<Tag color="blue" style={{ fontSize: 14, padding: '4px 10px', width: '100%', textAlign: 'center' }} icon={<LinkOutlined />}><Text copyable>{webhookInfo.last_captured_id}</Text></Tag>) : <Text type="secondary" italic style={{ fontSize: 12 }}>รอรับข้อมูลจาก LINE Webhook...</Text>}
                    </div>
                </div>
            </div>
            <Divider /><Button type="dashed" size="small" block loading={loadingTestLine} onClick={handleTestLine}>ทดสอบส่งข้อความเข้า LINE</Button>
          </Card>
          <Card title={<span><MailOutlined style={{ color: '#1890ff' }}/> Email SMTP</span>} size="small">
            <Form.Item name="enable_email" label="เปิดใช้งาน Email" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="smtp_host" label="Host"><Input /></Form.Item>
            <Row gutter={8}>
              <Col span={12}><Form.Item name="smtp_user" label="User"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="smtp_pass" label="Pass"><Input.Password /></Form.Item></Col>
            </Row>
            <Form.Item name="admin_email" label="อีเมลผู้รับแจ้ง (Tags)"><Select mode="tags" style={{ width: '100%' }} /></Form.Item>
            <Button type="dashed" size="small" block loading={loadingTestEmail} onClick={handleTestEmail}>ทดสอบส่ง Email</Button>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const [isHealthModalVisible, setIsHealthModalVisible] = useState(false);
  const renderHealthTab = () => {
    if (!healthData) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" description="กำลังรวบรวมข้อมูลระดับโลก..." /></div>;
    const getStatusStyle = (status) => {
      switch(status) {
        case 'OPTIMIZED': return { bg: 'linear-gradient(to right, #108ee9 0%, #87d068 100%)', shadow: 'rgba(16, 142, 233, 0.3)', label: 'สมบูรณ์แบบ' };
        case 'HEALTHY': return { bg: 'linear-gradient(to right, #00b4d8 0%, #0077b6 100%)', shadow: 'rgba(0, 180, 216, 0.3)', label: 'ปกติ' };
        case 'WARNING': return { bg: 'linear-gradient(to right, #f59e0b 0%, #d97706 100%)', shadow: 'rgba(245, 158, 11, 0.3)', label: 'ควรเฝ้าระวัง' };
        case 'CRITICAL': return { bg: 'linear-gradient(to right, #ef4444 0%, #991b1b 100%)', shadow: 'rgba(239, 68, 68, 0.3)', label: 'วิกฤต' };
        default: return { bg: 'linear-gradient(to right, #6b7280 0%, #374151 100%)', shadow: 'rgba(107, 114, 128, 0.3)', label: 'ไม่ทราบสถานะ' };
      }
    };
    const statusStyle = getStatusStyle(healthData.status);
    const stackItems = [
      { name: 'React', version: '19.2.4', icon: <CodeOutlined style={{ color: '#61dafb' }} />, desc: 'Frontend Framework' },
      { name: 'Ant Design', version: '6.3.3', icon: <AppstoreOutlined style={{ color: '#1890ff' }} />, desc: 'UI Component Library' },
      { name: 'Vite', version: '8.0.1', icon: <RocketOutlined style={{ color: '#646cff' }} />, desc: 'Build Tool & Dev Server' },
      { name: 'Express', version: '5.2.1', icon: <CloudServerOutlined style={{ color: '#ffffff', background: '#000', borderRadius: '50%', padding: 2 }} />, desc: 'Backend API Engine' },
      { name: 'MySQL', version: healthData.database.version, icon: <DatabaseOutlined style={{ color: '#00758f' }} />, desc: 'Relational Database' },
      { name: 'Node.js', version: healthData.node_version, icon: <CodeOutlined style={{ color: '#339933' }} />, desc: 'Server Runtime' }
    ];
    return (
      <div style={{ padding: '10px 0' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}><Title level={4} style={{ margin: 0 }}><SafetyCertificateOutlined /> System Infrastructure Monitor</Title><Button icon={<SyncOutlined />} onClick={fetchHealth} loading={loadingHealth} type="primary">Refresh Status</Button></Flex>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title={<span><DesktopOutlined /> Server Hardware & OS</span>} size="small" variant="borderless" style={{ boxShadow: token.boxShadowTertiary, borderRadius: 12 }}>
               <Row gutter={[24, 24]}>
                  <Col span={8}><Statistic title="OS Platform" value={healthData.os.platform.toUpperCase()} prefix={<GlobalOutlined />} /><Text type="secondary" style={{ fontSize: 12 }}>{healthData.os.release}</Text></Col>
                  <Col span={8}><Statistic title="CPU Cores" value={healthData.os.cpus} suffix="Cores" prefix={<HddOutlined />} /></Col>
                  <Col span={8}><Statistic title="System Uptime" value={healthData.os.uptime} prefix={<ClockCircleOutlined />} /></Col>
                  <Col span={24}><Divider style={{ margin: '12px 0' }} />
                    <div style={{ marginBottom: 16 }}><Text strong><DatabaseOutlined /> Storage Drive (C:)</Text><Flex align="center" gap="middle" style={{ marginTop: 6 }}><Progress percent={healthData.os.disk.used_percent} status={healthData.os.disk.used_percent > 90 ? 'exception' : 'active'} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} /><Text style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{healthData.os.disk.free} free of {healthData.os.disk.total}</Text></Flex></div>
                    <Text strong><HddOutlined /> Physical Memory (RAM)</Text><Flex align="center" gap="middle" style={{ marginTop: 6 }}><Progress percent={parseFloat(((1 - (parseFloat(healthData.os.free_mem) / parseFloat(healthData.os.total_mem))) * 100).toFixed(1))} status="active" strokeColor={{ '0%': '#3b82f6', '100%': '#2dd4bf' }} /><Text style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{healthData.os.free_mem} free of {healthData.os.total_mem}</Text></Flex>
                  </Col>
               </Row>
            </Card>
            <Card title={<span><CodeOutlined /> Application Stack Information</span>} size="small" variant="borderless" style={{ marginTop: 16, boxShadow: token.boxShadowTertiary, borderRadius: 12 }}><Row gutter={[12, 12]}>{stackItems.map(item => (<Col xs={12} md={8} key={item.name}><div style={{ padding: 12, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f5', borderRadius: 8, textAlign: 'center', height: '100%' }}><div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div><Text strong style={{ display: 'block' }}>{item.name}</Text><Tag color="blue" style={{ marginTop: 4 }}>v{item.version}</Tag><br/><Text type="secondary" style={{ fontSize: 10 }}>{item.desc}</Text></div></Col>))}</Row></Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title={<span><DatabaseOutlined /> Database & Services</span>} size="small" variant="borderless" style={{ boxShadow: token.boxShadowTertiary, borderRadius: 12 }}><Descriptions column={1} size="small" bordered><Descriptions.Item label="DB Status"><Tag color="success" icon={<CheckCircleOutlined />}>ONLINE</Tag></Descriptions.Item><Descriptions.Item label="MySQL Version">{healthData.database.version.split('-')[0]}</Descriptions.Item><Descriptions.Item label="Connection Pool">{healthData.database.pool_limit} Connections</Descriptions.Item><Descriptions.Item label="Backend PID">{healthData.process.pid}</Descriptions.Item><Descriptions.Item label="Heap Memory">{healthData.process.memory_usage}</Descriptions.Item></Descriptions><Divider style={{ margin: '16px 0' }} /><Title level={5} style={{ fontSize: 14 }}><SafetyOutlined /> Directory Permissions</Title>{healthData.folders.map(f => (<div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '4px 8px', background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fafafa', borderRadius: 4 }}><Text style={{ fontSize: 13 }}>/{f.name}</Text><Tag color={f.status === 'Writable' ? 'success' : 'error'} size="small">{f.status}</Tag></div>))}</Card>
            <Card style={{ marginTop: 16, textAlign: 'center', background: statusStyle.bg, borderRadius: 16, border: 'none', boxShadow: `0 10px 20px -5px ${statusStyle.shadow}`, overflow: 'hidden', transition: 'all 0.5s ease' }} styles={{ body: { padding: '20px 16px' } }}><div style={{ background: 'linear-gradient(to right, #108ee9 0%, #87d068 100%)', padding: 20, borderRadius: 12, marginBottom: 16, boxShadow: '0 4px 15px rgba(16, 142, 233, 0.3)' }}><Statistic title={<Flex align="center" justify="center" gap={4}><div style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>ความสมบูรณ์ของระบบโดยรวม ({healthData.score}%)</div><Button type="text" icon={<QuestionCircleOutlined style={{ color: '#ffffff', fontSize: '14px' }} />} size="small" onClick={() => setIsHealthModalVisible(true)} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }} /></Flex>} value={healthData.status} styles={{ content: { color: '#ffffff', fontWeight: 900, fontSize: 32, textShadow: '0 2px 10px rgba(0,0,0,0.4)', letterSpacing: '1.5px' } }} prefix={<SafetyCertificateOutlined style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', fontSize: '28px' }} />} /><div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px', marginTop: 8, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}><Text style={{ color: '#ffffff' }}>สถานะ: {statusStyle.label}</Text><br /><SyncOutlined spin style={{ marginRight: 6 }} /> ตรวจสอบล่าสุดเมื่อ: {healthData.server_time}</div></div></Card>
          </Col>
        </Row>
        <Modal title={<Flex align="center" gap={12}><InfoCircleOutlined style={{ color: token.colorPrimary }} /><span>เกณฑ์การประเมินสุขภาพระบบ (5 มิติหลัก)</span></Flex>} open={isHealthModalVisible} onCancel={() => setIsHealthModalVisible(false)} footer={[<Button key="close" type="primary" onClick={() => setIsHealthModalVisible(false)}>เข้าใจแล้ว</Button>]} width={650} centered>
          <div style={{ padding: '8px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 24, padding: 20, background: statusStyle.bg, borderRadius: 16, boxShadow: `0 8px 20px ${statusStyle.shadow}` }}><Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>คะแนนวิเคราะห์รวม</Text><div style={{ color: '#fff', fontSize: 48, fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{healthData.score}%</div><Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10 }}>สถานะ: {statusStyle.label}</Tag></div>
            <Title level={5} style={{ color: token.colorPrimary, marginBottom: 16 }}><SafetyOutlined /> ผลลัพธ์การตรวจสอบ 5 ด้านหลัก</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{[ { title: '1. ฐานข้อมูล (Database - 30%)', sub: 'MySQL Connectivity & Pool', score: healthData.score_details.database, max: 30 }, { title: '2. พื้นที่เก็บข้อมูล (Disk - 20%)', sub: 'พื้นที่ว่างใน Drive C:', score: healthData.score_details.disk, max: 20 }, { title: '3. หน่วยความจำ (Memory - 20%)', sub: 'ปริมาณ RAM คงเหลือ', score: healthData.score_details.memory, max: 20 }, { title: '4. ระบบไฟล์ (File System - 20%)', sub: 'สิทธิ์การเขียนโฟลเดอร์สำรองข้อมูล', score: healthData.score_details.folders, max: 20 }, { title: '5. เสถียรภาพโปรเซส (Process - 10%)', sub: 'Node.js Heap Memory Usage', score: healthData.score_details.process, max: 10 } ].map((item, i) => (<div key={i} style={{ background: '#f8fafc', padding: '10px 16px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><Text strong style={{ fontSize: 13 }}>{item.title}</Text><br/><Text type="secondary" style={{ fontSize: 11 }}>{item.sub}</Text></div><Tag color={item.score >= (item.max * 0.8) ? 'success' : (item.score >= (item.max * 0.5) ? 'warning' : 'error')} style={{ minWidth: 60, textAlign: 'center', fontWeight: 'bold' }}>{item.score} / {item.max}</Tag></div>))}</div>
            <Divider style={{ margin: '20px 0' }} /><Title level={5} style={{ color: token.colorWarning, marginBottom: 12, fontSize: 14 }}>เกณฑ์ระดับสถานะ</Title>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}><div style={{ padding: '6px 10px', background: 'linear-gradient(to right, #108ee9 0%, #87d068 100%)', borderRadius: 8, color: '#fff', fontSize: 10 }}><Text strong style={{ color: '#fff', fontSize: 11 }}>💎 OPTIMIZED (90-100%)</Text></div><div style={{ padding: '6px 10px', background: 'linear-gradient(to right, #00b4d8 0%, #0077b6 100%)', borderRadius: 8, color: '#fff', fontSize: 10 }}><Text strong style={{ color: '#fff', fontSize: 11 }}>✅ HEALTHY (70-89%)</Text></div><div style={{ padding: '6px 10px', background: 'linear-gradient(to right, #f59e0b 0%, #d97706 100%)', borderRadius: 8, color: '#fff', fontSize: 10 }}><Text strong style={{ color: '#fff', fontSize: 11 }}>⚠️ WARNING (40-69%)</Text></div><div style={{ padding: '6px 10px', background: 'linear-gradient(to right, #ef4444 0%, #991b1b 100%)', borderRadius: 8, color: '#fff', fontSize: 10 }}><Text strong style={{ color: '#fff', fontSize: 11 }}>🚨 CRITICAL (0-39%)</Text></div></div>
          </div>
        </Modal>
      </div>
    );
  };

  const tabItems = [
    { key: '1', label: <span><SettingOutlined /> ข้อมูลทั่วไป</span>, children: renderGeneralTab() },
    { key: '2', label: <span><BellOutlined /> การแจ้งเตือน</span>, children: renderNotificationTab() },
    { key: '3', label: <span><FileProtectOutlined /> ความปลอดภัย</span>, children: renderSecurityTab() },
    { key: '5', label: <span><ClockCircleOutlined /> SLA & Policies</span>, children: (<div style={{ padding: '10px 0' }}><Title level={5}><ClockCircleOutlined /> ระยะเวลา SLA ตามประเภทงาน (ชั่วโมง)</Title><Divider style={{ margin: '12px 0' }} /><Row gutter={[16, 16]}><Col xs={24} md={8}><Card size="small" title="💻 Hardware"><Form.Item name="sla_hardware_hours" noStyle><InputNumber size="large" style={{ width: '100%' }} /></Form.Item></Card></Col><Col xs={24} md={8}><Card size="small" title="💿 Software"><Form.Item name="sla_software_hours" noStyle><InputNumber size="large" style={{ width: '100%' }} /></Form.Item></Card></Col><Col xs={24} md={8}><Card size="small" title="🌐 Application"><Form.Item name="sla_app_hours" noStyle><InputNumber size="large" style={{ width: '100%' }} /></Form.Item></Card></Col></Row><Divider style={{ margin: '24px 0' }} /><Row gutter={16}><Col span={12}><Form.Item name="default_sla_hours" label="เวลา SLA มาตรฐาน (ถ้าไม่ระบุตามกลุ่ม)"><InputNumber size="large" style={{ width: '100%' }} /></Form.Item></Col><Col span={12}><Form.Item name="ack_limit_hours" label="เวลาตอบรับเคส (ชม.)"><InputNumber size="large" style={{ width: '100%' }} /></Form.Item></Col><Col span={24}><Form.Item name="default_penalty_rate" label="อัตราค่าปรับต่อวัน (เช่น 0.0010)"><InputNumber size="large" step={0.0001} precision={4} style={{ width: '100%' }} /></Form.Item></Col></Row></div>)},
    { key: '9', label: <span><SecurityScanOutlined /> System Health</span>, children: renderHealthTab() }
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: token.colorBgLayout, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}><div style={{ padding: 8, background: token.colorPrimary, borderRadius: 8 }}><SettingOutlined style={{ fontSize: 24, color: token.colorTextLightSolid }} /></div><Title level={2} style={{ margin: 0 }}>ตั้งค่าระบบ</Title></div>
      <Card style={{ borderRadius: 16, boxShadow: token.boxShadowTertiary, border: 'none' }}><Spin spinning={loading}><Form form={form} layout="vertical" onFinish={handleFinish}><Tabs items={tabItems} size="large" style={{ marginBottom: 24 }} activeKey={activeTab} onChange={(key) => { setActiveTab(key); localStorage.setItem('system_settings_active_tab', key); }} /><Divider style={{ margin: '0 0 24px 0' }} /><div style={{ textAlign: 'right' }}><Space size="middle"><Button size="large" onClick={() => fetchSettings()}>ยกเลิก</Button><Button type="primary" size="large" htmlType="submit" icon={<SaveOutlined />} loading={saving} style={{ borderRadius: 8, padding: '0 32px' }}>บันทึกการตั้งค่า</Button></Space></div></Form></Spin></Card>
    </div>
  );
}
