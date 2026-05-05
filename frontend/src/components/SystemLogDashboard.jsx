import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Table, Typography, Tag, Space, Button, Input, Select, 
  Row, Col, Statistic, Tooltip, Badge, Modal, Empty, Descriptions
} from 'antd';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  SafetyCertificateOutlined, BugOutlined, RocketOutlined, 
  SearchOutlined, SyncOutlined, HistoryOutlined, WarningOutlined,
  EyeOutlined, GlobalOutlined, FieldTimeOutlined, DownloadOutlined,
  EditOutlined, SwapRightOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  SettingOutlined, ToolOutlined, DatabaseOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import axiosInstance from '../services/api/axiosInstance';
import { formatThaiDate } from '../utils/dateUtils';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function SystemLogDashboard() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ level: '', category: '', search: '' });
  const [pageSize, setPageSize] = useState(20);
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'User', 'IP Address', 'Method', 'Path', 'Duration (ms)'];
    const csvData = logs.map(log => [
      `"${formatThaiDate(log.timestamp)}"`,
      `"${log.level}"`,
      `"${log.category}"`,
      `"${log.message.replace(/"/g, '""')}"`,
      `"${log.fullname || log.username || 'System'}"`,
      `"${log.ip_address}"`,
      `"${log.method || ''}"`,
      `"${log.path || ''}"`,
      `"${log.duration || 0}"`
    ]);
    const csvContent = [headers, ...csvData].map(e => e.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/audit/stats');
      setStats(res.data);
    } catch (error) { console.error("Fetch stats error:", error); }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { level, category, search } = filter;
      const res = await axiosInstance.get('/audit/system', {
        params: { level, category, search, limit: 500 }
      });
      setLogs(res.data);
    } catch (error) { console.error("Fetch system logs error:", error); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => {
    fetchStats();
    fetchLogs();
    const interval = setInterval(() => { fetchStats(); fetchLogs(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchLogs]);

  const getLevelTag = (level) => {
    const colors = { INFO: 'blue', WARN: 'orange', ERROR: 'red', CRITICAL: 'magenta' };
    return <Tag color={colors[level] || 'default'}>{level}</Tag>;
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'ACCESS': return <SafetyCertificateOutlined style={{ color: '#52c41a' }} />;
      case 'TRAFFIC': return <GlobalOutlined style={{ color: '#1890ff' }} />;
      case 'SECURITY': return <WarningOutlined style={{ color: '#eb2f96' }} />;
      case 'ERROR': return <BugOutlined style={{ color: '#f5222d' }} />;
      case 'SYSTEM': return <RocketOutlined style={{ color: '#722ed1' }} />;
      default: return <HistoryOutlined />;
    }
  };

  const showLogDetail = (log) => {
    setSelectedLog(log);
    setModalVisible(true);
  };

  const renderIntelligenceAnalysis = (log) => {
    if (!log) return null;
    let analysisData = {
      title: "บทวิเคราะห์เหตุการณ์ (Event Insight)",
      summary: "",
      items: [],
      changes: null,
      note: "* วิเคราะห์โดยระบบ AI อัจฉริยะ เพื่อความสะดวกในการตรวจสอบ"
    };

    const msg = log.message || "";
    let meta = {};
    try { meta = log.metadata ? JSON.parse(log.metadata) : {}; } catch(e) {}

    if (msg.includes('SYSTEM_SETTINGS_UPDATED') || msg.includes('อัปเดตการตั้งค่าระบบ')) {
        analysisData.title = "รายละเอียดการปรับปรุงระบบ (System Config Update)";
        const count = meta.changes_list?.length || 0;
        analysisData.summary = `มีการปรับแต่งค่ากำหนดของระบบจำนวน ${count} รายการ เพื่อให้ระบบทำงานได้ตรงตามนโยบายล่าสุดขององค์กร`;
        analysisData.items.push({ label: "ประเภทกิจกรรม", value: "ปรับปรุงคอนฟิกส่วนกลาง", icon: <SettingOutlined /> });
        analysisData.items.push({ label: "ความสำคัญ", value: "สูง: มีผลต่อพฤติกรรมของระบบในภาพรวม", color: "#faad14" });
        if (meta.changes_list) analysisData.changes = meta.changes_list;
    } 
    else if (log.level === 'CRITICAL' || log.level === 'ERROR') {
        analysisData.title = "บทวิเคราะห์ข้อผิดพลาด (Technical Diagnostic)";
        if (msg.includes('connection') || msg.includes('database')) {
            analysisData.summary = "ระบบพบปัญหาในการเชื่อมต่อฐานข้อมูล ซึ่งอาจทำให้ผู้ใช้งานบันทึกข้อมูลไม่ได้ชั่วคราว";
            analysisData.items.push({ label: "ข้อแนะนำ", value: "ตรวจสอบสถานะ Database Server หรือ MySQL Service ทันที", color: "#f5222d" });
        } else {
            analysisData.summary = "เกิดข้อผิดพลาดในการประมวลผลคำสั่ง ซึ่งอาจเกิดจากโค้ดหรือไฟล์บางอย่างสูญหาย";
            analysisData.items.push({ label: "จุดที่ควรเช็ค", value: "โปรดนำ Stack Trace ด้านล่างส่งให้ทีมพัฒนาตรวจสอบ", icon: <ToolOutlined /> });
        }
    }
    else if (log.category === 'ACCESS' || log.category === 'SECURITY') {
        analysisData.title = "รายละเอียดความปลอดภัยและการเข้าใช้";
        if (msg.includes('Login') || msg.includes('LOGIN')) {
            const isFail = msg.includes('Failed') || msg.includes('FAILED');
            analysisData.summary = isFail 
                ? "ตรวจพบความพยายามเข้าสู่ระบบที่ไม่ถูกต้อง ซึ่งอาจเป็นการพิมพ์ผิดหรือการพยายามสุ่มรหัสผ่าน" 
                : "ผู้ใช้สามารถเข้าใช้งานระบบได้ตามปกติภายใต้การยืนยันตัวตนที่ถูกต้อง";
            analysisData.items.push({ label: "การประเมิน", value: isFail ? "ระวังการสุ่มรหัสผ่านจาก IP นี้" : "ปลอดภัย: เป็นกิจกรรมปกติ", color: isFail ? "#cf1322" : "#52c41a", icon: isFail ? <ExclamationCircleOutlined /> : <CheckCircleOutlined /> });
        } else if (msg.includes('LOGOUT')) {
            analysisData.title = "รายละเอียดการออกจากระบบ (Session Closure)";
            analysisData.summary = "ผู้ใช้งานจบบริบทการทำงานและออกจากระบบอย่างสมบูรณ์ - ระบบทำการล้างข้อมูลการพิสูจน์ตัวตน (Token) ออกจากหน่วยความจำทันที";
            analysisData.items.push({ label: "ประเภทกิจกรรม", value: "การสิ้นสุดเซสชันอย่างปลอดภัย (Secure Logout)", icon: <SafetyCertificateOutlined /> });
            analysisData.items.push({ label: "สถานะความปลอดภัย", value: "ดีเยี่ยม: ไม่พบความเสี่ยงจากการค้างของเซสชัน", color: "#52c41a", icon: <CheckCircleOutlined /> });
        }
    }
    else if (log.category === 'OPERATIONAL') {
        analysisData.title = "รายละเอียดกิจกรรมทางข้อมูล";
        analysisData.summary = "ผู้ใช้งานมีการทำรายการเกี่ยวกับข้อมูลหลัก (เช่น ใบงาน, ผู้ใช้, หรือโปรเจกต์) ในฐานข้อมูล";
        analysisData.items.push({ label: "กิจกรรม", value: msg.split(':')[0] || "อัปเดตข้อมูล", icon: <EditOutlined /> });
        if (meta.fields_changed) {
            analysisData.items.push({ label: "รายละเอียด", value: `เปลี่ยนฟิลด์: ${meta.fields_changed.join(', ')}` });
        }
        if (meta.action === 'TICKET_STATUS_UPDATED') {
            analysisData.items.push({ label: "ใบงานที่แก้ไข", value: `รหัส: ${meta.ticket_id} (สถานะใหม่: ${meta.new_status})` });
        }
    }
    else if (log.category === 'TRAFFIC') {
        const regex = /^([A-Z]+) (.+) - (\d+) \((\d+)ms\)$/;
        const match = msg.match(regex);
        if (match) {
            const [_, method, path, status, duration] = match;
            analysisData.title = "วิเคราะห์ทราฟฟิก API";
            analysisData.summary = `มีการเรียกใช้บริการผ่านทาง ${path}`;
            analysisData.items.push({ label: "ความเร็วตอบสนอง", value: parseInt(duration) < 100 ? "ยอดเยี่ยม (Excellent)" : "ปกติ", icon: <FieldTimeOutlined /> });
            
            let statusText = `รหัส ${status}`;
            let statusCol = "#1e293b";
            if (status === '200') { statusText = "สำเร็จ (OK): ระบบส่งข้อมูลให้เรียบร้อย"; statusCol = "#52c41a"; }
            else if (status === '304') { statusText = "ข้อมูลเดิม (Not Modified): ไม่มีการเปลี่ยนแปลง (ใช้ไฟล์เดิมที่มีอยู่ได้เลย ไม่ต้องเสียเวลาโหลดใหม่) ระบบจึงดึงข้อมูลจาก Cache มาแสดงผลทันที"; statusCol = "#1890ff"; }
            else if (status.startsWith('4')) { statusText = "คำขอไม่ถูกต้องหรือไม่มีสิทธิ์"; statusCol = "#f5222d"; }

            analysisData.items.push({ label: "ผลลัพธ์", value: statusText, color: statusCol });
        }
    }

    if (analysisData.items.length === 0 && !analysisData.changes) return null;

    return (
      <div style={{ marginTop: 20, padding: 20, background: '#f0f5ff', borderRadius: 16, border: '1px solid #d6e4ff', boxShadow: '0 4px 12px rgba(22,119,255,0.05)' }}>
        <Title level={5} style={{ color: '#003a8c', marginBottom: 12 }}><InfoCircleOutlined /> {analysisData.title}</Title>
        {analysisData.summary && <Paragraph style={{ fontSize: '14px', color: '#1e293b', marginBottom: 16, borderLeft: '4px solid #1677ff', paddingLeft: 12 }}>{analysisData.summary}</Paragraph>}
        
        {analysisData.items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analysisData.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', borderBottom: i < analysisData.items.length - 1 ? '1px solid #e6f4ff' : 'none', paddingBottom: '8px' }}>
                        <div style={{ minWidth: '160px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.icon || <div style={{ width: 14 }} />}
                            <Text strong style={{ fontSize: '12px' }}>{item.label}:</Text>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Text style={{ color: item.color || '#1e293b', fontSize: '13px' }}>{item.value}</Text>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {analysisData.changes && (
            <div style={{ marginTop: 16, background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}><EditOutlined /> รายละเอียดการเปลี่ยนแปลงค่า:</Text>
                {analysisData.changes.map((c, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: i < analysisData.changes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>{c.field}</Text>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                            <Tag color="default" style={{ textDecoration: 'line-through', fontSize: '11px' }}>{c.old}</Tag>
                            <SwapRightOutlined style={{ color: '#94a3b8', margin: '0 8px' }} />
                            <Tag color="blue" style={{ fontWeight: 'bold' }}>{c.new}</Tag>
                        </div>
                    </div>
                ))}
            </div>
        )}
        <Paragraph style={{ marginTop: 15, fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginBottom: 0 }}>{analysisData.note}</Paragraph>
      </div>
    );
  };

  const columns = [
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: 180, render: (t) => <Text style={{ fontSize: 12 }}>{formatThaiDate(t)}</Text> },
    { title: 'Level', dataIndex: 'level', key: 'level', width: 100, render: (l) => getLevelTag(l) },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 120, render: (c) => <Space>{getCategoryIcon(c)} <Text strong style={{ fontSize: 12 }}>{c}</Text></Space> },
    { title: 'Message', dataIndex: 'message', key: 'message', render: (m) => <Text ellipsis={{ tooltip: m }}>{m}</Text> },
    { title: 'Details', key: 'actions', width: 80, render: (_, record) => <Button icon={<EyeOutlined />} size="small" onClick={() => showLogDetail(record)} /> }
  ];

  return (
    <div style={{ padding: '12px', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div><Title level={2} style={{ margin: 0 }}><HistoryOutlined /> Global Log Center</Title><Text type="secondary">ระบบตรวจสอบสถานะและความปลอดภัยแบบเรียลไทม์</Text></div>
        <Space><Button icon={<DownloadOutlined />} onClick={exportToCSV} disabled={logs.length === 0}>Export CSV</Button><Button type="primary" icon={<SyncOutlined />} onClick={() => { fetchStats(); fetchLogs(); }} loading={loading}>Refresh Now</Button></Space>
      </div>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card variant="borderless"><Statistic title="Total API Traffic" value={stats?.categoryStats?.find(s => s.category === 'TRAFFIC')?.count || 0} prefix={<GlobalOutlined />} styles={{ content: { color: '#1890ff' } }}/></Card></Col>
        <Col xs={12} md={6}><Card variant="borderless"><Statistic title="System Errors" value={stats?.levelStats?.find(s => s.level === 'ERROR')?.count || 0} prefix={<BugOutlined />} styles={{ content: { color: '#f5222d' } }}/></Card></Col>
        <Col xs={12} md={6}><Card variant="borderless"><Statistic title="Security Alerts" value={stats?.categoryStats?.find(s => s.category === 'SECURITY')?.count || 0} prefix={<WarningOutlined />} styles={{ content: { color: '#faad14' } }}/></Card></Col>
        <Col xs={12} md={6}><Card variant="borderless"><Statistic title="Login Events" value={stats?.categoryStats?.find(s => s.category === 'ACCESS')?.count || 0} prefix={<SafetyCertificateOutlined />} styles={{ content: { color: '#52c41a' } }}/></Card></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}><Card title="สุขภาพระบบรายวัน" variant="borderless" style={{ borderRadius: 8, height: 350 }}>
          {stats?.errorTimeline?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.errorTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5222d" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f5222d" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c41d7f" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#c41d7f" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => { const d = new Date(val); return isNaN(d.getTime()) ? val : `${d.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][d.getMonth()]}`; }} />
                <YAxis fontSize={10} allowDecimals={false} axisLine={false} tickLine={false} />
                <ChartTooltip labelFormatter={(val) => `วันที่: ${new Date(val).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area name="Error" type="monotone" dataKey="error_count" stroke="#f5222d" strokeWidth={3} fill="url(#colorError)" dot={{ r: 4, fill: '#f5222d', strokeWidth: 2, stroke: '#fff' }} />
                <Area name="Critical" type="monotone" dataKey="critical_count" stroke="#c41d7f" strokeWidth={3} fill="url(#colorCritical)" dot={{ r: 4, fill: '#c41d7f', strokeWidth: 2, stroke: '#fff' }} />
                <Area name="Security" type="monotone" dataKey="security_count" stroke="#faad14" strokeWidth={2} fill="transparent" strokeDasharray="5 5" dot={{ r: 3, fill: '#faad14' }} />
                <Area name="Login" type="monotone" dataKey="access_count" stroke="#52c41a" strokeWidth={3} fill="url(#colorAccess)" dot={{ r: 4, fill: '#52c41a', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty description="ไม่พบข้อมูลสถิติย้อนหลัง" />}</Card></Col>

        <Col xs={24} md={6}>
          <Card title="เรดาร์เตือนภัย (Suspicious IPs)" variant="borderless" style={{ borderRadius: 8, height: 350, overflow: 'hidden' }}>
            <div style={{ height: 260, overflowY: 'auto' }}>
              {stats?.suspiciousIPs?.length > 0 ? (
                stats.suspiciousIPs.map((item, idx) => (
                    <div key={idx} style={{ padding: '12px 8px', borderBottom: idx < stats.suspiciousIPs.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
                            <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                            <Text strong style={{ fontSize: 13, color: '#f5222d' }}>{item.ip_address}</Text>
                        </div>
                        <div style={{ paddingLeft: 22 }}>
                            <Badge color="red" text={<Text style={{ fontSize: 11 }}>สุ่มผิด {item.failed_attempts} ครั้ง</Text>} />
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>ล่าสุด: {formatThaiDate(item.last_attempt)}</div>
                        </div>
                    </div>
                ))
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                  <SafetyCertificateOutlined style={{ fontSize: 40, color: '#52c41a', marginBottom: 16 }} />
                  <Text strong style={{ fontSize: 12 }}>ไม่พบการสุ่มรหัสผ่าน</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card title="Slowest APIs" variant="borderless" style={{ borderRadius: 8, height: 350, overflow: 'hidden' }}>
            <div style={{ height: 260, overflowY: 'auto' }}>
              {stats?.slowApis?.length > 0 ? (
                stats.slowApis.map((item, idx) => (
                    <div key={idx} style={{ padding: '12px 8px', borderBottom: idx < stats.slowApis.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
                            <Tag color={item.method === 'GET' ? 'green' : 'blue'} style={{ fontSize: '10px', margin: 0 }}>{item.method}</Tag>
                            <Tooltip title={item.path}><Text strong style={{ fontSize: 11, maxWidth: '100px' }} ellipsis>{item.path}</Text></Tooltip>
                        </div>
                        <div style={{ paddingLeft: 42 }}>
                            <Badge color="volcano" text={<Text type="danger" style={{ fontSize: 11 }}>{Math.round(item.avg_duration)}ms</Text>} />
                            <Text type="secondary" style={{ fontSize: 10, marginLeft: 8 }}>({item.call_count} ครั้ง)</Text>
                        </div>
                    </div>
                ))
              ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </div>
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" style={{ borderRadius: 8 }}>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={8}>
            <Col xs={24} md={6}><Input placeholder="ค้นหาข้อความ หรือ IP..." prefix={<SearchOutlined />} value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} /></Col>
            <Col xs={12} md={4}><Select placeholder="Level" style={{ width: '100%' }} allowClear onChange={v => setFilter({ ...filter, level: v })}><Option value="INFO">INFO</Option><Option value="WARN">WARN</Option><Option value="ERROR">ERROR</Option><Option value="CRITICAL">CRITICAL</Option></Select></Col>
            <Col xs={12} md={4}><Select placeholder="หมวดหมู่" style={{ width: '100%' }} allowClear onChange={v => setFilter({ ...filter, category: v })}><Option value="ACCESS">ACCESS</Option><Option value="TRAFFIC">TRAFFIC</Option><Option value="SECURITY">SECURITY</Option><Option value="ERROR">ERROR</Option><Option value="SYSTEM">SYSTEM</Option><Option value="OPERATIONAL">OPERATIONAL</Option></Select></Col>
            <Col md={2}><Button type="primary" icon={<SearchOutlined />} onClick={fetchLogs}>Search</Button></Col>
          </Row>
        </div>
        <Table columns={columns} dataSource={logs} rowKey="id" loading={loading} pagination={{ pageSize: pageSize, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], onShowSizeChange: (current, size) => setPageSize(size) }} scroll={{ x: 1000 }} size="small" />
      </Card>

      <Modal title={<Title level={4} style={{ margin: 0 }}><EyeOutlined /> รายละเอียดการวิเคราะห์ Log อัจฉริยะ</Title>} open={modalVisible} onCancel={() => setModalVisible(false)} footer={[<Button key="close" type="primary" onClick={() => setModalVisible(false)}>ปิดหน้าต่าง</Button>]} width={700}>
        {selectedLog && (
          <div style={{ padding: '10px' }}>
            <Row gutter={[16, 16]}><Col span={12}><Statistic title="วันเวลาที่เกิดเหตุการณ์" value={formatThaiDate(selectedLog.timestamp)} styles={{ content: { fontSize: 14 } }} /></Col><Col span={6}><Statistic title="ระดับความรุนแรง" value={selectedLog.level} styles={{ content: { fontSize: 14 } }} /></Col><Col span={6}><Statistic title="ที่อยู่ IP (IP Address)" value={selectedLog.ip_address} styles={{ content: { fontSize: 14 } }} /></Col></Row>
            
            <Row gutter={[16, 16]} style={{ marginTop: 15, padding: '15px', background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <Col span={12}><Text type="secondary" style={{ fontSize: '11px' }}>👤 ผู้ดำเนินการ (Full Name):</Text><br /><Text strong style={{ fontSize: '14px' }}>{selectedLog.fullname || 'ระบบอัตโนมัติ (System)'}</Text>{selectedLog.username && <div style={{ fontSize: '11px', color: '#8c8c8c' }}>Username: <Text code style={{ fontSize: '10px' }}>{selectedLog.username}</Text></div>}</Col>
              <Col span={12}><Text type="secondary" style={{ fontSize: '11px' }}>🔑 รหัสผู้ใช้ (User ID):</Text><br /><Tag color="blue">{selectedLog.user_id || 'N/A'}</Tag></Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
              <Col span={24}><Text strong>📝 ข้อความรายละเอียดระบบ (System Message):</Text><Paragraph style={{ background: '#fafafa', padding: 15, borderRadius: 12, marginTop: 8, borderLeft: `5px solid ${selectedLog.level === 'ERROR' ? '#ff4d4f' : (selectedLog.level === 'CRITICAL' ? '#722ed1' : '#1890ff')}`, color: '#334155' }}>{selectedLog.message}</Paragraph></Col>
            </Row>

            {renderIntelligenceAnalysis(selectedLog)}
            
            {selectedLog.metadata && !selectedLog.message.includes('SYSTEM_SETTINGS_UPDATED') && (
              <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}><Text strong>🔍 ข้อมูลเชิงลึกและบริบท (Metadata & Context):</Text><pre style={{ background: '#1e293b', color: '#38bdf8', padding: 20, borderRadius: 12, marginTop: 12, overflowX: 'auto', fontSize: '12px', border: '1px solid #334155' }}>{JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}</pre></Col>
              </Row>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
