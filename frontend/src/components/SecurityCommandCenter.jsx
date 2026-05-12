import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, Row, Col, Typography, Table, Button, Space, Tag, 
  Statistic, Steps, Divider, Empty, Modal, message, Badge, Tooltip,
  Timeline, List, Avatar, Progress, theme, Flex, Descriptions, Switch, Form, InputNumber, Input, Popover
} from 'antd';
import { 
  SafetyCertificateOutlined, 
  EyeOutlined, 
  ThunderboltOutlined, 
  LockOutlined, 
  SecurityScanOutlined,
  StopOutlined,
  DownloadOutlined,
  SyncOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  CodeOutlined,
  FileExcelOutlined,
  SettingOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  SecurityScanFilled,
  SafetyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; 
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError, alertConfirm } from '../utils/alert';
import * as XLSX from 'xlsx';

dayjs.locale('th');

const { Title, Text, Paragraph } = Typography;

export default function SecurityCommandCenter() {
  const { token } = theme.useToken();
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState([]);
  const [blockedIps, setBlockedIps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIp, setSelectedIp] = useState(null); 
  const [selectedThreat, setSelectedThreat] = useState(null); 
  const [isTimelineModalVisible, setIsTimelineModalVisible] = useState(false);

  // Security Settings States
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const [threatsRes, statsRes, blockedRes] = await Promise.all([
        axiosInstance.get('/security/threats'),
        axiosInstance.get('/security/stats'),
        axiosInstance.get('/security/blocked-ips')
      ]);
      setThreats(threatsRes.data || []);
      setStats(statsRes.data || []);
      setBlockedIps(blockedRes.data || []);
    } catch (err) {
      console.error("Fetch Security Data Error:", err);
      message.error("ไม่สามารถโหลดข้อมูลความปลอดภัยได้");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSecuritySettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await axiosInstance.get('/security/settings');
      form.setFieldsValue({
        ...res.data,
        auto_block_enabled: res.data.auto_block_enabled === 1 || res.data.auto_block_enabled === true
      });
    } catch (err) {
      message.error("ไม่สามารถโหลดการตั้งค่าความปลอดภัยได้");
    } finally {
      setSettingsLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000); 
    return () => clearInterval(interval);
  }, [fetchSecurityData]);

  // --- 🛠️ Logic & Calculations ---
  
  const attackerJourneys = useMemo(() => {
    const journeys = {};
    threats.forEach(t => {
      if (!journeys[t.ip_address]) journeys[t.ip_address] = [];
      journeys[t.ip_address].push(t);
    });
    return journeys;
  }, [threats]);

  const handleUpdateSettings = async (values) => {
    setSettingsLoading(true);
    try {
      await axiosInstance.put('/security/settings', values);
      alertSuccess('สำเร็จ', 'บันทึกการตั้งค่าความปลอดภัยเรียบร้อยแล้ว');
      setIsSettingsModalVisible(false);
    } catch (err) {
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleBlockIp = async (ip) => {
    const result = await alertConfirm('ยืนยันการปิดกั้น IP?', `คุณแน่ใจหรือไม่ว่าต้องการบล็อก IP: ${ip} ทันที?`);
    if (result.isConfirmed) {
      try {
        await axiosInstance.post('/security/block-ip', { ip_address: ip, reason: 'Detected malicious activity' });
        alertSuccess('ปิดกั้นสำเร็จ', `IP ${ip} ถูกระงับการใช้งานแล้ว`);
        fetchSecurityData();
      } catch (err) {
        alertError('ผิดพลาด', 'ไม่สามารถปิดกั้น IP ได้');
      }
    }
  };

  const handleUnblockIp = async (ip) => {
    try {
      await axiosInstance.post('/security/unblock-ip', { ip_address: ip });
      alertSuccess('ยกเลิกสำเร็จ', `ปลดบล็อก IP ${ip} เรียบร้อยแล้ว`);
      fetchSecurityData();
    } catch (err) {
      alertError('ผิดพลาด', 'ไม่สามารถยกเลิกการปิดกั้นได้');
    }
  };

  const handleExportReport = () => {
    if (threats.length === 0) {
      message.warning("ไม่มีข้อมูลสำหรับส่งออกรายงาน");
      return;
    }

    try {
      const exportData = threats.map(t => ({
        'IP Address': t.ip_address,
        'Phase': t.kill_chain_phase,
        'Attack Type': t.attack_type,
        'Method': t.method,
        'Target URL': t.target_url,
        'Threat Score': t.threat_score,
        'Outcome': t.status_code < 400 ? 'SUCCESS' : `REJECTED (${t.status_code})`,
        'Action': t.is_blocked ? 'AUTO-BLOCKED' : 'REJECTED',
        'Date Time': dayjs(t.created_at).format('DD MMM YY HH:mm')
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Security Threats");
      XLSX.writeFile(wb, `Security_Report_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
      message.success("ส่งออกรายงานสำเร็จ");
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการส่งออกรายงาน");
    }
  };

  const showTimeline = (ip) => {
    setSelectedIp(ip);
    if (attackerJourneys[ip] && attackerJourneys[ip].length > 0) {
      setSelectedThreat(attackerJourneys[ip][0]);
    }
    setIsTimelineModalVisible(true);
  };

  const formatThaiDate = (date) => {
    return dayjs(date).format('D MMM YY HH:mm');
  };

  // --- 🎨 UI Components ---

  const killChainPhases = [
    { key: 'Reconnaissance', title: 'การสอดแนม (Recon)', desc: 'ขั้นสำรวจค้นหาช่องโหว่และรวบรวมข้อมูลระบบเพื่อหาทางเจาะ', color: '#3b82f6', icon: <EyeOutlined /> },
    { key: 'Access', title: 'การพยายามเข้าถึง', desc: 'พยายามข้ามระบบตรวจสอบสิทธิ์หรือเจาะเข้าสู่พื้นที่จำกัด', color: '#f59e0b', icon: <ThunderboltOutlined /> },
    { key: 'Execution', title: 'การโจมตีระบบ', desc: 'การส่งคำสั่งอันตราย (SQL Injection, XSS) เพื่อทำลายหรือขโมยข้อมูล', color: '#ef4444', icon: <WarningOutlined /> },
    { key: 'Persistence', title: 'การฝังตัว', desc: 'พยายามสร้างช่องทางลับ (Backdoor) เพื่อเข้าถึงระบบในระยะยาว', color: '#8b5cf6', icon: <LockOutlined /> }
  ];

  const ColumnHeader = ({ title, desc }) => (
    <Space>
      {title}
      <Popover 
        title={<b style={{ color: token.colorPrimary }}>{title} คืออะไร?</b>}
        content={<div style={{ maxWidth: 350, fontSize: '13px', lineHeight: '1.6' }}>{desc}</div>} 
        trigger="hover"
      >
        <QuestionCircleOutlined style={{ color: '#bfbfbf', cursor: 'help', fontSize: '13px' }} />
      </Popover>
    </Space>
  );

  const columns = [
    {
      title: <ColumnHeader title="ผู้โจมตี" desc="ที่อยู่ IP ของผู้ที่พยายามกระทำการอันตราย หากมี Tag BLOCKED แสดงว่าระบบได้ตัดการเชื่อมต่อถาวรแล้วเนื่องจากมีความเสี่ยงสูงเกินเกณฑ์" />,
      dataIndex: 'ip_address',
      key: 'who',
      render: (text) => (
        <Flex vertical gap={0}>
          <Space>
            <GlobalOutlined style={{ color: token.colorPrimary }} />
            <Text strong>{text}</Text>
            {blockedIps.some(b => b.ip_address === text) && <Tag color="error">BLOCKED</Tag>}
          </Space>
          <Button type="link" size="small" onClick={() => showTimeline(text)} style={{ padding: 0, fontSize: '12px' }}>
            <ClockCircleOutlined /> ดูไทม์ไลน์การโจมตี
          </Button>
        </Flex>
      )
    },
    {
      title: <ColumnHeader title="ขั้นตอน" desc="ลำดับการโจมตีตาม Cyber Kill Chain ช่วยให้ทราบว่าผู้โจมตีอยู่ในระยะไหน (เช่น กำลังแค่สแกนหาช่องโหว่ หรือกำลังเริ่มส่งคำสั่งทำลายข้อมูล)" />,
      dataIndex: 'kill_chain_phase',
      key: 'phase',
      render: (phase) => {
        const info = killChainPhases.find(p => p.key === phase);
        return <Tag color={info?.color} style={{ borderRadius: '20px', padding: '2px 12px' }}>{info?.icon} {info?.title || phase}</Tag>;
      }
    },
    {
      title: <ColumnHeader title="เป้าหมาย" desc="ตำแหน่งของระบบ (API Endpoint) ที่ผู้โจมตีพยายามเรียกใช้งาน พร้อมเทคนิคที่ตรวจพบ (GET, POST, PUT)" />,
      dataIndex: 'target_url',
      key: 'where',
      render: (text, record) => (
        <Tooltip title={`Method: ${record.method}`}>
          <div style={{ maxWidth: '180px' }}>
            <Text code ellipsis style={{ fontSize: '12px' }}>{text}</Text>
          </div>
        </Tooltip>
      )
    },
    {
      title: <ColumnHeader title="สถานะการตอบโต้" desc={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>🟢 <b>สกัดกั้น (403):</b> ป้องกันสำเร็จ ระบบตรวจพบภัยคุกคามและตัดการทำงานทันที ก่อนจะถึงฐานข้อมูล</div>
          <div>🟠 <b>ผ่านได้ (200):</b> ระบบตรวจพบแต่ยังไม่ได้สั่งบล็อก หรือเป็นการเฝ้าระวังพฤติกรรม (ควรตรวจสอบ)</div>
          <div>🔴 <b>อันตราย (Score):</b> ระดับความรุนแรง (0-100) ยิ่งเลขสูงยิ่งหมายถึงการโจมตีที่ตั้งใจทำลายระบบ</div>
          <div>🚨 <b>AUTO-BLOCKED:</b> IP นี้ถูกแบนถาวรโดยอัตโนมัติ ช่วยลดภาระ Server</div>
        </div>
      } />,
      key: 'status',
      render: (_, record) => {
        const isProtected = record.status_code >= 400;
        return (
          <Flex vertical gap={2}>
            <Space>
              <Badge status={isProtected ? 'success' : 'warning'} /> 
              <Text type={isProtected ? 'success' : 'warning'} strong style={{ fontSize: '13px' }}>
                {isProtected ? `สกัดกั้น (${record.status_code})` : `ผ่านได้ (${record.status_code})`}
              </Text>
            </Space>
            <Space size={4}>
              <Text type="secondary" style={{ fontSize: '11px' }}>อันตราย:</Text>
              <Badge count={record.threat_score} color={record.threat_score >= 80 ? '#f5222d' : (record.threat_score >= 40 ? '#fa8c16' : '#1890ff')} size="small" />
            </Space>
            {record.is_blocked === 1 && (
              <Tag color="volcano" style={{ fontSize: '10px', marginTop: '2px', width: 'fit-content' }}>AUTO-BLOCKED</Tag>
            )}
          </Flex>
        );
      }
    },
    {
      title: <ColumnHeader title="วัน-เวลา" desc="วันและเวลาที่ระบบ Intrusion Prevention System (IPS) ตรวจพบและบันทึกเหตุการณ์นี้" />,
      dataIndex: 'created_at',
      key: 'when',
      render: (date) => <Text type="secondary" style={{ fontSize: '12px' }}>{formatThaiDate(date)}</Text>
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space>
          {!blockedIps.some(b => b.ip_address === record.ip_address) ? (
            <Button danger ghost size="small" icon={<StopOutlined />} onClick={() => handleBlockIp(record.ip_address)}>ระงับ IP</Button>
          ) : (
            <Button size="small" icon={<SyncOutlined />} onClick={() => handleUnblockIp(record.ip_address)}>ปลดบล็อก</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 24px)', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SafetyCertificateOutlined style={{ color: '#10b981' }} />
            <span>ศูนย์ควบคุมความปลอดภัยไซเบอร์</span>
          </Title>
          <Text type="secondary">Intrusion Prevention System (IPS) - วิเคราะห์พฤติกรรมการโจมตีและสถานะการสกัดกั้น</Text>
        </div>
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => { fetchSecuritySettings(); setIsSettingsModalVisible(true); }}>ตั้งค่าระบบป้องกัน</Button>
          <Button 
            icon={<FileExcelOutlined style={{ color: '#1D6F42' }} />} 
            onClick={handleExportReport}
            disabled={threats.length === 0}
          >
            ส่งออกรายงาน (Excel)
          </Button>
          <Button type="primary" icon={<SyncOutlined />} onClick={fetchSecurityData} loading={loading}>รีเฟรชข้อมูล</Button>
        </Space>
      </div>

      {/* Kill Chain Pipeline Visual */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {killChainPhases.map((phase) => {
          const count = stats.find(s => s.phase === phase.key)?.count || 0;
          return (
            <Col xs={24} sm={12} lg={6} key={phase.key}>
              <Card variant="borderless" hoverable style={{ borderRadius: '16px', boxShadow: 'var(--card-shadow)', borderTop: `4px solid ${phase.color}` }}>
                <Statistic title={phase.title} value={count} prefix={phase.icon} valueStyle={{ color: phase.color }} />
                <Text type="secondary" style={{ fontSize: '11px' }}>{phase.desc}</Text>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row gutter={[24, 24]}>
        {/* Main Intelligence Table */}
        <Col xs={24} xl={17}>
          <Card 
            title={<Space><SecurityScanFilled style={{ color: token.colorPrimary }} /> บันทึกเหตุการณ์และผลลัพธ์การสกัดกั้น</Space>}
            variant="borderless"
            style={{ borderRadius: '16px', boxShadow: 'var(--card-shadow)' }}
            styles={{ body: { padding: 0 } }}
          >
            <Table dataSource={threats} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} scroll={{ x: 'max-content' }} className="enterprise-table" />
          </Card>
        </Col>

        {/* IP Block List & Insights */}
        <Col xs={24} xl={7}>
          <Flex vertical gap="large" style={{ width: '100%' }}>
            <Card title={<Space><StopOutlined style={{ color: '#ef4444' }} /> รายการ IP ที่ถูกปิดกั้น</Space>} variant="borderless" style={{ borderRadius: '16px', boxShadow: 'var(--card-shadow)' }} extra={<Badge count={blockedIps.length} showZero color="#ef4444" />}>
              <List
                dataSource={blockedIps}
                maxHeight={400}
                renderItem={(item) => (
                  <List.Item actions={[<Button type="text" danger icon={<SyncOutlined />} onClick={() => handleUnblockIp(item.ip_address)} />]}>
                    <List.Item.Meta avatar={<Avatar icon={<GlobalOutlined />} style={{ backgroundColor: '#fee2e2', color: '#ef4444' }} />} title={<Text strong>{item.ip_address}</Text>} description={<Text type="secondary" style={{ fontSize: '11px' }}>ระงับเมื่อ: {formatThaiDate(item.created_at)}</Text>} />
                  </List.Item>
                )}
                style={{ maxHeight: '400px', overflowY: 'auto' }}
              />
            </Card>

            <Card title={<Space><ShieldOutlined style={{ color: '#10b981' }} /> ประสิทธิภาพการป้องกัน</Space>} variant="borderless" style={{ borderRadius: '16px', boxShadow: 'var(--card-shadow)', background: `linear-gradient(135deg, ${token.colorPrimary}05 0%, ${token.colorPrimary}15 100%)` }}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>อัตราความสำเร็จในการสกัดกั้น</Text>
                <Progress percent={threats.length > 0 ? Math.round((threats.filter(t => t.status_code >= 400).length / threats.length) * 100) : 100} status="active" strokeColor="#10b981" />
              </div>
              <Paragraph style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                ระบบ IPS กำลังเฝ้าระวังอย่างต่อเนื่อง ตรวจพบการพยายามโจมตี {threats.length} ครั้งล่าสุด และสั่งแบน IP อัตโนมัติไปแล้ว {blockedIps.length} รายการ
              </Paragraph>
            </Card>
          </Flex>
        </Col>
      </Row>

      {/* ⚙️ Security Settings Modal */}
      <Modal 
        title={<Space><SettingOutlined /> ตั้งค่าระบบบล็อก IP อัตโนมัติ (IPS Configuration)</Space>} 
        open={isSettingsModalVisible} 
        onCancel={() => setIsSettingsModalVisible(false)} 
        footer={null} 
        width={600}
      >
        <div style={{ marginBottom: 20, padding: '12px', background: '#f0f7ff', borderRadius: '8px', border: '1px solid #bae7ff' }}>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            <InfoCircleOutlined /> <b>คำแนะนำ:</b> ระบบจะทำการแบน IP ทันทีเมื่อคะแนนสะสมหรือจำนวนครั้งถึงเกณฑ์ที่กำหนด เพื่อหยุดยั้งผู้บุกรุกโดยไม่รอ Admin
          </Text>
        </div>
        <Form form={form} layout="vertical" onFinish={handleUpdateSettings}>
          <Form.Item name="auto_block_enabled" label={<b>เปิดใช้งานระบบบล็อกอัตโนมัติ</b>} valuePropName="checked">
            <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="score_threshold" label={<b>เกณฑ์คะแนนความเสี่ยง</b>} tooltip="คะแนนสะสมที่หากถึงเกณฑ์จะถูกบล็อกทันที">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="attack_limit_per_hour" label={<b>จำนวนครั้งที่อนุญาต/ชม.</b>} tooltip="จำนวนการโจมตีที่ยอมให้เกิดใน 1 ชม.">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="block_duration_hours" label={<b>ระยะเวลาการบล็อก (ชั่วโมง)</b>}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="whitelist_ips" label={<b>IP ที่ยกเว้น (Whitelist)</b>} help="คั่นด้วยเครื่องหมายจุลภาค ,">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Divider />
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsSettingsModalVisible(false)}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={settingsLoading}>บันทึกการตั้งค่า</Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 🗓️ Attack Journey Timeline Modal (World Class Analysis View) */}
      <Modal
        title={
          <Space>
            <HistoryOutlined style={{ color: token.colorPrimary }} />
            <span>การวิเคราะห์เส้นทางการโจมตีเชิงลึก: <Text strong type="danger">{selectedIp}</Text></span>
          </Space>
        }
        open={isTimelineModalVisible}
        onCancel={() => setIsTimelineModalVisible(false)}
        footer={[<Button key="close" onClick={() => setIsTimelineModalVisible(false)}>ปิดหน้าต่าง</Button>]}
        width={1000}
        centered
        styles={{ body: { padding: '24px', backgroundColor: 'var(--bg-app)' } }}
      >
        <Row gutter={24}>
          {/* Left: Timeline Summary */}
          <Col xs={24} md={10} style={{ borderRight: '1px solid var(--border-color)', maxHeight: '65vh', overflowY: 'auto' }}>
            <Title level={5} style={{ marginBottom: '20px' }}><ClockCircleOutlined /> ลำดับเหตุการณ์ (Kill Chain)</Title>
            {selectedIp && attackerJourneys[selectedIp] ? (
              <Timeline
                mode="start"
                items={attackerJourneys[selectedIp].map(t => {
                  const phaseInfo = killChainPhases.find(p => p.key === t.kill_chain_phase);
                  const isSelected = selectedThreat?.id === t.id;
                  
                  let severity = { label: 'LOW', color: 'blue' };
                  if (t.threat_score >= 80) severity = { label: 'CRITICAL', color: 'error' };
                  else if (t.threat_score >= 60) severity = { label: 'HIGH', color: 'warning' };
                  else if (t.threat_score >= 40) severity = { label: 'MEDIUM', color: 'orange' };

                  return {
                    color: phaseInfo?.color,
                    title: <Text type="secondary" style={{ fontSize: '11px' }}>{dayjs(t.created_at).format('HH:mm:ss')}</Text>,
                    content: (
                      <div 
                        onClick={() => setSelectedThreat(t)}
                        style={{ 
                          cursor: 'pointer',
                          padding: '12px', 
                          borderRadius: '10px', 
                          backgroundColor: isSelected ? `${phaseInfo?.color}15` : 'var(--bg-card)',
                          border: isSelected ? `1px solid ${phaseInfo?.color}` : '1px solid var(--border-color)',
                          boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Flex vertical gap={2} style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Tag color={severity.color} style={{ fontSize: '10px', fontWeight: 'bold' }}>{severity.label}</Tag>
                            <Text type="secondary" style={{ fontSize: '10px' }}>{phaseInfo?.title}</Text>
                          </div>
                          <Text strong style={{ fontSize: '13px', display: 'block' }}>{t.attack_type}</Text>
                        </Flex>
                      </div>
                    )
                  };
                })}
              />
            ) : <Empty />}
          </Col>

          {/* Right: 5W1H Analysis */}
          <Col xs={24} md={14}>
            {selectedThreat ? (
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '16px', height: '100%', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)' }}>
                <Title level={4} style={{ marginTop: 0, color: token.colorPrimary }}>รายละเอียดเหตุการณ์ (5W1H Analysis)</Title>
                <Descriptions 
                  column={1} 
                  size="small" 
                  bordered={false}
                  styles={{ label: { width: '130px', fontWeight: 'bold', color: 'var(--text-main)' } }}
                >
                  <Descriptions.Item label={<Space><UserOutlined /> Who (ใคร)</Space>}>
                    <Text copyable>IP: {selectedThreat.ip_address}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><ThunderboltOutlined /> What (ทำอะไร)</Space>}>
                    {`${selectedThreat.method} ส่งข้อมูลอันตราย (${selectedThreat.attack_type})`}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><EnvironmentOutlined /> Where (ที่ไหน)</Space>}>
                    <Text code>{selectedThreat.target_url}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><ClockCircleOutlined /> When (เมื่อไหร่)</Space>}>
                    {formatThaiDate(selectedThreat.created_at)}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Space><CheckCircleOutlined /> Outcome (ผลลัพธ์)</Space>}>
                    <Space>
                      {selectedThreat.status_code < 400 ? <Tag color="warning">ผ่านได้ (200)</Tag> : <Tag color="success">สกัดกั้นสำเร็จ ({selectedThreat.status_code})</Tag>}
                      {selectedThreat.is_blocked === 1 && <Tag color="volcano">AUTO-BLOCKED</Tag>}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: '16px 0' }} />
                
                <Title level={5}><CodeOutlined /> Raw Log Data (บันทึกข้อมูลดิบ)</Title>
                <div style={{ 
                  backgroundColor: '#1e293b', 
                  color: '#e2e8f0', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #334155'
                }}>
                   {`[SECURITY] ${selectedThreat.method} ${selectedThreat.target_url}\nIP: ${selectedThreat.ip_address}\nPayload: ${selectedThreat.payload}`}
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Empty description="เลือกเหตุการณ์จากไทม์ไลน์เพื่อวิเคราะห์" />
              </div>
            )}
          </Col>
        </Row>
      </Modal>

      <style>{`
        .enterprise-table .ant-table-thead > tr > th {
          background-color: var(--bg-app) !important;
          font-weight: 700;
          color: var(--text-main);
          border-bottom: 1px solid var(--border-color);
        }
        .enterprise-table .ant-table-row:hover > td {
          background-color: ${token.colorPrimary}05 !important;
        }
      `}</style>
    </div>
  );
}
