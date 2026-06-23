import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, Row, Col, Typography, Statistic, DatePicker, Select, Divider, 
  Spin, Flex, Progress, Badge, theme, App, Button, Space, Table, Tag
} from 'antd';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import { 
  DashboardOutlined, 
  ThunderboltOutlined,
  DollarCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SyncOutlined,
  CalendarOutlined,
  ProjectOutlined,
  RiseOutlined,
  FallOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosInstance from '../services/api/axiosInstance';
import {
  CHART_PALETTE,
  getAxisConfig,
  getGridConfig,
  getTooltipStyle,
  getGradientId,
  getGradientStops,
  getAreaStyle,
  getBarStyle,
  getLegendConfig,
  getChartCardStyle,
  ANIMATION_CONFIG,
} from '../utils/chartTheme';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function BusinessIntelligenceDashboard() {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  
  const [loading, setLoading] = useState(true);
  const [biData, setBiData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: [dayjs().startOf('year'), dayjs()],
    projectId: null
  });

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/projects');
      setProjects(res.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchBIData = useCallback(async () => {
    setLoading(true);
    const [start, end] = filters.dateRange;
    const params = {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
      project_id: filters.projectId
    };

    try {
      const res = await axiosInstance.get('/reports/executive-summary', { params });
      setBiData(res.data);
    } catch (err) {
      message.error("ไม่สามารถโหลดข้อมูล BI ได้");
    } finally {
      setLoading(false);
    }
  }, [filters, message]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchBIData();
  }, [fetchBIData]);

  if (loading && !biData) {
    return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
  }

  const kpiData = biData?.kpis || {};

  // --- Gradient IDs ---
  const trendGradPrimary = getGradientId('bi-trend', 'primary');
  const trendGradSuccess = getGradientId('bi-trend', 'success');
  const gradStops = getGradientStops(token.colorPrimary);
  const gradStopsGreen = getGradientStops('#22c55e', { topOpacity: 0.12 });

  // --- Theme configs ---
  const axisConfig = getAxisConfig();
  const gridConfig = getGridConfig();
  const tooltipStyle = getTooltipStyle();
  const legendConfig = getLegendConfig();
  const chartCardStyle = getChartCardStyle();

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      {/* 👑 Executive Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: '32px' }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, letterSpacing: '-1px' }}>
            <DashboardOutlined style={{ color: token.colorPrimary, marginRight: 12 }} />
            Business Intelligence Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>Executive Summary & Operational Insights (Big Data Analytics)</Text>
        </div>
        <Space wrap style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <CalendarOutlined style={{ color: '#64748b' }} />
          <RangePicker 
            value={filters.dateRange} 
            onChange={(val) => setFilters(prev => ({ ...prev, dateRange: val }))}
            style={{ border: 'none' }}
          />
          <span style={{ borderLeft: '1px solid var(--border-color)', height: 24, margin: '0 8px' }} />
          <ProjectOutlined style={{ color: '#64748b' }} />
          <Select 
            placeholder="ทุกโปรเจกต์" 
            style={{ width: 180 }} 
            allowClear
            variant="borderless"
            onChange={(val) => setFilters(prev => ({ ...prev, projectId: val }))}
            options={projects.map(p => ({ label: p.project_name, value: p.project_id }))}
          />
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchBIData} shape="circle" />
        </Space>
      </Flex>

      {/* 🚀 Top Tier KPIs */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} md={6} className="chart-stat-card">
          <Card variant="borderless" className="chart-card" style={{ ...chartCardStyle, background: 'var(--bg-card)' }}>
            <Statistic 
              title={<div style={{ color: 'rgba(8, 143, 87, 0.85)', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>ปริมาณงานซ่อมบำรุงรวม</div>}
              value={kpiData.total_tickets}
              styles={{ content: { color: kpiData.compliance_rate >= 80 ? '#22c55e' : '#f59e0b', fontSize: 32, fontWeight: 800 } }}
              prefix={<ThunderboltOutlined style={{ marginRight: 8 }} />}
              suffix={<span style={{ fontSize: 16, marginLeft: 4, opacity: 0.9 }}>ใบงาน</span>}
            />
            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, background: 'rgba(167, 164, 164, 0.25)', padding: '6px 12px', borderRadius: '10px', display: 'inline-block', boxShadow: 'inset 0 1px 3px rgba(161, 159, 159, 0.2)' }}>
              ปิดงานแล้ว {kpiData.closed_tickets} รายการจากทั้งหมด
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6} className="chart-stat-card">
          <Card variant="borderless" className="chart-card" style={{ ...chartCardStyle, background: 'var(--bg-card)' }}>
            <Statistic 
              title={<Text type="secondary" style={{ fontSize: 14 }}>อัตราการทำตาม SLA</Text>}
              value={kpiData.compliance_rate}
              precision={2}
              styles={{ content: { color: kpiData.compliance_rate >= 80 ? '#22c55e' : '#f59e0b', fontSize: 32, fontWeight: 800 } }}
              prefix={kpiData.compliance_rate >= 80 ? <RiseOutlined /> : <FallOutlined />}
              suffix="%"
            />
            <Progress 
              percent={kpiData.compliance_rate} 
              showInfo={false} 
              size="small" 
              strokeColor={kpiData.compliance_rate >= 80 ? '#22c55e' : '#f59e0b'}
              style={{ marginTop: 12 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6} className="chart-stat-card">
          <Card variant="borderless" className="chart-card" style={{ ...chartCardStyle, background: 'var(--bg-card)' }}>
            <Statistic 
              title={<Text type="secondary" style={{ fontSize: 14 }}>ผลกระทบทางการเงิน (ค่าปรับ)</Text>}
              value={kpiData.total_penalty_cost}
              precision={2}
              styles={{ content: { color: '#ef4444', fontSize: 32, fontWeight: 800 } }}
              prefix={<DollarCircleOutlined />}
            />
            <div style={{ marginTop: 12, fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
              ผิดสัญญา SLA: {kpiData.sla_breaches} ครั้ง
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6} className="chart-stat-card">
          <Card variant="borderless" className="chart-card" style={{ ...chartCardStyle, background: 'var(--bg-card)' }}>
            <Statistic 
              title={<Text type="secondary" style={{ fontSize: 14 }}>ระยะเวลาเฉลี่ยในการปิดงาน</Text>}
              value={kpiData.avg_resolution_hours}
              precision={1}
              styles={{ content: { color: 'var(--text-main)', fontSize: 32, fontWeight: 800 } }}
              suffix="ชม."
            />
            <div style={{ marginTop: 12, fontSize: 12 }}>
              ตอบรับงานเฉลี่ย: {parseFloat(kpiData.avg_ack_hours || 0).toFixed(1)} ชม.
            </div>
          </Card>
        </Col>
      </Row>

      {/* 📊 Advanced Visualizations */}
      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16} className="chart-container">
          <Card 
            title={
              <Flex justify="space-between" align="center">
                <Text strong style={{ fontSize: 18 }}>แนวโน้มประสิทธิภาพและความเสถียรของระบบ</Text>
                <Tag color="processing">การติดตาม SLA</Tag>
              </Flex>
            } 
            variant="borderless" 
            className="chart-card"
            style={chartCardStyle}
          >
            <div style={{ width: '100%', height: 400, minHeight: 400 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={biData?.trend || []}>
                    <defs>
                      <linearGradient id={trendGradPrimary} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={token.colorPrimary} stopOpacity={gradStops.topOpacity}/>
                        <stop offset="95%" stopColor={token.colorPrimary} stopOpacity={gradStops.bottomOpacity}/>
                      </linearGradient>
                      <linearGradient id={trendGradSuccess} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={gradStopsGreen.topOpacity}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={gradStopsGreen.bottomOpacity}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridConfig} />
                    <XAxis dataKey="month" {...axisConfig} />
                    <YAxis {...axisConfig} />
                    <ChartTooltip 
                      {...tooltipStyle}
                    />
                    <Legend {...legendConfig} />
                    <Area 
                      {...getAreaStyle(token.colorPrimary, trendGradPrimary)}
                      dataKey="created" 
                      name="จำนวนแจ้งซ่อม" 
                    />
                    <Area 
                      {...getAreaStyle('#22c55e', trendGradSuccess)}
                      dataKey="resolved" 
                      name="จำนวนที่แก้ไขเสร็จ" 
                    />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={8} className="chart-container">
          <Card 
            title={<Text strong style={{ fontSize: 18 }}>ระดับความรุนแรงของปัญหา</Text>} 
            variant="borderless" 
            className="chart-card"
            style={{ ...chartCardStyle, height: '100%' }}
          >
            <div style={{ width: '100%', height: 300, minHeight: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={biData?.priorities || []}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={6}
                    dataKey="value"
                    cornerRadius={6}
                    {...ANIMATION_CONFIG}
                  >
                    {biData?.priorities.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_PALETTE[index % CHART_PALETTE.length]} 
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <ChartTooltip {...tooltipStyle} />
                  <Legend {...legendConfig} verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 16, paddingTop: 16 }}>
              <Flex vertical gap={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">งานฉุกเฉิน (CM)</Text>
                  <Text strong>{biData?.priorities.find(p => p.name.includes('Emergency'))?.value || 0} รายการ</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">งานบำรุงรักษาปกติ</Text>
                  <Text strong>{biData?.priorities.find(p => p.name.includes('Routine'))?.value || 0} รายการ</Text>
                </div>
              </Flex>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={12} className="chart-container">
          <Card 
            title={<Text strong style={{ fontSize: 18 }}>5 อันดับหมวดหมู่ปัญหาที่พบบ่อย (Pain Points)</Text>} 
            variant="borderless" 
            className="chart-card"
            style={chartCardStyle}
          >
             <div style={{ width: '100%', height: 300, minHeight: 300 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={biData?.topCategories || []} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid {...gridConfig} horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" {...axisConfig} width={150} />
                    <ChartTooltip {...tooltipStyle} />
                    <Bar 
                      dataKey="count" 
                      name="จำนวนครั้ง" 
                      radius={[0, 8, 8, 0]} 
                      barSize={25}
                      {...ANIMATION_CONFIG}
                    >
                       {biData?.topCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                       ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </Card>
        </Col>

        <Col xs={24} xl={12} className="chart-container">
           <Card 
             title={<Text strong style={{ fontSize: 18 }}>ข้อมูลเชิงลึกด้านการทำตามสัญญา</Text>} 
             variant="borderless" 
             className="chart-card"
             style={chartCardStyle}
           >
              <Flex vertical align="center" justify="center" style={{ height: 300, minHeight: 300 }}>
                 <Progress 
                    type="dashboard" 
                    percent={kpiData.compliance_rate} 
                    strokeWidth={10} 
                    size={200}
                    strokeColor={{
                      '0%': '#ef4444',
                      '100%': '#22c55e',
                    }}
                    format={p => (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-main)' }}>{p}%</div>
                        <div style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 600, letterSpacing: '1px' }}>SLA COMPLIANT</div>
                      </div>
                    )}
                 />
                 <Text type="secondary" style={{ marginTop: 16, textAlign: 'center' }}>
                   ประสิทธิภาพการดำเนินงานอ้างอิงตามระดับการให้บริการ (SLA) ที่ตกลงไว้กับผู้รับจ้างทุกโครงการ
                 </Text>
              </Flex>
           </Card>
        </Col>
      </Row>

      <style>{`
        .ant-statistic-title { margin-bottom: 8px; }
        .ant-card-head { border-bottom: none !important; padding: 24px 24px 0 24px !important; }
        .ant-card-body { padding: 24px !important; }
      `}</style>
    </div>
  );
}
