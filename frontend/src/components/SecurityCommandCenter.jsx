import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, Row, Col, Typography, Table, Button, Space, Tag, 
  Statistic, Divider, Empty, Modal, message, Badge, Tooltip,
  Timeline, List, Avatar, Progress, theme, Flex, Descriptions, Switch, Form, InputNumber, Input, Popover, Alert
} from 'antd';
import { 
  SafetyCertificateOutlined, 
  EyeOutlined, 
  ThunderboltOutlined, 
  LockOutlined, 
  SecurityScanOutlined,
  StopOutlined,
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
  SafetyOutlined,
  NotificationOutlined,
  RocketOutlined,
  AuditOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; 
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError, alertConfirm } from '../utils/alert';
import * as XLSX from 'xlsx';

dayjs.locale('th');

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

/**
 * 🛡️ Security Command Center - Enterprise Search Enabled Version
 */
export default function SecurityCommandCenter() {
  const { token } = theme.useToken();
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState([]);
  const [blockedIps, setBlockedIps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIp, setSelectedIp] = useState(null); 
  const [selectedThreat, setSelectedThreat] = useState(null); 
  const [isTimelineModalVisible, setIsTimelineModalVisible] = useState(false);

  // Search States
  const [threatSearchText, setThreatSearchText] = useState('');
  const [blockedIpSearchText, setBlockedIpSearchText] = useState('');

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
        auto_block_enabled: res.data.auto_block_enabled === 1 || res.data.auto_block_enabled === true,
        notify_admin: res.data.notify_admin === 1 || res.data.notify_admin === true
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

  // --- 🛠️ Filtering Logic ---
  
  const filteredThreats = useMemo(() => {
    if (!threatSearchText) return threats;
    const search = threatSearchText.toLowerCase();
    return threats.filter(t => 
      t.ip_address?.toLowerCase().includes(search) ||
      t.attack_type?.toLowerCase().includes(search) ||
      t.target_url?.toLowerCase().includes(search) ||
      t.method?.toLowerCase().includes(search)
    );
  }, [threats, threatSearchText]);

  const filteredBlockedIps = useMemo(() => {
    if (!blockedIpSearchText) return blockedIps;
    const search = blockedIpSearchText.toLowerCase();
    return blockedIps.filter(b => 
      b.ip_address?.toLowerCase().includes(search) ||
      b.reason?.toLowerCase().includes(search)
    );
  }, [blockedIps, blockedIpSearchText]);

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
      alertSuccess('สำเร็จ', 'บันทึกการตั้งค่า IPS แบบ Full เรียบร้อยแล้ว');
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
        await axiosInstance.post('/security/block-ip', { ip_address: ip, reason: 'Manual block by Admin' });
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
        'Status Code': t.status_code,
        'Action': t.is_blocked ? 'AUTO-BLOCKED' : 'REJECTED',
        'Date Time': dayjs(t.created_at).format('DD MMM YY HH:mm')
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Security Threats");
      XLSX.writeFile(wb, `Full_Security_Report_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
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

  // --- 🎨 Dynamic Efficiency Logic (4 Levels: Green, Yellow, Orange, Red) ---
  const getEfficiencyStatus = (percent) => {
    // 1. ปลอดภัยสูง (Green: 81-100%)
    if (percent >= 81) return { 
      label: 'ปลอดภัยสูง', 
      color: '#10b981', 
      bg: 'linear-gradient(180deg, #065f46 0%, #064e3b 100%)', 
      text: '#ffffff', 
      subText: '#a7f3d0',
      description: 'ระบบทำงานได้สมบูรณ์แบบ'
    };
    // 2. เฝ้าระวัง (Yellow/Amber: 51-80%)
    if (percent >= 51) return { 
      label: 'เฝ้าระวัง', 
      color: '#fbbf24', 
      bg: 'linear-gradient(180deg, #92400e 0%, #78350f 100%)', 
      text: '#ffffff', 
      subText: '#fde68a',
      description: 'ควรเริ่มสังเกตการณ์ระบบ'
    };
    // 3. เสี่ยงอันตราย (Orange: 26-50%)
    if (percent >= 26) return { 
      label: 'เสี่ยงอันตราย', 
      color: '#f97316', 
      bg: 'linear-gradient(180deg, #9a3412 0%, #7c2d12 100%)', 
      text: '#ffffff', 
      subText: '#ffedd5',
      description: 'มีภัยคุกคามเล็ดลอดบางส่วน'
    };
    // 4. วิกฤต (Red: 0-25%)
    return { 
      label: 'วิกฤต', 
      color: '#ef4444', 
      bg: 'linear-gradient(180deg, #991b1b 0%, #7f1d1d 100%)', 
      text: '#ffffff', 
      subText: '#fee2e2',
      description: 'ระบบอยู่ในภาวะอันตรายสูงสุด'
    };
  };

  const efficiencyPercent = threats.length > 0 ? Math.round((threats.filter(t => t.status_code >= 400).length / threats.length) * 100) : 100;
  const statusConfig = getEfficiencyStatus(efficiencyPercent);

  // --- 🎨 UI Components ---

  const killChainPhases = [
    { key: 'Reconnaissance', title: 'การสอดแนม (Recon)', desc: 'ค้นหาช่องโหว่และรวบรวมข้อมูลระบบ', color: '#3b82f6', icon: <EyeOutlined />, gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
    { key: 'Access', title: 'การพยายามเข้าถึง', desc: 'พยายามข้ามระบบตรวจสอบสิทธิ์', color: '#f59e0b', icon: <ThunderboltOutlined />, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    { key: 'Execution', title: 'การโจมตีระบบ', desc: 'การส่งคำสั่งอันตราย (SQLi, XSS)', color: '#ef4444', icon: <WarningOutlined />, gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
    { key: 'Persistence', title: 'การฝังตัว', desc: 'พยายามยึดครองระบบในระยะยาว', color: '#8b5cf6', icon: <LockOutlined />, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }
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
      title: <ColumnHeader title="ผู้โจมตี" desc="ที่อยู่ IP ของผู้ที่พยายามกระทำการอันตราย" />,
      dataIndex: 'ip_address',
      key: 'who',
      render: (text) => (
        <Flex vertical gap={0}>
          <Space>
            <GlobalOutlined style={{ color: token.colorPrimary }} />
            <Text strong style={{ letterSpacing: '0.5px' }}>{text}</Text>
            {blockedIps.some(b => b.ip_address === text) && (
              <Badge status="error" text={<Text type="danger" style={{ fontSize: '10px', fontWeight: 'bold' }}>BLOCKED</Text>} />
            )}
          </Space>
          <Button type="link" size="small" onClick={() => showTimeline(text)} style={{ padding: 0, fontSize: '12px', textAlign: 'left', width: 'fit-content' }}>
            <ClockCircleOutlined /> ดูไทม์ไลน์เชิงลึก
          </Button>
        </Flex>
      )
    },
    {
      title: <ColumnHeader title="ขั้นตอน (Kill Chain)" desc="ลำดับการโจมตีตามมาตรฐาน Cyber Kill Chain" />,
      dataIndex: 'kill_chain_phase',
      key: 'phase',
      render: (phase) => {
        const info = killChainPhases.find(p => p.key === phase);
        return (
          <Tag 
            bordered={false}
            style={{ 
              background: `${info?.color}15`, 
              color: info?.color,
              borderRadius: '6px', 
              padding: '4px 12px',
              fontWeight: 600,
              border: `1px solid ${info?.color}30`
            }}
          >
            {info?.icon} {info?.title || phase}
          </Tag>
        );
      }
    },
    {
      title: <ColumnHeader title="การตอบโต้" desc="ผลลัพธ์ของระบบ: สกัดกั้น (403) คือป้องกันสำเร็จ" />,
      key: 'status',
      render: (_, record) => {
        const isProtected = record.status_code >= 400;
        return (
          <Flex vertical gap={4}>
            <Space size={4}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: isProtected ? '#10b981' : '#f59e0b',
                boxShadow: `0 0 8px ${isProtected ? '#10b981' : '#f59e0b'}`
              }} />
              <Text strong style={{ color: isProtected ? '#10b981' : '#d97706', fontSize: '13px' }}>
                {isProtected ? `Protected (${record.status_code})` : `Warning (${record.status_code})`}
              </Text>
            </Space>
            <Flex align="center" gap={8}>
              <Progress 
                percent={record.threat_score} 
                size="small" 
                showInfo={false} 
                strokeColor={record.threat_score >= 80 ? '#ef4444' : (record.threat_score >= 40 ? '#f59e0b' : '#3b82f6')}
                style={{ width: '60px', margin: 0 }}
              />
              <Text type="secondary" style={{ fontSize: '11px' }}>Score: {record.threat_score}</Text>
            </Flex>
            {record.is_blocked === 1 && (
              <Tag color="volcano" style={{ fontSize: '10px', borderRadius: '4px', border: 'none' }}>AUTO-BLOCKED</Tag>
            )}
          </Flex>
        );
      }
    },
    {
      title: <ColumnHeader title="วัน-เวลา" desc="วันและเวลาที่ระบบตรวจพบเหตุการณ์นี้" />,
      dataIndex: 'created_at',
      key: 'when',
      render: (date) => (
        <Flex vertical>
          <Text strong style={{ fontSize: '13px' }}>{dayjs(date).format('HH:mm:ss')}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{dayjs(date).format('DD MMM YYYY')}</Text>
        </Flex>
      )
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space>
          {!blockedIps.some(b => b.ip_address === record.ip_address) ? (
            <Button 
              danger 
              type="primary" 
              size="small" 
              icon={<StopOutlined />} 
              onClick={() => handleBlockIp(record.ip_address)}
              style={{ borderRadius: '6px' }}
            >
              Block IP
            </Button>
          ) : (
            <Button 
              size="small" 
              icon={<SyncOutlined />} 
              onClick={() => handleUnblockIp(record.ip_address)}
              style={{ borderRadius: '6px' }}
            >
              Unblock
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="security-dashboard-container" style={{ 
      padding: 'clamp(16px, 4vw, 32px)', 
      backgroundColor: '#f8fafc', 
      minHeight: '100vh',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.05) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.05) 0px, transparent 50%)'
    }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '16px', letterSpacing: '-0.5px' }}>
            <div className="pulse-icon" style={{ 
              backgroundColor: '#10b981', 
              padding: '10px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}>
              <SafetyCertificateOutlined style={{ color: '#fff', fontSize: '24px' }} />
            </div>
            <span>ศูนย์ควบคุมความปลอดภัยไซเบอร์</span>
          </Title>
          <Text type="secondary" style={{ fontSize: '15px', marginLeft: '52px' }}>
            ระบบป้องกันการบุกรุกระดับองค์กร (Enterprise IPS)
          </Text>
        </div>
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<SettingOutlined />} 
            onClick={() => { fetchSecuritySettings(); setIsSettingsModalVisible(true); }}
            style={{ borderRadius: '8px', height: '40px', fontWeight: 600, background: '#1e293b', border: 'none' }}
          >
            ตั้งค่า IPS
          </Button>
          <Button 
            icon={<FileExcelOutlined style={{ color: '#1D6F42' }} />} 
            onClick={handleExportReport}
            style={{ borderRadius: '8px', height: '40px' }}
          >
            ส่งออกรายงาน
          </Button>
          <Button 
            icon={<SyncOutlined spin={loading} />} 
            onClick={fetchSecurityData} 
            loading={loading}
            style={{ borderRadius: '8px', height: '40px' }}
          >
            รีเฟรช
          </Button>
        </Space>
      </div>

      {/* Kill Chain Statistics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {killChainPhases.map((phase) => {
          const count = stats.find(s => s.phase === phase.key)?.count || 0;
          return (
            <Col xs={24} sm={12} lg={6} key={phase.key}>
              <Card 
                variant="borderless" 
                hoverable 
                className="glass-card"
                style={{ 
                  borderRadius: '20px', 
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
                styles={{ body: { padding: '24px' } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ 
                    backgroundColor: `${phase.color}15`, 
                    padding: '12px', 
                    borderRadius: '12px', 
                    color: phase.color,
                    marginBottom: '16px'
                  }}>
                    {React.cloneElement(phase.icon, { style: { fontSize: '24px' } })}
                  </div>
                  <Tag color={phase.color} bordered={false} style={{ borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>เรียลไทม์</Tag>
                </div>
                <Statistic 
                  title={<Text type="secondary" style={{ fontWeight: 500 }}>{phase.title}</Text>} 
                  value={count} 
                  styles={{ content: { color: '#1e293b', fontWeight: 700, fontSize: '28px' } }} 
                />
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>{phase.desc}</Text>
                <div style={{ 
                  height: '4px', 
                  width: '100%', 
                  background: '#f1f5f9', 
                  marginTop: '16px', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: count > 0 ? '70%' : '0%', 
                    background: phase.gradient,
                    borderRadius: '2px'
                  }} />
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row gutter={[24, 24]}>
        {/* Main Log Table Section */}
        <Col xs={24} xl={17}>
          <Card 
            title={
              <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ padding: '8px 0' }}>
                <Space size="middle">
                  <div style={{ backgroundColor: `${token.colorPrimary}15`, padding: '8px', borderRadius: '8px' }}>
                    <SecurityScanFilled style={{ color: token.colorPrimary, fontSize: '18px' }} />
                  </div>
                  <Text strong style={{ fontSize: '18px' }}>บันทึกการสกัดกั้นภัยคุกคามแบบ Real-time</Text>
                </Space>
                <Search 
                  placeholder="ค้นหา IP, ประเภทการโจมตี, เป้าหมาย..." 
                  allowClear 
                  onSearch={value => setThreatSearchText(value)}
                  onChange={e => setThreatSearchText(e.target.value)}
                  style={{ width: 320 }}
                  size="large"
                  className="custom-search"
                />
              </Flex>
            }
            variant="borderless"
            style={{ 
              borderRadius: '24px', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              background: '#fff'
            }}
            styles={{ body: { padding: '0px' } }}
          >
            <Table 
              dataSource={filteredThreats} 
              columns={columns} 
              rowKey="id" 
              loading={loading} 
              pagination={{ 
                defaultPageSize: 10, 
                showSizeChanger: true, 
                pageSizeOptions: ['10', '20', '50', '100'], 
                showTotal: (total) => `รวมทั้งหมด ${total} รายการที่ตรวจพบ` 
              }} 
              scroll={{ x: 'max-content' }} 
              className="world-class-table" 
            />
          </Card>
        </Col>

        {/* IP Block List & Protection Insights */}
        <Col xs={24} xl={7}>
          <Flex vertical gap="24px" style={{ width: '100%' }}>
            {/* Efficiency Card */}
            <Card 
              variant="borderless" 
              className="efficiency-card"
              style={{ 
                borderRadius: '24px', 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                background: statusConfig.bg,
                color: statusConfig.text,
                border: `1px solid ${statusConfig.color}40`,
                transition: 'all 0.5s ease'
              }}
            >
              <Flex vertical align="center" gap={20} style={{ padding: '12px 0' }}>
                <div style={{ color: '#ffffff !important', fontSize: '18px', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  ประสิทธิภาพการป้องกัน
                </div>

                <Progress 
                  type="circle" 
                  percent={efficiencyPercent} 
                  strokeColor={{
                    '0%': statusConfig.color,
                    '100%': '#ffffff',
                  }}
                  strokeWidth={12}
                  trailColor="rgba(255,255,255,0.15)"
                  format={(percent) => (
                    <div style={{ color: '#ffffff', textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1 }}>{percent}%</div>
                      <div style={{ 
                        fontSize: '11px', 
                        fontWeight: 800, 
                        color: statusConfig.subText, 
                        marginTop: '4px',
                        letterSpacing: '0.5px',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        {statusConfig.label}
                      </div>
                    </div>
                  )}
                  width={160}
                />

                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ 
                    backgroundColor: 'rgba(255,255,255,0.15)', 
                    padding: '12px', 
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ 
                      color: '#ffffff !important', 
                      fontSize: '18px', 
                      fontWeight: 800, 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusConfig.color, boxShadow: `0 0 10px ${statusConfig.color}` }} />
                      สถานะระบบ: {efficiencyPercent >= 51 ? 'ปกติ' : 'ผิดปกติ'}
                    </div>
                    <div style={{ color: statusConfig.subText, fontSize: '14px', fontWeight: 600 }}>
                      สกัดกั้นภัยคุกคามแล้ว <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 900 }}>{filteredThreats.length}</span> รายการ
                    </div>
                  </div>
                </div>
              </Flex>
            </Card>

            <Card 
              title={
                <Flex vertical gap={12}>
                  <Space><StopOutlined style={{ color: '#ef4444' }} /> <Text strong>รายการ IP ที่ถูกระงับ</Text> <Badge count={filteredBlockedIps.length} showZero color="#ef4444" /></Space>
                  <Search 
                    placeholder="ค้นหา IP..." 
                    size="middle"
                    allowClear 
                    onSearch={value => setBlockedIpSearchText(value)}
                    onChange={e => setBlockedIpSearchText(e.target.value)}
                    className="small-search"
                  />
                </Flex>
              } 
              variant="borderless" 
              style={{ 
                borderRadius: '24px', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                background: '#fff'
              }}
            >
              <List
                dataSource={filteredBlockedIps}
                renderItem={(item) => (
                  <List.Item 
                    className="ip-list-item"
                    actions={[
                      <Tooltip title="ปลดบล็อก">
                        <Button type="text" shape="circle" icon={<SyncOutlined />} onClick={() => handleUnblockIp(item.ip_address)} />
                      </Tooltip>
                    ]}
                    style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}
                  >
                    <List.Item.Meta 
                      avatar={<Avatar icon={<GlobalOutlined />} style={{ backgroundColor: '#fee2e2', color: '#ef4444' }} />} 
                      title={<Text strong style={{ letterSpacing: '0.5px' }}>{item.ip_address}</Text>} 
                      description={<Text type="secondary" style={{ fontSize: '11px' }}>ระงับเมื่อ: {dayjs(item.created_at).format('DD MMM, HH:mm')}</Text>} 
                    />
                  </List.Item>
                )}
                style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}
              />
            </Card>
          </Flex>
        </Col>
      </Row>

      {/* ⚙️ Full IPS Configuration Modal */}
      <Modal 
        title={
          <Flex align="center" gap={12}>
            <div style={{ backgroundColor: '#1e293b', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <SettingOutlined style={{ color: '#fff' }} />
            </div>
            <Text strong style={{ fontSize: '18px' }}>การตั้งค่านโยบาย IPS ขั้นสูง</Text>
          </Flex>
        } 
        open={isSettingsModalVisible} 
        onCancel={() => setIsSettingsModalVisible(false)} 
        footer={null} 
        width={800}
        centered
        className="glass-modal"
      >
        <Alert 
          message={<Text strong>นโยบายการป้องกันที่เปิดใช้งานอยู่</Text>}
          description="กฎที่กำหนดที่นี่จะถูกนำไปใช้แบบ Real-time กับทราฟฟิกขาเข้าทั้งหมด การเปลี่ยนแปลงจะมีผลทันทีในทุกโหนด"
          type="info"
          showIcon
          style={{ marginBottom: '24px', borderRadius: '12px' }}
        />

        <Form form={form} layout="vertical" onFinish={handleUpdateSettings}>
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <Row gutter={32}>
              <Col span={24}>
                <Form.Item name="auto_block_enabled" label={<Text strong>โหมดระบบป้องกันการบุกรุก (IPS Mode)</Text>} valuePropName="checked">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                    <Switch checkedChildren="ป้องกัน (PROTECT)" unCheckedChildren="เฝ้าสังเกต (MONITOR)" />
                    <Text type="secondary" style={{ fontSize: '13px' }}>สลับระหว่างการบล็อกอัตโนมัติหรือการบันทึกข้อมูลเพียงอย่างเดียว</Text>
                  </div>
                </Form.Item>
                <Divider style={{ margin: '12px 0 24px 0' }} />
              </Col>

              <Col span={12}>
                <Title level={5} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WarningOutlined style={{ color: '#f59e0b' }} /> ความไวในการตรวจจับ
                </Title>
                <Form.Item name="score_threshold" label="เกณฑ์คะแนนอันตรายสะสม" tooltip="ผลรวมคะแนนภัยคุกคามภายใน 1 ชั่วโมงก่อนการบล็อกอัตโนมัติ">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="immediate_block_score" label="คะแนนการละเมิดขั้นรุนแรง" tooltip="คำขอใดๆ ที่มีคะแนนถึงเกณฑ์นี้จะถูกบล็อกถาวรทันที">
                  <InputNumber min={1} max={100} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="attack_limit_per_hour" label="ความถี่สูงสุดในการโจมตี" tooltip="จำนวนคำขอที่น่าสงสัยสูงสุดที่อนุญาตต่อชั่วโมงต่อหนึ่ง IP">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Title level={5} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <NotificationOutlined style={{ color: '#3b82f6' }} /> การตอบโต้โดยอัตโนมัติ
                </Title>
                <Form.Item name="block_duration_hours" label="ระยะเวลากักกัน (ชั่วโมง)" tooltip="ตั้งค่าเป็น 0 สำหรับการติดบัญชีดำถาวร">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="notify_admin" label="ระบบแจ้งเตือนผู้ดูแลระบบ" valuePropName="checked">
                  <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
                </Form.Item>
                <div style={{ marginTop: '24px', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <InfoCircleOutlined /> แนะนำ: ควรตั้งค่า "การละเมิดขั้นรุนแรง" ไว้ที่ 80+ เพื่อป้องกัน SQLi/XSS อัตโนมัติ
                  </Text>
                </div>
              </Col>

              <Col span={24}>
                <Divider />
                <Form.Item name="whitelist_ips" label={<Text strong>รายการหน่วยงานที่เชื่อถือได้ (Whitelist)</Text>} help="ระบุ CIDR หรือที่อยู่ IP โดยคั่นด้วยเครื่องหมายจุลภาค">
                  <Input.TextArea rows={3} placeholder="ตัวอย่าง: 192.168.1.1, 10.0.0.0/24" style={{ borderRadius: '10px' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <div style={{ textAlign: 'right', marginTop: '24px' }}>
            <Space size="middle">
              <Button onClick={() => setIsSettingsModalVisible(false)} size="large" style={{ borderRadius: '10px' }}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={settingsLoading} size="large" style={{ borderRadius: '10px', background: '#1e293b', border: 'none', padding: '0 32px' }}>
                บังคับใช้นโยบาย
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Attack Journey Modal */}
      <Modal
        title={
          <Flex align="center" gap={12}>
            <div style={{ backgroundColor: '#ef4444', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <HistoryOutlined style={{ color: '#fff' }} />
            </div>
            <span>Deep Threat Analysis: <Text strong type="danger">{selectedIp}</Text></span>
          </Flex>
        }
        open={isTimelineModalVisible}
        onCancel={() => setIsTimelineModalVisible(false)}
        footer={[<Button key="close" onClick={() => setIsTimelineModalVisible(false)} size="large" style={{ borderRadius: '10px' }}>Close Analysis</Button>]}
        width={1100}
        centered
        styles={{ body: { padding: '0px', overflow: 'hidden' } }}
      >
        <Row style={{ height: '70vh' }}>
          <Col xs={24} md={9} style={{ borderRight: '1px solid #f1f5f9', padding: '24px', overflowY: 'auto', background: '#fafafa' }}>
            <Title level={5} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClockCircleOutlined /> Kill Chain Progression
            </Title>
            {selectedIp && attackerJourneys[selectedIp] ? (
              <Timeline
                mode="left"
                items={attackerJourneys[selectedIp].map(t => {
                  const phaseInfo = killChainPhases.find(p => p.key === t.kill_chain_phase);
                  const isSelected = selectedThreat?.id === t.id;
                  let severity = { label: 'LOW', color: 'blue' };
                  if (t.threat_score >= 80) severity = { label: 'CRITICAL', color: 'error' };
                  else if (t.threat_score >= 60) severity = { label: 'HIGH', color: 'warning' };
                  else if (t.threat_score >= 40) severity = { label: 'MEDIUM', color: 'orange' };

                  return {
                    color: phaseInfo?.color,
                    label: <Text type="secondary" style={{ fontSize: '11px' }}>{dayjs(t.created_at).format('HH:mm:ss')}</Text>,
                    children: (
                      <div 
                        onClick={() => setSelectedThreat(t)} 
                        style={{ 
                          cursor: 'pointer', 
                          padding: '16px', 
                          borderRadius: '12px', 
                          backgroundColor: isSelected ? '#fff' : 'transparent', 
                          border: isSelected ? `1px solid ${phaseInfo?.color}` : '1px solid transparent', 
                          boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', 
                          transition: 'all 0.2s ease',
                          marginBottom: '8px'
                        }}
                      >
                        <Flex vertical gap={4}>
                          <Flex justify="space-between" align="center">
                            <Tag color={severity.color} style={{ fontSize: '9px', fontWeight: 'bold', borderRadius: '4px' }}>{severity.label}</Tag>
                            <Text type="secondary" style={{ fontSize: '10px', fontWeight: 600 }}>{phaseInfo?.title}</Text>
                          </Flex>
                          <Text strong style={{ fontSize: '13px' }}>{t.attack_type}</Text>
                        </Flex>
                      </div>
                    )
                  };
                })}
              />
            ) : <Empty />}
          </Col>

          <Col xs={24} md={15} style={{ padding: '32px', overflowY: 'auto', background: '#fff' }}>
            {selectedThreat ? (
              <div className="analysis-detail">
                <Title level={4} style={{ marginTop: 0, marginBottom: '24px', color: '#1e293b' }}>Forensic Evidence (5W1H)</Title>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
                  <div className="info-box">
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>WHO</Text>
                    <Text strong copyable>{selectedThreat.ip_address}</Text>
                  </div>
                  <div className="info-box">
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>WHERE (Target)</Text>
                    <Text strong code style={{ wordBreak: 'break-all' }}>{selectedThreat.target_url}</Text>
                  </div>
                  <div className="info-box">
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>WHAT</Text>
                    <Text strong>{selectedThreat.method} - {selectedThreat.attack_type}</Text>
                  </div>
                  <div className="info-box">
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>OUTCOME</Text>
                    <div>
                      {selectedThreat.status_code < 400 ? <Tag color="warning">REJECTED</Tag> : <Tag color="success">MITIGATED ({selectedThreat.status_code})</Tag>}
                      {selectedThreat.is_blocked === 1 && <Tag color="volcano">AUTO-BLOCKED</Tag>}
                    </div>
                  </div>
                </div>
                
                <Divider />
                
                <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CodeOutlined /> Raw Payload Analysis
                </Title>
                <div style={{ 
                  backgroundColor: '#1e293b', 
                  color: '#e2e8f0', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  fontSize: '13px', 
                  fontFamily: '"Fira Code", monospace', 
                  border: '1px solid #334155',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                   {`[SECURITY_EVENT] ${selectedThreat.method} ${selectedThreat.target_url}\n[TIMESTAMP] ${dayjs(selectedThreat.created_at).format('YYYY-MM-DD HH:mm:ss.SSS')}\n[SOURCE_IP] ${selectedThreat.ip_address}\n[THREAT_SCORE] ${selectedThreat.threat_score}\n\n[PAYLOAD_DATA]\n${selectedThreat.payload}`}
                </div>
              </div>
            ) : (
              <Flex vertical align="center" justify="center" style={{ height: '100%' }}>
                <Empty description={<Text type="secondary">Select an event from the timeline for forensic analysis</Text>} />
              </Flex>
            )}
          </Col>
        </Row>
      </Modal>

      <style>{`
        .glass-card {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }
        .glass-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .pulse-icon {
          animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .world-class-table .ant-table {
          background: transparent;
        }
        .world-class-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600 !important;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
        }
        .world-class-table .ant-table-row {
          transition: all 0.2s ease;
        }
        .world-class-table .ant-table-row:hover > td {
          background-color: #f1f5f9 !important;
        }
        .custom-search .ant-input-affix-wrapper {
          border-radius: 12px;
          border-color: #e2e8f0;
          box-shadow: none;
        }
        .custom-search .ant-input-affix-wrapper:hover, .custom-search .ant-input-affix-wrapper-focused {
          border-color: #3b82f6;
        }
        .ip-list-item {
          transition: background 0.2s ease;
          border-radius: 12px;
          padding: 8px 12px !important;
        }
        .ip-list-item:hover {
          background: #f8fafc;
        }
        .analysis-detail .info-box {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
}
