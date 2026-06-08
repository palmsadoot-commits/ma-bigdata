import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, Row, Col, Typography, Table, Button, Space, Tag, 
  Statistic, Steps, Divider, Empty, Modal, message, Badge, Tooltip,
  Timeline, List, Avatar, Progress, theme, Flex, Descriptions
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
  CodeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError, alertConfirm } from '../utils/alert';

const { Title, Text, Paragraph } = Typography;

/**
 * 🛡️ Security Command Center - World Class Redesign
 * ฟีเจอร์: การวิเคราะห์ Kill Chain แบบไทม์ไลน์ และ UI แบบ Clean Enterprise
 */
export default function SecurityCommandCenter() {
  const { token } = theme.useToken();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState([]);
  const [blockedIps, setBlockedIps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIp, setSelectedIp] = useState(null); 
  const [selectedThreat, setSelectedThreat] = useState(null); // ✅ สำหรับวิเคราะห์ 5W1H รายเหตุการณ์
  const [isTimelineModalVisible, setIsTimelineModalVisible] = useState(false);

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
      message.error("NETWORK ERROR: SECURITY DATA FETCH FAILED");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    const interval = setInterval(fetchSecurityData, 30000); // Live refresh ทุก 30 วินาที
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [fetchSecurityData]);

  // --- 🛠️ Logic & Calculations ---
  
  // จัดกลุ่มภัยคุกคามตาม IP เพื่อสร้าง Timeline Journey
  const attackerJourneys = useMemo(() => {
    const journeys = {};
    threats.forEach(t => {
      if (!journeys[t.ip_address]) journeys[t.ip_address] = [];
      journeys[t.ip_address].push(t);
    });
    return journeys;
  }, [threats]);

  const handleBlockIp = async (ip) => {
    const result = await alertConfirm('CONFIRM IP BLOCK', `Are you sure you want to block IP: ${ip} immediately? Access will be terminated.`);
    if (result.isConfirmed) {
      try {
        await axiosInstance.post('/security/block-ip', { ip_address: ip, reason: 'Detected malicious activity' });
        alertSuccess('BLOCK SUCCESS', `IP ${ip} suspended.`);
        fetchSecurityData();
      } catch (err) {
        alertError('ERROR', 'Failed to block IP.');
      }
    }
  };

  const handleUnblockIp = async (ip) => {
    try {
      await axiosInstance.post('/security/unblock-ip', { ip_address: ip });
      alertSuccess('UNBLOCK SUCCESS', `IP ${ip} reinstated.`);
      fetchSecurityData();
    } catch (err) {
      alertError('ERROR', 'Failed to unblock IP.');
    }
  };

  const showTimeline = (ip) => {
    setSelectedIp(ip);
    // ✅ เลือกเหตุการณ์ล่าสุดมาแสดง 5W1H เป็นค่าเริ่มต้น
    if (attackerJourneys[ip] && attackerJourneys[ip].length > 0) {
      setSelectedThreat(attackerJourneys[ip][0]);
    }
    setIsTimelineModalVisible(true);
  };

  // --- 🎨 UI Components ---

  const killChainPhases = [
    { key: 'Reconnaissance', title: 'RECONNAISSANCE', desc: 'Active scanning and system mapping.', color: '#3b82f6', icon: <EyeOutlined /> },
    { key: 'Access', title: 'ACCESS ATTEMPT', desc: 'Authentication bypass efforts.', color: '#f59e0b', icon: <ThunderboltOutlined /> },
    { key: 'Execution', title: 'ATTACK EXECUTION', desc: 'Malicious payload injection (SQLi, XSS).', color: '#ef4444', icon: <WarningOutlined /> },
    { key: 'Persistence', title: 'PERSISTENCE', desc: 'Long-term foothold attempt.', color: '#8b5cf6', icon: <LockOutlined /> }
  ];

  const columns = [
    {
      title: 'ATTACKER',
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
            VIEW ATTACK JOURNEY
          </Button>
        </Flex>
      )
    },
    {
      title: 'KILL CHAIN PHASE',
      dataIndex: 'kill_chain_phase',
      key: 'phase',
      render: (phase) => {
        const info = killChainPhases.find(p => p.key === phase);
        return (
          <Tag color={info?.color} style={{ borderRadius: '4px', padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
            {info?.title || phase}
          </Tag>
        );
      }
    },
    {
      title: 'ATTACK TYPE',
      dataIndex: 'attack_type',
      key: 'what',
      render: (text) => <Text strong style={{ color: 'var(--text-main)', fontSize: 13 }}>{text.toUpperCase()}</Text>
    },
    {
      title: 'TARGET',
      dataIndex: 'target_url',
      key: 'where',
      render: (text, record) => (
        <Tooltip title={`Method: ${record.method}`}>
          <div style={{ maxWidth: '200px' }}>
            <Text code ellipsis style={{ fontSize: '11px' }}>{text}</Text>
          </div>
        </Tooltip>
      )
    },
    {
      title: 'TIMESTAMP',
      dataIndex: 'created_at',
      key: 'when',
      render: (date) => <Text type="secondary" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{dayjs(date).format('DD/MM/YY HH:mm:ss')}</Text>
    },
    {
      title: 'ACTION',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space>
          {!blockedIps.some(b => b.ip_address === record.ip_address) ? (
            <Button danger ghost size="small" icon={<StopOutlined />} onClick={() => handleBlockIp(record.ip_address)}>TERMINATE</Button>
          ) : (
            <Button size="small" icon={<SyncOutlined />} onClick={() => handleUnblockIp(record.ip_address)}>REINSTATE</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 'clamp(16px, 3vw, 32px)', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>
            SECURITY COMMAND CENTER
          </Title>
          <Text type="secondary" style={{ letterSpacing: '0.02em' }}>REAL-TIME THREAT ANALYSIS AND PERIMETER CONTROL</Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={() => message.info("EXPORT CAPABILITY: PENDING NEXT UPDATE")}>EXPORT DATA</Button>
          <Button type="primary" icon={<SyncOutlined />} onClick={fetchSecurityData} loading={loading} style={{ fontWeight: 600 }}>REFRESH INTEL</Button>
        </Space>
      </div>

      {/* Kill Chain Pipeline Visual */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {killChainPhases.map((phase) => {
          const count = stats.find(s => s.phase === phase.key)?.count || 0;
          return (
            <Col xs={24} sm={12} lg={6} key={phase.key}>
              <Card 
                variant="borderless" 
                hoverable
                style={{ borderRadius: '16px', boxShadow: 'var(--card-shadow)', borderTop: `4px solid ${phase.color}`, transition: 'all 0.3s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${phase.color}15`, color: phase.color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                    {phase.icon}
                  </div>
                  <Badge count={count} overflowCount={999} style={{ backgroundColor: phase.color }} />
                </div>
                <div style={{ marginTop: '16px' }}>
                  <Title level={4} style={{ margin: 0, fontSize: '16px' }}>{phase.title}</Title>
                  <Text type="secondary" style={{ fontSize: '12px' }}>{phase.desc}</Text>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row gutter={[24, 24]}>
        {/* Main Intelligence Table */}
        <Col xs={24} xl={17}>
          <Card 
            title={<Space><SecurityScanOutlined /> บันทึกเหตุการณ์ภัยคุกคามล่าสุด</Space>}
            variant="borderless"
            style={{ borderRadius: '16px', boxShadow: 'var(--card-shadow)' }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              dataSource={threats}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 'max-content' }}
              className="enterprise-table"
            />
          </Card>
        </Col>

        {/* IP Block List & Insights */}
        <Col xs={24} xl={7}>
          <Flex vertical gap="large" style={{ width: '100%' }}>
            <Card 
              title={<Space><StopOutlined style={{ color: '#ef4444' }} /> รายการ IP ที่ถูกปิดกั้น</Space>}
              variant="borderless"
              style={{ borderRadius: '16px', boxShadow: 'var(--card-shadow)' }}
              extra={<Badge count={blockedIps.length} showZero color="#ef4444" />}
            >
              {blockedIps.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ยังไม่มีการปิดกั้น IP" />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={blockedIps}
                  maxHeight={400}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="text" danger icon={<SyncOutlined />} onClick={() => handleUnblockIp(item.ip_address)} />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<GlobalOutlined />} style={{ backgroundColor: '#fee2e2', color: '#ef4444' }} />}
                        title={<Text strong>{item.ip_address}</Text>}
                        description={<Text type="secondary" style={{ fontSize: '11px' }}>ระงับเมื่อ: {dayjs(item.created_at).format('DD/MM HH:mm')}</Text>}
                      />
                    </List.Item>
                  )}
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                />
              )}
            </Card>

            <Card 
              title={<Space><InfoCircleOutlined /> ข้อมูลสรุปความปลอดภัย</Space>}
              variant="borderless"
              style={{ borderRadius: '16px', boxShadow: 'var(--card-shadow)', background: `linear-gradient(135deg, ${token.colorPrimary}05 0%, ${token.colorPrimary}15 100%)` }}
            >
              <div style={{ marginBottom: '16px' }}>
                <Text strong>ระดับความเสี่ยงโดยรวม</Text>
                <Progress 
                  percent={threats.length > 50 ? 90 : threats.length * 2} 
                  status={threats.length > 30 ? "exception" : "active"}
                  strokeColor={threats.length > 30 ? '#ef4444' : '#10b981'}
                />
              </div>
              <Paragraph style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                ระบบทำการตรวจสอบความผิดปกติจากรูปแบบ Traffic และ User-Agent อย่างต่อเนื่อง หากพบความเสี่ยงระดับสูง แนะนำให้ทำการระงับ IP ทันที
              </Paragraph>
            </Card>
          </Flex>
        </Col>
      </Row>

      {/* 🗓️ Attack Journey Timeline Modal (World Class Analysis View) */}
      <Modal
        title={
          <Space>
            <HistoryOutlined style={{ color: token.colorPrimary }} />
            <span>ATTACK ANALYSIS: <Text strong type="danger">{selectedIp}</Text></span>
          </Space>
        }
        open={isTimelineModalVisible}
        onCancel={() => setIsTimelineModalVisible(false)}
        footer={[<Button key="close" onClick={() => setIsTimelineModalVisible(false)}>CLOSE</Button>]}
        width={isMobile ? '95%' : 1000}
        centered
        styles={{ body: { padding: isMobile ? '12px' : '24px', backgroundColor: 'var(--bg-app)' } }}
      >
        <Row gutter={[24, 24]}>
          {/* Left: Timeline Summary */}
          <Col xs={24} md={10} style={{ 
            borderRight: isMobile ? 'none' : '1px solid var(--border-color)', 
            borderBottom: isMobile ? '1px solid var(--border-color)' : 'none',
            paddingBottom: isMobile ? 24 : 0,
            maxHeight: isMobile ? '40vh' : '65vh', 
            overflowY: 'auto' 
          }}>
            <Title level={5} style={{ marginBottom: '20px', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>KILL CHAIN SEQUENCE</Title>
            {selectedIp && attackerJourneys[selectedIp] ? (
              <Timeline
                mode="start"
                items={attackerJourneys[selectedIp].map(t => {
                  const phaseInfo = killChainPhases.find(p => p.key === t.kill_chain_phase);
                  const isSelected = selectedThreat?.id === t.id;
                  
                  // คำนวณระดับความรุนแรงจาก Score
                  let severity = { label: 'LOW', color: 'blue' };
                  if (t.threat_score >= 80) severity = { label: 'CRITICAL', color: 'error' };
                  else if (t.threat_score >= 60) severity = { label: 'HIGH', color: 'warning' };
                  else if (t.threat_score >= 40) severity = { label: 'MEDIUM', color: 'orange' };

                  return {
                    color: phaseInfo?.color,
                    title: <Text type="secondary" style={{ fontSize: '10px', fontFamily: 'monospace' }}>{dayjs(t.created_at).format('HH:mm:ss')}</Text>,
                    content: (
                      <div 
                        onClick={() => setSelectedThreat(t)}
                        style={{ 
                          cursor: 'pointer',
                          padding: '12px', 
                          borderRadius: '8px', 
                          backgroundColor: isSelected ? `${phaseInfo?.color}15` : 'var(--bg-card)',
                          border: isSelected ? `1px solid ${phaseInfo?.color}` : '1px solid var(--border-color)',
                          boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Flex vertical gap={2} style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Tag color={severity.color} style={{ fontSize: '9px', fontWeight: 'bold' }}>{severity.label}</Tag>
                            <Text type="secondary" style={{ fontSize: '9px', fontWeight: 600 }}>{phaseInfo?.title}</Text>
                          </div>
                          <Text strong style={{ fontSize: '12px', display: 'block' }}>{t.attack_type.toUpperCase()}</Text>
                        </Flex>
                      </div>
                    )
                  };
                })}
              />
            ) : <Empty />}
          </Col>

          {/* Right: 5W1H & Raw Log Analysis */}
          <Col xs={24} md={14}>
            {selectedThreat ? (
              <div style={{ backgroundColor: 'var(--bg-card)', padding: isMobile ? '16px' : '24px', borderRadius: '12px', height: '100%', border: '1px solid var(--border-color)' }}>
                <Title level={4} style={{ marginTop: 0, color: token.colorPrimary, fontSize: 16, fontWeight: 800 }}>EVENT ANALYSIS (5W1H)</Title>
                <div style={{ marginBottom: '20px' }}>
                  <Tag color="processing" style={{ fontSize: 10 }}>STATUS: DETECTED</Tag>
                  <Tag color={killChainPhases.find(p => p.key === selectedThreat.kill_chain_phase)?.color} style={{ fontSize: 10 }}>
                    PHASE: {killChainPhases.find(p => p.key === selectedThreat.kill_chain_phase)?.title}
                  </Tag>
                </div>

                <Descriptions 
                  column={1} 
                  size="small" 
                  bordered={false}
                  styles={{ label: { width: isMobile ? '80px' : '120px', fontWeight: 'bold', color: 'var(--text-main)', fontSize: 12 } }}
                >
                  <Descriptions.Item label="WHO">
                    <Text copyable style={{ fontSize: 12 }}>{selectedThreat.ip_address}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="WHAT">
                    <Text style={{ fontSize: 12 }}>{`${selectedThreat.method} MALICIOUS PAYLOAD (${selectedThreat.attack_type.toUpperCase()})`}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="WHERE">
                    <Text code style={{ fontSize: 11 }}>{selectedThreat.target_url}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="WHEN">
                    <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{dayjs(selectedThreat.created_at).format('DD/MM/YYYY HH:mm:ss.SSS')}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="HOW">
                    <Text style={{ fontSize: 11 }}>{`PROTOCOL ABUSE VIA HTTP ${selectedThreat.method}`}</Text>
                  </Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: '20px 0' }} />
                
                <Title level={5} style={{ fontSize: 12, fontWeight: 700 }}>RAW TELEMETRY DATA</Title>
                <div style={{ 
                  backgroundColor: '#020617', 
                  color: '#94a3b8', 
                  padding: '16px', 
                  borderRadius: '6px', 
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid #1e293b'
                }}>
                  {dayjs(selectedThreat.created_at).format('HH:mm:ss')} [SEC_INTEL] {selectedThreat.method} {selectedThreat.target_url} - PAYLOAD: {selectedThreat.payload}
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <Empty description="SELECT EVENT FOR ANALYSIS" />
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
