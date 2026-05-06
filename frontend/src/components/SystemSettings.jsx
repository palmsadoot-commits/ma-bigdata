import React, { useState, useEffect } from 'react';
import { 
  SettingOutlined, 
  SaveOutlined, 
  MessageOutlined, 
  MailOutlined, 
  ClockCircleOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SyncOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  PictureOutlined,
  BulbOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  BellOutlined,
  FileProtectOutlined,
  EditOutlined,
  GlobalOutlined,
  LinkOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
  CodeOutlined,
  SafetyOutlined,
  DesktopOutlined,
  HddOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Form, Input, Button, Row, Col, Typography, InputNumber, Divider, Upload, Space, Spin, Switch, Tag, Select, Radio, ColorPicker, theme, message, Alert, Flex, Progress, Descriptions, Statistic } from 'antd';
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError } from '../utils/alert';
import { API_BASE_URL } from '../utils/config';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;
const BACKEND_URL = API_BASE_URL;

const DEFAULT_NEW_TICKET_TEMPLATE = `🔔 *มีใบงานแจ้งซ่อมใหม่: [ticket_no]*
📌 **ระบบ/หมวดหมู่:** [category]
📝 **รายละเอียดปัญหา:** [problem]

🚀 กรุณาเข้าตรวจสอบและรับงานในระบบจัดการใบงาน (LMIS)`;

const DEFAULT_UPDATE_TICKET_TEMPLATE = `⚙️ *อัปเดตสถานะใบงาน: [ticket_no]*
🔄 **สถานะปัจจุบัน:** [status]
👤 **ผู้ดำเนินการ:** [technician]

ตรวจสอบรายละเอียดหรือพิมพ์ใบงานได้ที่หน้าประวัติการแจ้งซ่อมครับ`;

export default function SystemSettings() {
  const navigate = useNavigate();
  const { token } = useToken();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Tab Persistence
  const [activeTab, setActiveTab] = useState(localStorage.getItem('system_settings_active_tab') || '1');
  
  const [fileList, setFileList] = useState([]);
  const [faviconFileList, setFaviconFileList] = useState([]);
  
  const [currentLogo, setCurrentLogo] = useState(null);
  const [currentFavicon, setCurrentFavicon] = useState(null);
  
  const [previewUrl, setPreviewUrl] = useState(null);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState(null);
  
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Webhook & Ngrok states
  const [webhookInfo, setWebhookStatus] = useState({ ngrok_url: null, last_captured_id: null });
  const [loadingWebhook, setLoadingWebhook] = useState(false);

  // Test notification states
  const [loadingTestLine, setLoadingTestLine] = useState(false);
  const [loadingTestEmail, setLoadingTestEmail] = useState(false);

  const handleTestLine = async () => {
    setLoadingTestLine(true);
    try {
      const r = await axiosInstance.post('/settings/test-line');
      alertSuccess('สำเร็จ', r.data.message);
    } catch (e) {
      alertError('ล้มเหลว', e.response?.data?.error || 'เกิดข้อผิดพลาดในการทดสอบ');
    } finally {
      setLoadingTestLine(false);
    }
  };

  const handleTestEmail = async () => {
    setLoadingTestEmail(true);
    try {
      const r = await axiosInstance.post('/settings/test-email');
      alertSuccess('สำเร็จ', r.data.message);
    } catch (e) {
      alertError('ล้มเหลว', e.response?.data?.error || 'เกิดข้อผิดพลาดในการทดสอบ');
    } finally {
      setLoadingTestEmail(false);
    }
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
          notify_backup_status: settings.notify_backup_status === 1, // ✅ เพิ่มฟิลด์ใหม่
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
          system_font: settings.system_font || 'Inter',
          ngrok_authtoken: settings.ngrok_authtoken || ''
        });
        
        if (settings.system_logo) setCurrentLogo(settings.system_logo);
        if (settings.system_favicon) setCurrentFavicon(settings.system_favicon);

        // Restore scroll position
        const savedScroll = localStorage.getItem('system_settings_scroll_y');
        if (savedScroll) {
          setTimeout(() => {
            window.scrollTo({ top: parseInt(savedScroll), behavior: 'smooth' });
          }, 500);
        }
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
      alertError('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลการตั้งค่าระบบได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await axiosInstance.get('/settings/health');
      setHealthData(res.data);
    } catch (error) {
      console.error("Fetch health error:", error);
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchWebhookStatus = async () => {
    try {
      const res = await axiosInstance.get('/settings/webhook-status');
      setWebhookStatus(res.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchSettings();
    fetchHealth();
    fetchWebhookStatus();

    const handleScroll = () => {
      localStorage.setItem('system_settings_scroll_y', window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);

    const interval = setInterval(fetchWebhookStatus, 5000); 
    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleStartNgrok = async () => {
    setLoadingWebhook(true);
    try {
      const authtoken = form.getFieldValue('ngrok_authtoken');
      if (!authtoken) {
        alertError('กรุณาใส่ Authtoken', 'คุณต้องใส่ Authtoken ก่อนกดเริ่มทำงาน');
        setLoadingWebhook(false);
        return;
      }
      const res = await axiosInstance.post('/settings/ngrok/start', { authtoken });
      setWebhookStatus(prev => ({ ...prev, ngrok_url: res.data.url }));
      alertSuccess('Ngrok เริ่มทำงานแล้ว!', 'กรุณานำ URL ไปใส่ใน LINE Developers Console');
    } catch (err) {
      const backendError = err.response?.data;
      alertError('เริ่ม Ngrok ไม่สำเร็จ', backendError?.tip || backendError?.details || 'กรุณาตรวจสอบความถูกต้องของ Token');
    } finally {
      setLoadingWebhook(false);
    }
  };

  const handleStopNgrok = async () => {
    setLoadingWebhook(true);
    try {
      await axiosInstance.post('/settings/ngrok/stop');
      setWebhookStatus(prev => ({ ...prev, ngrok_url: null }));
      message.info('หยุดการเชื่อมต่อ Ngrok แล้ว');
    } catch (err) {
      alertError('หยุด Ngrok ไม่สำเร็จ');
    } finally {
      setLoadingWebhook(false);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const url = URL.createObjectURL(newFileList[0].originFileObj);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFaviconUploadChange = ({ fileList: newFileList }) => {
    setFaviconFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const url = URL.createObjectURL(newFileList[0].originFileObj);
      setFaviconPreviewUrl(url);
    } else {
      setFaviconPreviewUrl(null);
    }
  };

  const handleFinish = async (values) => {
    setSaving(true);
    try {
      // ดึงค่าทั้งหมดจากฟอร์ม (รวมถึงฟิลด์ที่ซ่อนอยู่ใน Tab อื่นด้วย)
      const allValues = form.getFieldsValue(true);
      const formData = new FormData();
      
      Object.keys(allValues).forEach(key => {
        let val = allValues[key];
        
        // จัดการ Boolean/Switch
        if (['security_strict_mode', 'notify_new_ticket', 'notify_status_change', 'enable_line', 'enable_email', 'maintenance_mode', 'error_404_active', 'error_500_active'].includes(key)) {
          val = val ? 1 : 0;
        }
        
        // จัดการ Array (Tags)
        if ((key === 'admin_email' || key === 'allowed_file_types') && Array.isArray(val)) {
          val = val.join(',');
        }
        
        // จัดการ ColorPicker
        if (key === 'primary_color' && typeof val === 'object' && val !== null) {
          val = val.toHexString ? val.toHexString() : val;
        }

        // ตรวจสอบและส่งค่า (ถ้าเป็น undefined ให้ส่งเป็นค่าว่าง หรือค่าเดิม)
        formData.append(key, (val !== undefined && val !== null) ? val : '');
      });

      // จัดการไฟล์โลโก้และ Favicon
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('system_logo', fileList[0].originFileObj);
      }
      if (faviconFileList.length > 0 && faviconFileList[0].originFileObj) {
        formData.append('system_favicon', faviconFileList[0].originFileObj);
      }

      const res = await axiosInstance.put('/settings', formData);
      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('system_settings_updated'));
        alertSuccess('บันทึกสำเร็จ', 'อัปเดตการตั้งค่าระบบเรียบร้อยแล้ว');
        setFileList([]); setFaviconFileList([]); setPreviewUrl(null); setFaviconPreviewUrl(null);
        fetchSettings();
      } else {
        alertError('ไม่สำเร็จ', res.data.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) { 
      console.error("Save settings error:", error);
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
            <Form.Item name="system_name" label="ชื่อระบบ (Browser Title)" rules={[{ required: true }]}>
              <Input size="large" placeholder="เช่น LMIS Big Data" />
            </Form.Item>
            <Form.Item name="agency_name" label="ชื่อหน่วยงานที่แสดงในระบบ">
              <Input size="large" placeholder="เช่น บริษัท/หน่วยงานของคุณ" />
            </Form.Item>
            
            <Card 
              variant="borderless" 
              style={{ 
                background: isDarkMode ? 'rgba(255, 120, 0, 0.12)' : '#fff7e6', 
                border: `1px solid ${isDarkMode ? '#fa8c16' : '#ffd591'}`, 
                borderRadius: 12 
              }}
            >
                <Text strong style={{ color: isDarkMode ? '#ffa940' : '#d46b08' }}><SafetyCertificateOutlined /> ความพร้อมใช้งาน (Availability Control)</Text>
                <Flex justify="space-around" wrap="wrap" gap="middle" style={{ marginTop: 15 }}>
                    <div style={{ textAlign: 'center' }}>
                        <Text style={{ fontSize: 12, display: 'block', marginBottom: 8, color: isDarkMode ? '#ffbb96' : 'inherit' }}>ปิดปรับปรุง</Text>
                        <Form.Item name="maintenance_mode" valuePropName="checked" noStyle>
                            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                        </Form.Item>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Text style={{ fontSize: 12, display: 'block', marginBottom: 8, color: isDarkMode ? '#ffbb96' : 'inherit' }}>กลุ่มปัญหาฝั่งผู้ใช้ (4xx)</Text>
                        <Form.Item name="error_404_active" valuePropName="checked" noStyle>
                            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                        </Form.Item>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Text style={{ fontSize: 12, display: 'block', marginBottom: 8, color: isDarkMode ? '#ffbb96' : 'inherit' }}>กลุ่มปัญหาฝั่งระบบ (5xx)</Text>
                        <Form.Item name="error_500_active" valuePropName="checked" noStyle>
                            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                        </Form.Item>
                    </div>
                </Flex>
                <Divider style={{ margin: '15px 0' }} />
                <Button 
                  block 
                  icon={<EyeOutlined />} 
                  onClick={() => navigate('/error-test?mode=preview')}
                  style={{ borderRadius: 8 }}
                >
                  พรีวิวหน้า Error ทั้งหมด (2xx, 4xx, 5xx)
                </Button>
            </Card>
          </div>
          <div>
            <Title level={5}><BgColorsOutlined /> ธีมและการแสดงผล</Title>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="theme_mode" label="โหมดสีพื้นฐาน">
                  <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                    <Radio.Button value="light" style={{ width: '50%', textAlign: 'center' }}><BulbOutlined /> Light</Radio.Button>
                    <Radio.Button value="dark" style={{ width: '50%', textAlign: 'center' }}><BulbOutlined style={{ color: '#fadb14' }} /> Dark</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="primary_color" label="สีหลัก">
                  <ColorPicker showText style={{ width: '100%', justifyContent: 'flex-start' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="system_font" label="ฟอนต์ระบบ">
                  <Select size="large" suffixIcon={<FontSizeOutlined />}>
                    <Select.Option value="Inter">Inter (Standard)</Select.Option>
                    <Select.Option value="Sarabun">Sarabun (ทางการ)</Select.Option>
                    <Select.Option value="Kanit">Kanit (ทันสมัย)</Select.Option>
                    <Select.Option value="Prompt">Prompt (สะอาดตา)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
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
                <div style={{ textAlign: 'center', width: 120 }}>
                  <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgContainer, borderRadius: 12, border: `1px dashed ${token.colorBorder}`, padding: 8, marginBottom: 8 }}>
                    {(previewUrl || currentLogo) ? (
                      <img src={previewUrl || `${BACKEND_URL}/uploads/${currentLogo}`} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : <PictureOutlined style={{ fontSize: 32, color: token.colorTextQuaternary }} />}
                  </div>
                </div>
                <div style={{ paddingTop: 10 }}>
                  <Upload beforeUpload={() => false} showUploadList={false} onChange={handleUploadChange} maxCount={1} accept="image/*">
                    <Button icon={<UploadOutlined />} size="large">อัปโหลดโลโก้</Button>
                  </Upload>
                </div>
              </Flex>
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>Favicon</Text>
              <Flex align="start" gap="large">
                <div style={{ textAlign: 'center', width: 64 }}>
                  <div style={{ height: 64, width: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgContainer, borderRadius: 8, border: `1px dashed ${token.colorBorder}`, padding: 4, marginBottom: 8 }}>
                    {(faviconPreviewUrl || currentFavicon) ? (
                      <img src={faviconPreviewUrl || `${BACKEND_URL}/uploads/${currentFavicon}`} alt="Favicon" style={{ width: 32, height: 32 }} />
                    ) : <RocketOutlined style={{ fontSize: 24, color: token.colorTextQuaternary }} />}
                  </div>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <Upload beforeUpload={() => false} showUploadList={false} onChange={handleFaviconUploadChange} maxCount={1} accept="image/x-icon,image/png">
                    <Button icon={<UploadOutlined />} size="middle">เปลี่ยน Favicon</Button>
                  </Upload>
                </div>
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
          <Form.Item name="security_strict_mode" label="Strict Security Mode (ตรวจสอบไฟล์เข้มงวด)" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="max_file_size_mb" label="ขนาดไฟล์สูงสุดที่อนุญาต (MB)">
            <InputNumber min={1} max={100} size="large" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="allowed_file_types" label="นามสกุลไฟล์ที่อนุญาต (คั่นด้วยคอมม่า)">
            <Select mode="tags" size="large" style={{ width: '100%' }} tokenSeparators={[',']} placeholder="เช่น jpg, png, pdf" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  const renderNotificationTab = () => (
    <div style={{ padding: '10px 0' }}>
      <Row gutter={[32, 32]}>
        <Col xs={24} lg={12}>
          <Title level={5}><BellOutlined /> การแจ้งเตือนและข้อความ</Title>
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item name="notify_backup_status" label="แจ้งเตือนผลการสำรองข้อมูลอัตโนมัติ" valuePropName="checked">
            <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
          </Form.Item>
          <Form.Item name="notify_new_ticket" label="แจ้งเตือนเมื่อมีใบงานใหม่" valuePropName="checked">
            <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
          </Form.Item>
          <Form.Item name="notify_status_change" label="แจ้งเตือนเมื่อมีการเปลี่ยนสถานะใบงาน" valuePropName="checked">
            <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
          </Form.Item>
          
          <Divider style={{ margin: '24px 0 12px 0' }} />
          <Title level={5}><EditOutlined /> รูปแบบข้อความแจ้งเตือน (Templates)</Title>
          <Form.Item name="msg_template_new" label="ข้อความแจ้งใบงานใหม่">
            <TextArea rows={4} placeholder="รองรับ [ticket_no], [category], [problem]" />
          </Form.Item>
          <Form.Item name="msg_template_update" label="ข้อความอัปเดตสถานะ">
            <TextArea rows={4} placeholder="รองรับ [ticket_no], [status], [technician]" />
          </Form.Item>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span><MessageOutlined style={{ color: '#00c300' }}/> LINE API & Webhook</span>} size="small" style={{ marginBottom: 20 }}>
            <Form.Item name="enable_line" label="เปิดใช้งาน LINE" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="line_notify_token" label="Channel Access Token"><Input.Password /></Form.Item>
            <Form.Item name="line_group_id" label="Group ID / User ID (สำหรับแจ้งเตือน)"><Input placeholder="ใส่ ID ของกลุ่มหรือบอท" /></Form.Item>
            
            <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.2)' : token.colorFillAlter, padding: 15, borderRadius: 8, marginTop: 15, border: isDarkMode ? '1px solid #333' : 'none' }}>
                <Title level={5} style={{ fontSize: 14 }}><ApiOutlined /> Webhook Generator (Capture Group ID)</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>ใช้ Ngrok เพื่อสร้าง Webhook ชั่วคราวสำหรับดึง Group ID จาก LINE</Text>
                
                {!webhookInfo.ngrok_url ? (
                    <div style={{ marginTop: 10 }}>
                        <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 5 }}>1. ใส่ Authtoken จาก ngrok.com</Text>
                        <Form.Item name="ngrok_authtoken" noStyle>
                            <Input.Password 
                                placeholder="ใส่ Ngrok Authtoken" 
                                size="small" 
                                style={{ marginBottom: 8 }}
                            />
                        </Form.Item>
                        <Button type="primary" block icon={<SyncOutlined />} onClick={handleStartNgrok} loading={loadingWebhook}>
                            2. สร้าง Webhook URL (Start Ngrok)
                        </Button>
                    </div>
                ) : (
                    <div style={{ marginTop: 10 }}>
                        <Alert 
                            type="success" 
                            message="Webhook กำลังทำงาน"
                            description={
                                <div>
                                    <Text copyable strong>{webhookInfo.ngrok_url}</Text>
                                    <br/><Text style={{ fontSize: 12 }} type="secondary">นำ URL นี้ไปใส่ใน LINE Developers &gt; Messaging API &gt; Webhook URL</Text>
                                </div>
                            }
                            style={{ marginBottom: 10 }}
                        />
                        <Button danger block onClick={handleStopNgrok} loading={loadingWebhook}>หยุด Ngrok</Button>
                    </div>
                )}

                <div style={{ marginTop: 15, padding: 10, background: token.colorBgContainer, borderRadius: 6, border: `1px dashed ${token.colorBorder}` }}>
                    <Text strong style={{ fontSize: 12 }}>ID ล่าสุดที่จับได้ (Group/User):</Text>
                    <div style={{ marginTop: 5 }}>
                        {webhookInfo.last_captured_id ? (
                            <Tag color="blue" style={{ fontSize: 14, padding: '4px 10px', width: '100%', textAlign: 'center' }} icon={<LinkOutlined />}>
                                <Text copyable>{webhookInfo.last_captured_id}</Text>
                            </Tag>
                        ) : <Text type="secondary" italic style={{ fontSize: 12 }}>รอรับข้อมูลจาก LINE Webhook...</Text>}
                    </div>
                </div>
            </div>
            
            <Divider />
            <Button type="dashed" size="small" block loading={loadingTestLine} onClick={handleTestLine}>ทดสอบส่งข้อความเข้า LINE</Button>
          </Card>

          <Card title={<span><MailOutlined style={{ color: '#1890ff' }}/> Email SMTP</span>} size="small">
            <Form.Item name="enable_email" label="เปิดใช้งาน Email" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="smtp_host" label="Host"><Input /></Form.Item>
            <Row gutter={8}>
              <Col span={12}><Form.Item name="smtp_user" label="User"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="smtp_pass" label="Pass"><Input.Password /></Form.Item></Col>
            </Row>
            <Form.Item name="admin_email" label="อีเมลผู้รับแจ้ง (Tags)">
              <Select mode="tags" style={{ width: '100%' }} />
            </Form.Item>
            <Button type="dashed" size="small" block loading={loadingTestEmail} onClick={handleTestEmail}>ทดสอบส่ง Email</Button>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderHealthTab = () => {
    if (!healthData) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" description="กำลังรวบรวมข้อมูลระดับโลก..." /></div>;

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
        <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0 }}><SafetyCertificateOutlined /> System Infrastructure Monitor</Title>
          <Button icon={<SyncOutlined />} onClick={fetchHealth} loading={loadingHealth} type="primary">Refresh Status</Button>
        </Flex>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title={<span><DesktopOutlined /> Server Hardware & OS</span>} size="small" variant="borderless" style={{ boxShadow: token.boxShadowTertiary, borderRadius: 12 }}>
               <Row gutter={[24, 24]}>
                  <Col span={8}>
                    <Statistic title="OS Platform" value={healthData.os.platform.toUpperCase()} prefix={<GlobalOutlined />} />
                    <Text type="secondary" style={{ fontSize: 12 }}>{healthData.os.release}</Text>
                  </Col>
                  <Col span={8}>
                    <Statistic title="CPU Cores" value={healthData.os.cpus} suffix="Cores" prefix={<HddOutlined />} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="System Uptime" value={healthData.os.uptime} prefix={<ClockCircleOutlined />} />
                  </Col>
                  <Col span={24}>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text strong>Physical Memory (RAM)</Text>
                    <Flex align="center" gap="middle" style={{ marginTop: 10 }}>
                      <Progress 
                        percent={parseFloat(((1 - (parseFloat(healthData.os.free_mem) / parseFloat(healthData.os.total_mem))) * 100).toFixed(1))} 
                        status="active" 
                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                      />
                      <Text style={{ whiteSpace: 'nowrap' }}>{healthData.os.free_mem} free of {healthData.os.total_mem}</Text>
                    </Flex>
                  </Col>
               </Row>
            </Card>

            <Card title={<span><CodeOutlined /> Application Stack Information</span>} size="small" variant="borderless" style={{ marginTop: 16, boxShadow: token.boxShadowTertiary, borderRadius: 12 }}>
               <Row gutter={[12, 12]}>
                  {stackItems.map(item => (
                    <Col xs={12} md={8} key={item.name}>
                      <div style={{ padding: 12, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f5', borderRadius: 8, textAlign: 'center', height: '100%' }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                        <Text strong style={{ display: 'block' }}>{item.name}</Text>
                        <Tag color="blue" style={{ marginTop: 4 }}>v{item.version}</Tag>
                        <br/><Text type="secondary" style={{ fontSize: 10 }}>{item.desc}</Text>
                      </div>
                    </Col>
                  ))}
               </Row>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title={<span><DatabaseOutlined /> Database & Services</span>} size="small" variant="borderless" style={{ boxShadow: token.boxShadowTertiary, borderRadius: 12 }}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="DB Status">
                   <Tag color="success" icon={<CheckCircleOutlined />}>ONLINE</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="MySQL Version">{healthData.database.version.split('-')[0]}</Descriptions.Item>
                <Descriptions.Item label="Connection Pool">{healthData.database.pool_limit} Connections</Descriptions.Item>
                <Descriptions.Item label="Backend PID">{healthData.process.pid}</Descriptions.Item>
                <Descriptions.Item label="Heap Memory">{healthData.process.memory_usage}</Descriptions.Item>
              </Descriptions>
              
              <Divider style={{ margin: '16px 0' }} />
              <Title level={5} style={{ fontSize: 14 }}><SafetyOutlined /> Directory Permissions</Title>
              {healthData.folders.map(f => (
                <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '4px 8px', background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fafafa', borderRadius: 4 }}>
                  <Text style={{ fontSize: 13 }}>/{f.name}</Text>
                  <Tag color={f.status === 'Writable' ? 'success' : 'error'} size="small">{f.status}</Tag>
                </div>
              ))}
            </Card>

            <Card style={{ marginTop: 16, textAlign: 'center', background: 'linear-gradient(135deg, #1d39c4 0%, #722ed1 100%)', borderRadius: 12, border: 'none' }}>
               <Statistic 
                  title={<Text style={{ color: 'rgba(255,255,255,0.8)' }}>System Overall Health</Text>} 
                  value="OPTIMIZED" 
                  styles={{ content: { color: '#fff', fontWeight: 'bold', fontSize: 24 } }}
                  prefix={<SafetyCertificateOutlined style={{ color: '#52c41a' }} />}
               />
               <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Last verified: {healthData.server_time}</Text>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const tabItems = [
    { key: '1', label: <span><SettingOutlined /> ข้อมูลทั่วไป</span>, children: renderGeneralTab() },
    { key: '2', label: <span><BellOutlined /> การแจ้งเตือน</span>, children: renderNotificationTab() },
    { key: '3', label: <span><FileProtectOutlined /> ความปลอดภัย</span>, children: renderSecurityTab() },
    { key: '5', label: <span><ClockCircleOutlined /> SLA & Policies</span>, children: (
      <div style={{ padding: '10px 0' }}>
        <Title level={5}><ClockCircleOutlined /> ระยะเวลา SLA ตามประเภทงาน (ชั่วโมง)</Title>
        <Divider style={{ margin: '12px 0' }} />
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}><Card size="small" title="💻 Hardware"><Form.Item name="sla_hardware_hours" noStyle><InputNumber size="large" style={{ width: '100%' }} /></Form.Item></Card></Col>
          <Col xs={24} md={8}><Card size="small" title="💿 Software"><Form.Item name="sla_software_hours" noStyle><InputNumber size="large" style={{ width: '100%' }} /></Form.Item></Card></Col>
          <Col xs={24} md={8}><Card size="small" title="🌐 Application"><Form.Item name="sla_app_hours" noStyle><InputNumber size="large" style={{ width: '100%' }} /></Form.Item></Card></Col>
        </Row>
        <Divider style={{ margin: '24px 0' }} />
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="default_sla_hours" label="เวลา SLA มาตรฐาน (ถ้าไม่ระบุตามกลุ่ม)">
              <InputNumber size="large" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="ack_limit_hours" label="เวลาตอบรับเคส (ชม.)">
              <InputNumber size="large" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="default_penalty_rate" label="อัตราค่าปรับต่อวัน (เช่น 0.0010)">
              <InputNumber size="large" step={0.0001} precision={4} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </div>
    )},
    { key: '9', label: <span><SecurityScanOutlined /> System Health</span>, children: renderHealthTab() }
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: token.colorBgLayout, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
        <div style={{ padding: 8, background: token.colorPrimary, borderRadius: 8 }}><SettingOutlined style={{ fontSize: 24, color: token.colorTextLightSolid }} /></div>
        <Title level={2} style={{ margin: 0 }}>ตั้งค่าระบบ</Title>
      </div>
      <Card style={{ borderRadius: 16, boxShadow: token.boxShadowTertiary, border: 'none' }}>
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Tabs 
              items={tabItems} 
              size="large" 
              style={{ marginBottom: 24 }} 
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                localStorage.setItem('system_settings_active_tab', key);
              }}
            />
            <Divider style={{ margin: '0 0 24px 0' }} />
            <div style={{ textAlign: 'right' }}>
              <Space size="middle">
                <Button size="large" onClick={() => fetchSettings()}>ยกเลิก</Button>
                <Button type="primary" size="large" htmlType="submit" icon={<SaveOutlined />} loading={saving} style={{ borderRadius: 8, padding: '0 32px' }}>บันทึกการตั้งค่า</Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
