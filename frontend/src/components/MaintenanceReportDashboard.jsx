import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Row, Col, Typography, Table, Button, Space, Tag, 
  Statistic, DatePicker, Select, Divider, Empty, theme, Flex, Tooltip, Progress, Steps, App, Badge
} from 'antd';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadialBarChart, RadialBar
} from 'recharts';
import { 
  BarChartOutlined, 
  LineChartOutlined, 
  PieChartOutlined, 
  DownloadOutlined, 
  SyncOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  FilterOutlined,
  SolutionOutlined,
  FlagOutlined,
  UndoOutlined,
  AuditOutlined,
  FileProtectOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import axiosInstance from '../services/api/axiosInstance';
import {
  CHART_PALETTE,
  getAxisConfig,
  getGridConfig,
  getTooltipStyle,
  getGradientId,
  getGradientStops,
  getAreaStyle,
  getLegendConfig,
  getChartCardStyle,
  ANIMATION_CONFIG,
} from '../utils/chartTheme';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

export default function MaintenanceReportDashboard() {
  const { token } = theme.useToken();
  const { message: msg } = App.useApp(); // ✅ ใช้ App Hook สำหรับ Message
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: [dayjs().startOf('month'), dayjs().endOf('month')], // ✅ ฟิกค่าเริ่มต้นเป็นต้นเดือนถึงสิ้นเดือน
    projectId: null
  });

  const [kpis, setKpis] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [vendorData, setVendorPerformance] = useState([]);
  const [statusData, setStatusData] = useState([]); // ✅ [New] สำหรับสัดส่วนสถานะ
  const [rawTickets, setRawTickets] = useState([]);

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/projects');
      setProjects(res.data || []);
    } catch (err) { console.error("Metadata Error:", err); }
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    const [start, end] = filters.dateRange;
    const params = {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
      project_id: filters.projectId
    };

    try {
      const [kpiRes, trendRes, catRes, vendorRes, statusRes, detailRes] = await Promise.all([
        axiosInstance.get('/reports/kpis', { params }),
        axiosInstance.get('/reports/trend', { params }),
        axiosInstance.get('/reports/categories', { params }),
        axiosInstance.get('/reports/vendors', { params }),
        axiosInstance.get('/reports/status-breakdown', { params }), 
        axiosInstance.get('/tickets', { params: { ...params, limit: 1000 } })
      ]);

      setKpis(kpiRes.data || {});
      setTrendData(trendRes.data || []);
      setCategoryData(catRes.data || []);
      setVendorPerformance(vendorRes.data || []);
      setStatusData(statusRes.data || []); 
      setRawTickets(detailRes.data || []);
    } catch (err) {
      console.error("Report Fetch Error:", err);
      msg.error("ไม่สามารถโหลดข้อมูลรายงานได้"); // ✅ ใช้ msg จาก App.useApp()
    } finally {
      setLoading(false);
    }
  }, [filters, msg]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const exportToExcel = () => {
    if (rawTickets.length === 0) return msg.warning("ไม่มีข้อมูลสำหรับส่งออก");
    
    const data = rawTickets.map(t => ({
      'เลขที่แจ้งซ่อม': t.ticket_number,
      'สถานะ': t.status,
      'ประเภท': t.category_name,
      'โปรเจกต์': t.project_name,
      'ผู้แจ้ง': t.reporter_name,
      'ผู้รับผิดชอบ': t.assigned_to_name || 'ยังไม่มอบหมาย',
      'บริษัท': t.vendor_name || '-',
      'วันที่แจ้ง': dayjs(t.created_at).format('DD/MM/YYYY HH:mm'),
      'SLA Breach': t.is_sla_breached ? 'ใช่' : 'ไม่',
      'ค่าปรับ (บาท)': t.penalty_amount
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TicketReport");
    XLSX.writeFile(wb, `Report_Maintenance_${dayjs().format('YYYYMMDD')}.xlsx`);
  };

  // --- Theme configs ---
  const axisConfig = getAxisConfig();
  const gridConfig = getGridConfig();
  const tooltipStyle = getTooltipStyle();
  const legendConfig = getLegendConfig();
  const chartCardStyle = getChartCardStyle();
  const kpiCardStyle = { ...chartCardStyle };

  // --- Gradient IDs ---
  const trendGradCreated = getGradientId('maint-trend', 'created');
  const gradStops = getGradientStops('#6366f1');

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      {/* 🚀 Header & Global Filters */}
      <Flex justify="space-between" align="center" style={{ marginBottom: '32px' }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0 }}>รายงานการซ่อมบำรุง (Analytics Dashboard)</Title>
          <Text type="secondary">ตรวจสอบประสิทธิภาพการซ่อมบำรุงและการบริหารจัดการ SLA ระดับ Enterprise</Text>
        </div>
        <Space wrap>
          <RangePicker 
            value={filters.dateRange} 
            onChange={(val) => setFilters(prev => ({ ...prev, dateRange: val }))}
            style={{ borderRadius: '8px' }}
          />
          <Select 
            placeholder="เลือกโปรเจกต์" 
            style={{ width: 200 }} 
            allowClear
            onChange={(val) => setFilters(prev => ({ ...prev, projectId: val }))}
            options={projects.map(p => ({ label: p.project_name, value: p.project_id }))}
          />
          <Button type="primary" icon={<DownloadOutlined />} onClick={exportToExcel}>Export Excel</Button>
          <Tooltip title="คำแนะนำ: รายงานนี้ใช้สำหรับติดตามประสิทธิภาพ SLA และสถานะงานแบบ Real-time">
            <Button shape="circle" icon={<InfoCircleOutlined />} onClick={() => {
              msg.info("ไกด์: Pipeline แสดงการไหลของงานตั้งแต่เริ่ม (แจ้งเคส) จนถึงธงชัย (ปิดเคส) งานจะหยุดนับเวลา SLA เมื่อถึงสถานะ 'ดำเนินการแล้ว' ครับ", 6);
            }} />
          </Tooltip>
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchReportData} />
        </Space>
      </Flex>

      {/* 📊 Executive KPI Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6} className="chart-stat-card">
          <Card className="chart-card" style={kpiCardStyle}>
            <Statistic 
              title={<Text strong style={{ color: CHART_PALETTE[0] }}><SolutionOutlined /> งานแจ้งซ่อมทั้งหมด</Text>} 
              value={kpis.total_tickets || 0} 
              suffix="รายการ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} className="chart-stat-card">
          <Card className="chart-card" style={kpiCardStyle}>
            <Statistic 
              title={<Text strong style={{ color: CHART_PALETTE[2] }}><ClockCircleOutlined /> กำลังดำเนินการ</Text>} 
              value={kpis.active_tickets || 0} 
              styles={{ content: { color: CHART_PALETTE[2] } }}
              suffix="รายการ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} className="chart-stat-card">
          <Card className="chart-card" style={kpiCardStyle}>
            <Statistic 
              title={<Text strong style={{ color: CHART_PALETTE[1] }}><CheckCircleOutlined /> ปิดงานสำเร็จ</Text>} 
              value={kpis.resolved_tickets || 0} 
              styles={{ content: { color: CHART_PALETTE[1] } }}
              suffix="รายการ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} className="chart-stat-card">
          <Card className="chart-card" style={kpiCardStyle}>
            <Statistic 
              title={<Text strong style={{ color: CHART_PALETTE[3] }}><WarningOutlined /> หลุดกำหนด SLA</Text>} 
              value={kpis.sla_breaches || 0} 
              styles={{ content: { color: CHART_PALETTE[3] } }}
              suffix="รายการ"
            />
          </Card>
        </Col>
      </Row>

      {/* 📈 Visual Analytics Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Ticket Volume Trend */}
        <Col xs={24} xl={15} style={{ minWidth: 0 }} className="chart-container">
          <Card 
            title={
              <Space>
                <LineChartOutlined /> 
                {filters.dateRange[1].diff(filters.dateRange[0], 'day') <= 60 
                  ? 'แนวโน้มการแจ้งซ่อมรายวัน (Created vs Resolved)' 
                  : 'แนวโน้มการแจ้งซ่อมรายเดือน (Created vs Resolved)'}
              </Space>
            } 
            variant="borderless" 
            className="chart-card"
            style={chartCardStyle}
          >
            <div style={{ width: '100%', height: 400, minHeight: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id={trendGradCreated} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_PALETTE[0]} stopOpacity={gradStops.topOpacity}/>
                      <stop offset="95%" stopColor={CHART_PALETTE[0]} stopOpacity={gradStops.bottomOpacity}/>
                    </linearGradient>
                    <linearGradient id={getGradientId('maint-trend', 'resolved')} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_PALETTE[1]} stopOpacity={0.12}/>
                      <stop offset="95%" stopColor={CHART_PALETTE[1]} stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridConfig} />
                  <XAxis dataKey="month" {...axisConfig} />
                  <YAxis {...axisConfig} />
                  <ChartTooltip {...tooltipStyle} />
                  <Legend {...legendConfig} />
                  <Area 
                    {...getAreaStyle(CHART_PALETTE[0], trendGradCreated)} 
                    dataKey="created" 
                    name="งานแจ้งซ่อมใหม่" 
                  />
                  <Area 
                    {...getAreaStyle(CHART_PALETTE[1], getGradientId('maint-trend', 'resolved'))} 
                    dataKey="resolved" 
                    name="ปิดงานสำเร็จ" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Category Distribution - Horizontal Bar */}
        <Col xs={24} xl={9} style={{ minWidth: 0 }} className="chart-container">
          <Card 
            title={<Space><PieChartOutlined /> สัดส่วนปัญหาตามหมวดหมู่</Space>} 
            variant="borderless" 
            className="chart-card"
            style={chartCardStyle}
          >
            <div style={{ width: '100%', height: 400, minHeight: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid {...gridConfig} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={150} 
                    {...axisConfig}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text x={-5} y={0} dy={4} textAnchor="end" fill={axisConfig.tick.fill} fontSize={10}>
                            {payload.value.length > 25 ? `${payload.value.substring(0, 25)}...` : payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <ChartTooltip {...tooltipStyle} />
                  <Bar 
                    dataKey="value" 
                    name="จำนวน (รายการ)" 
                    radius={[0, 8, 8, 0]}
                    {...ANIMATION_CONFIG}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* 🚀 Maintenance Lifecycle Efficiency (Radial Chart & Flow) */}
        <Col xs={24} xl={10} style={{ minWidth: 0 }} className="chart-container">
          <Card 
            title={<Space><SyncOutlined spin={loading} style={{ color: token.colorPrimary }} /> ท่อกระบวนการทำงาน (Maintenance Pipeline)</Space>} 
            variant="borderless" 
            className="chart-card"
            style={{ ...chartCardStyle, height: '100%' }}
          >
            <Row gutter={16} align="middle">
              <Col span={14}>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <RadialBarChart 
                      cx="50%" cy="50%" 
                      innerRadius="20%" outerRadius="100%" 
                      barSize={15} 
                      data={statusData.map((s, i) => ({ ...s, fill: s.color || CHART_PALETTE[i % CHART_PALETTE.length] }))}
                    >
                      <RadialBar
                        minAngle={15}
                        background
                        clockWise
                        dataKey="value"
                        cornerRadius={10}
                        {...ANIMATION_CONFIG}
                      />
                      <ChartTooltip 
                        formatter={(value, name, entry) => [`${value} รายการ`, entry.payload.name]}
                        {...tooltipStyle}
                        labelStyle={{ display: 'none' }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </Col>
              <Col span={10}>
                <Flex vertical gap={12}>
                  {statusData.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge color={item.color} />
                      <div style={{ flex: 1 }}>
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>{item.name}</Text>
                        <Text strong>{item.value} รายการ</Text>
                      </div>
                    </div>
                  ))}
                </Flex>
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ padding: '0 10px' }}>
              <Steps
                size="small"
                current={5}
                titlePlacement="vertical"
                items={statusData.map((s, idx) => {
                  // 🎯 แมปไอคอนตามลำดับสถานะใหม่ (1-6)
                  const icons = [
                    <ClockCircleOutlined style={{ color: s.color }} />, // 1. แจ้งเคส
                    <SyncOutlined spin={s.value > 0} style={{ color: s.color }} />, // 2. กำลังดำเนินการ
                    <UndoOutlined style={{ color: s.color }} />, // 3. แก้ไขใหม่
                    <CheckCircleOutlined style={{ color: s.color }} />, // 4. ดำเนินการแล้ว
                    <AuditOutlined style={{ color: s.color }} />, // 5. ตรวจสอบแล้ว/รอคู่มือ
                    <FlagOutlined style={{ color: s.color }} /> // 6. ปิดเคสแล้ว
                  ];
                  return {
                    title: <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{s.name}</span>,
                    content: <Text strong style={{ fontSize: '14px' }}>{s.value}</Text>,
                    icon: icons[idx] || <Badge dot color={s.color} />
                  };
                })}
              />
            </div>
          </Card>
        </Col>

        {/* Vendor Performance */}
        <Col xs={24} xl={14} style={{ minWidth: 0 }} className="chart-container">
          <Card 
            title={<Space><BarChartOutlined /> ประสิทธิภาพ SLA รายบริษัท (Vendor)</Space>} 
            variant="borderless" 
            className="chart-card"
            style={{ ...chartCardStyle, height: '100%' }}
          >
            <div style={{ width: '100%', height: 350, minHeight: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorData} layout="vertical" margin={{ left: 10, right: 30, top: 10 }}>
                  <CartesianGrid {...gridConfig} horizontal={true} vertical={false} />
                  <XAxis type="number" {...axisConfig} hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    {...axisConfig}
                    width={120} 
                    tick={{ ...axisConfig.tick, fontSize: 11 }}
                  />
                  <ChartTooltip {...tooltipStyle} />
                  <Legend {...legendConfig} verticalAlign="top" align="right" />
                  <Bar 
                    dataKey="on_time" 
                    name="ปิดงานทันเวลา" 
                    stackId="a" 
                    fill={CHART_PALETTE[1]} 
                    radius={[0, 0, 0, 0]} 
                    barSize={20} 
                    {...ANIMATION_CONFIG}
                  />
                  <Bar 
                    dataKey="breached" 
                    name="หลุด SLA" 
                    stackId="a" 
                    fill={CHART_PALETTE[3]} 
                    radius={[0, 6, 6, 0]} 
                    barSize={20} 
                    {...ANIMATION_CONFIG}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        {/* Financial Summary: Penalties */}
        <Col xs={24} xl={24} className="chart-container">
          <Card 
            title={<Space><DollarOutlined style={{ color: CHART_PALETTE[3] }} /> สรุปมูลค่าโครงการและค่าปรับสะสม (Financial Insights)</Space>} 
            variant="borderless" 
            className="chart-card"
            style={chartCardStyle}
            extra={<Text strong type="danger" style={{ fontSize: '20px' }}>ยอดค่าปรับรวม: ฿ {Number(kpis.total_penalties || 0).toLocaleString()}</Text>}
          >
            <Row gutter={24} align="middle">
              <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                <Progress 
                    type="dashboard" 
                    percent={Number(Math.min(100, (kpis.sla_breaches / kpis.total_tickets * 100) || 0).toFixed(1))} 
                    strokeColor={CHART_PALETTE[3]}
                    format={percent => `${percent}% Breach`}
                    size={180}
                />
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary">สัดส่วนการทำผิดเงื่อนไขสัญญา (SLA Breach Rate)</Text>
                </div>
              </Col>
              <Col xs={24} md={16}>
                <Flex vertical gap={24}>
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>สถานะการเงินและความคุ้มค่า</Text>
                    <Paragraph type="secondary" style={{ marginTop: '8px' }}>
                      ระบบคำนวณค่าปรับอัตโนมัติอ้างอิงตามระดับความสำคัญ (Weighting Factor) ของอุปกรณ์และระยะเวลาที่เกินกำหนดจาก SLA ในสัญญาปัจจุบัน 
                      ข้อมูลนี้ช่วยให้ผู้บริหารประเมินคุณภาพการบริการของ Vendor ได้อย่างแม่นยำ
                    </Paragraph>
                  </div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="จำนวนเคสที่หลุด SLA" value={kpis.sla_breaches} prefix={<WarningOutlined style={{ color: CHART_PALETTE[3] }} />} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="ยอดค่าปรับค้างชำระ" value={kpis.total_penalties} precision={2} prefix="฿" styles={{ content: { color: CHART_PALETTE[3] } }} />
                    </Col>
                  </Row>
                </Flex>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 📄 Detailed Data Grid */}
      <Card 
        title={<Space><FileTextOutlined /> รายละเอียดรายการแจ้งซ่อม</Space>} 
        variant="borderless" 
        className="chart-card"
        style={chartCardStyle}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={rawTickets}
          pagination={{ pageSize: 10 }}
          loading={loading}
          rowKey="ticket_id"
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'เลขที่', dataIndex: 'ticket_number', render: (_, r) => <Text strong>{r.ticket_number}</Text> },
            { title: 'สถานะ', render: (_, r) => <Tag color={r.status_color || 'blue'}>{r.status}</Tag> },
            { title: 'หมวดหมู่', dataIndex: 'category_name' },
            { title: 'โปรเจกต์', dataIndex: 'project_name' },
            { title: 'SLA', render: (_, r) => r.is_sla_breached ? <Tag color="error">Breached</Tag> : <Tag color="success">Compliant</Tag> },
            { title: 'ค่าปรับ (฿)', render: (_, r) => <Text type={r.penalty_amount > 0 ? "danger" : "secondary"}>{Number(r.penalty_amount).toLocaleString()}</Text>, align: 'right' },
            { title: 'วันที่แจ้ง', render: (_, r) => dayjs(r.created_at).format('DD/MM/YYYY') }
          ]}
        />
      </Card>
    </div>
  );
}
