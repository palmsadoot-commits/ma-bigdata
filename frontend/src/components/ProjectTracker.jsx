import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, Row, Col, Typography, Table, Button, Space, Tag, 
  Statistic, Divider, Empty, message, Badge, Tooltip,
  Progress, theme, Flex, Tabs, Select, Timeline, List, Avatar,
  Modal, Form, Input, DatePicker
} from 'antd';
import { 
  DashboardOutlined, 
  UnorderedListOutlined, 
  SafetyCertificateOutlined, 
  FileDoneOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  SearchOutlined,
  DownloadOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  LineChartOutlined,
  EditOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; 
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError } from '../utils/alert';

dayjs.locale('th');

const { Title, Text } = Typography;

/**
 * 🚀 World-Class Project Tracker Dashboard
 * Provides deep insights into TOR implementation, Milestones, and SLA.
 */
export default function ProjectTracker() {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [slaLogs, setSlaLogs] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]); // ✅ รายชื่อผู้ใช้งานในโครงการ
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deliverables, setDeliverables] = useState([]);
  const [torScope, setTorScope] = useState([]);
  const [categories, setCategories] = useState([]); // ✅ หมวดหมู่ระบบทั้งหมด
  const user = JSON.parse(localStorage.getItem('user'));

  // --- 🛠️ Management States ---
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isMappingModalVisible, setIsMappingModalVisible] = useState(false); // ✅ Modal สำหรับ Map TOR
  const [editingTask, setEditingTask] = useState(null);
  const [mappingClause, setMappingClause] = useState(null); // ✅ Clause ที่กำลัง Map
  const [form] = Form.useForm();
  const [mappingForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [milestonesRes, tasksRes, slaRes, usersRes, torRes, catRes] = await Promise.all([
        axiosInstance.get('/projects/milestones'),
        axiosInstance.get('/projects/tasks'),
        axiosInstance.get('/projects/sla-logs'),
        axiosInstance.get('/projects/users'),
        axiosInstance.get('/projects/tor-scope'),
        axiosInstance.get('/categories') // ✅ ดึงหมวดหมู่
      ]);
      setMilestones(milestonesRes.data || []);
      setTasks(tasksRes.data || []);
      setSlaLogs(slaRes.data || []);
      setProjectUsers(usersRes.data || []);
      setTorScope(torRes.data || []);
      setCategories(catRes.data || []);
      
      const defaultMilestone = milestonesRes.data?.find(m => m.status === 'In Progress') || milestonesRes.data?.[0];
      const mId = selectedMilestoneId || defaultMilestone?.milestone_id;
      
      if (mId) {
        setSelectedMilestoneId(mId);
        // ดึงสิ่งส่งมอบของงวดที่เลือก
        const delRes = await axiosInstance.get(`/projects/deliverables?milestone_id=${mId}`);
        setDeliverables(delRes.data || []);
      }
    } catch (err) {
      console.error("Fetch Project Data Error:", err);
      message.error("ไม่สามารถโหลดข้อมูลโครงการได้");
    } finally {
      setLoading(false);
    }
  }, [selectedMilestoneId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ติดตามการเปลี่ยน Milestone เพื่อโหลดสิ่งส่งมอบใหม่
  useEffect(() => {
    if (selectedMilestoneId) {
      axiosInstance.get(`/projects/deliverables?milestone_id=${selectedMilestoneId}`)
        .then(res => setDeliverables(res.data || []))
        .catch(err => console.error(err));
    }
  }, [selectedMilestoneId]);

  // --- 🛠️ Management Handlers ---
  
  const handleEditTask = (task) => {
    setEditingTask(task);
    
    // ค้นหา Head Technician คนแรกจากรายชื่อเพื่อตั้งเป็นค่าเริ่มต้น
    const defaultHeadTech = projectUsers.find(u => u.role === 'head_technician')?.user_id;

    form.setFieldsValue({
      ...task,
      responsible_id: task.responsible_id || defaultHeadTech,
      completion_date: task.completion_date ? dayjs(task.completion_date) : null
    });
    setIsEditModalVisible(true);
  };

  const handleSaveTask = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        completion_date: values.completion_date ? values.completion_date.format('YYYY-MM-DD') : null
      };
      await axiosInstance.put(`/project/tasks/${editingTask.task_id}`, payload);
      alertSuccess('สำเร็จ', 'บันทึกข้อมูลงานเรียบร้อยแล้ว');
      setIsEditModalVisible(false);
      fetchData(); // รีเฟรชข้อมูล
    } catch (err) {
      console.error("Save Task Error:", err);
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMapping = (record) => {
    setMappingClause(record);
    mappingForm.setFieldsValue({
      milestone_ids: record.milestone_ids ? record.milestone_ids.split(',').map(Number) : [],
      category_id: record.category_id,
      annex_table_no: record.annex_table_no
    });
    setIsMappingModalVisible(true);
  };

  const handleSaveMapping = async (values) => {
    setLoading(true);
    try {
      await axiosInstance.put(`/projects/tor-mapping/${mappingClause.clause_id}`, values);
      alertSuccess('สำเร็จ', 'บันทึกการจับคู่ขอบเขตงานเรียบร้อย');
      setIsMappingModalVisible(false);
      fetchData();
    } catch (err) {
      console.error("Save Mapping Error:", err);
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกการจับคู่ได้');
    } finally {
      setLoading(false);
    }
  };

  // --- 📊 Data Transformation for Charts ---
  
  const progressData = useMemo(() => {
    return milestones.map(m => ({
      name: m.title,
      progress: m.progress_percent,
      status: m.status
    }));
  }, [milestones]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'Done' || t.status === 'Verified').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const slaBreached = slaLogs.filter(s => s.resolve_sla_status === 'Breached').length;

    return { total, done, inProgress, pending, slaBreached, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [tasks, slaLogs]);

  const currentMilestoneTasks = useMemo(() => {
    return tasks.filter(t => t.milestone_id === selectedMilestoneId);
  }, [tasks, selectedMilestoneId]);

  // --- 🎨 UI Components ---

  const StatusTag = ({ status }) => {
    const configs = {
      'Completed': { color: 'success', icon: <CheckCircleOutlined /> },
      'In Progress': { color: 'processing', icon: <SyncOutlined spin /> },
      'Pending': { color: 'default', icon: <ClockCircleOutlined /> },
      'Done': { color: 'success', icon: <CheckCircleOutlined /> },
      'Verified': { color: 'cyan', icon: <SafetyCertificateOutlined /> },
      'Met': { color: 'success', label: 'Met' },
      'Breached': { color: 'error', label: 'Breached' },
      'Resolved': { color: 'success', label: 'Resolved' },
      'Open': { color: 'warning', label: 'Open' }
    };
    const config = configs[status] || { color: 'default' };
    return (
      <Tag color={config.color} icon={config.icon} style={{ borderRadius: '6px', padding: '2px 10px', fontWeight: 600 }}>
        {config.label || status}
      </Tag>
    );
  };

  const taskColumns = [
    {
      title: 'TOR Clause',
      dataIndex: 'tor_clause',
      key: 'tor',
      width: 120,
      render: (text) => <Text strong color="primary">{text}</Text>
    },
    {
      title: 'รายละเอียดงาน',
      dataIndex: 'description',
      key: 'desc',
      render: (text) => <Text style={{ fontSize: '13px' }}>{text}</Text>
    },
    {
      title: 'ผู้รับผิดชอบหลัก',
      dataIndex: 'responsible_name',
      key: 'responsible',
      width: 180,
      render: (text, record) => (
        <Space>
          <Avatar size="small" icon={<TeamOutlined />} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${text}`} />
          <div>
            <Text style={{ fontSize: '12px', display: 'block' }}>{text || 'Unassigned'}</Text>
            <Tag size="small" style={{ fontSize: '10px' }}>{record.responsible_role || 'PM/Head'}</Tag>
          </div>
        </Space>
      )
    },
    {
      title: 'ผู้ดำเนินการ',
      dataIndex: 'executor_name',
      key: 'executor',
      width: 180,
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<TeamOutlined />} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${text}`} />
          <Text style={{ fontSize: '12px' }}>{text || 'ยังไม่ได้มอบหมาย'}</Text>
        </Space>
      )
    },
    {
      title: 'ประเภทงาน',
      dataIndex: 'maintenance_type',
      key: 'maintenance_type',
      width: 100,
      render: (type) => {
        let color = 'default';
        if (type === 'CM') color = 'error';
        if (type === 'PM') color = 'warning';
        return <Tag color={color}>{type || 'General'}</Tag>;
      }
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => <StatusTag status={status} />
    },
    {
      title: 'จัดการ',
      key: 'action',
      width: 100,
      render: (_, record) => {
        if (user?.role === 'user') return null; // View only for user
        return (
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: token.colorPrimary }} />} 
            onClick={() => handleEditTask(record)}
          />
        );
      }
    }
  ];

  // --- 💸 Payments View ---
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [paymentForm] = Form.useForm();

  const handleEditPayment = (milestone) => {
    setEditingMilestone(milestone);
    paymentForm.setFieldsValue({
      payment_amount: milestone.payment_amount || 0,
      payment_status: milestone.payment_status || 'Pending'
    });
    setIsPaymentModalVisible(true);
  };

  const handleSavePayment = async (values) => {
    setLoading(true);
    try {
      await axiosInstance.put(`/projects/milestones/${editingMilestone.milestone_id}`, values);
      alertSuccess('สำเร็จ', 'บันทึกข้อมูลการเบิกจ่ายเรียบร้อย');
      setIsPaymentModalVisible(false);
      fetchData();
    } catch (err) {
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลการเบิกจ่ายได้');
    } finally {
      setLoading(false);
    }
  };

  const renderPayments = () => (
    <Card 
      variant="borderless" 
      style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', animation: 'fadeIn 0.5s ease' }}
      title={<Space><BarChartOutlined /> <Text strong>การเบิกจ่ายเงินตามงวดงาน (Installment Payments)</Text></Space>}
    >
      <Table 
        dataSource={milestones}
        rowKey="milestone_id"
        pagination={false}
        columns={[
          { title: 'งวดที่', dataIndex: 'installment_no', width: 80 },
          { title: 'ชื่องวดงาน', dataIndex: 'title' },
          { 
            title: 'ความคืบหน้างาน', 
            dataIndex: 'progress_percent', 
            render: (p) => <Progress percent={p} size="small" /> 
          },
          { 
            title: 'จำนวนเงิน (บาท)', 
            dataIndex: 'payment_amount',
            render: (amount) => <Text strong>{Number(amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text>
          },
          { 
            title: 'สถานะการเบิกจ่าย', 
            dataIndex: 'payment_status',
            render: (status) => {
              const color = status === 'Paid' ? 'success' : status === 'In Process' ? 'processing' : 'default';
              return <Tag color={color}>{status || 'Pending'}</Tag>;
            }
          },
          {
            title: 'จัดการ',
            key: 'action',
            render: (_, record) => {
              if (user?.role !== 'admin') return null;
              return (
                <Button size="small" icon={<EditOutlined />} onClick={() => handleEditPayment(record)}>
                  แก้ไข
                </Button>
              );
            }
          }
        ]}
      />
    </Card>
  );

  // --- 🧪 Render Views ---

  const renderDashboard = () => (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            variant="borderless" 
            style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}
            title={<Space><BarChartOutlined /> <Text strong>ภาพรวมความคืบหน้าแต่ละงวดงาน</Text></Space>}
          >
            <div style={{ height: 350, minHeight: 350, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={token.colorPrimary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={token.colorPrimary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="progress" stroke={token.colorPrimary} strokeWidth={3} fillOpacity={1} fill="url(#colorProg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Flex vertical gap={24}>
            <Card 
              variant="borderless" 
              style={{ 
                borderRadius: '24px', 
                background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #1e40af 100%)`,
                color: '#fff'
              }}
              styles={{ body: { padding: '32px' } }}
            >
              <Statistic 
                title={<Text style={{ color: 'rgba(255,255,255,0.8)' }}>ความคืบหน้ารวมทั้งโครงการ</Text>}
                value={stats.percent}
                suffix="%"
                styles={{ content: { color: '#fff', fontSize: '48px', fontWeight: 900 } }}
              />
              <Progress 
                percent={stats.percent} 
                showInfo={false} 
                strokeColor="#fff" 
                railColor="rgba(255,255,255,0.2)" 
                size={[null, 12]} 
                style={{ marginTop: '16px' }}
              />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '16px', display: 'block' }}>
                ดำเนินการเสร็จสิ้นแล้ว {stats.done} จาก {stats.total} รายการ TOR
              </Text>
            </Card>

            <Card 
              variant="borderless" 
              style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            >
              <Title level={5} style={{ marginTop: 0 }}>สถานะงานปัจจุบัน</Title>
              <Flex vertical gap={16}>
                <Flex justify="space-between" align="center">
                  <Space><Badge status="success" /> <Text type="secondary">เสร็จสิ้น (Done)</Text></Space>
                  <Text strong>{stats.done}</Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Space><Badge status="processing" /> <Text type="secondary">กำลังทำ (In Progress)</Text></Space>
                  <Text strong>{stats.inProgress}</Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Space><Badge status="default" /> <Text type="secondary">รอเข้าดำเนินการ (Pending)</Text></Space>
                  <Text strong>{stats.pending}</Text>
                </Flex>
                <Divider style={{ margin: '8px 0' }} />
                <Flex justify="space-between" align="center">
                  <Space><Badge status="error" /> <Text type="danger" strong>SLA Breach (CM)</Text></Space>
                  <Text strong type="danger">{stats.slaBreached}</Text>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card 
            variant="borderless" 
            style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            title={<Space><LineChartOutlined /> <Text strong>Timeline แผนการดำเนินงาน</Text></Space>}
          >
            <Timeline 
              mode="alternate"
              items={milestones.map(m => ({
                color: m.status === 'Completed' ? 'green' : m.status === 'In Progress' ? 'blue' : 'gray',
                content: (
                  <Card size="small" style={{ borderRadius: '12px', textAlign: 'left' }}>
                    <Flex justify="space-between">
                      <Text strong>{m.title}</Text>
                      <StatusTag status={m.status} />
                    </Flex>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      <CalendarOutlined /> {dayjs(m.start_date).format('D MMM')} - {dayjs(m.end_date).format('D MMM YYYY')}
                    </div>
                    <Progress percent={m.progress_percent} size="small" style={{ marginTop: '8px' }} />
                  </Card>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderTasks = () => (
    <Flex vertical gap={24} style={{ animation: 'fadeIn 0.5s ease' }}>
      <Card 
        variant="borderless" 
        style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <div>
            <Title level={4} style={{ margin: 0 }}>รายละเอียดงานแต่ละงวด</Title>
            <Text type="secondary">เลือกงวดงานเพื่อดูรายการ TOR และสถานะการดำเนินการรายข้อ</Text>
          </div>
          <Select 
            style={{ width: 280 }}
            size="large"
            placeholder="เลือกงวดงาน"
            value={selectedMilestoneId}
            onChange={setSelectedMilestoneId}
            options={milestones.map(m => ({ label: `${m.title} (${dayjs(m.start_date).format('D MMM')} - ${dayjs(m.end_date).format('D MMM YY')})`, value: m.milestone_id }))}
          />
        </Flex>
      </Card>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card 
            variant="borderless" 
            style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}
            styles={{ body: { padding: 0 } }}
          >
            <Table 
              dataSource={currentMilestoneTasks} 
              columns={taskColumns} 
              rowKey="task_id" 
              pagination={false}
              loading={loading}
              className="project-table"
            />
          </Card>
        </Col>
      </Row>
    </Flex>
  );

  const renderSLA = () => (
    <Card 
      variant="borderless" 
      style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', animation: 'fadeIn 0.5s ease' }}
      title={<Space><SafetyCertificateOutlined /> <Text strong>บันทึกซ่อมบำรุงและ SLA (CM Logs)</Text></Space>}
    >
      <Table 
        dataSource={slaLogs}
        columns={[
          { title: 'รหัสแจ้งซ่อม', dataIndex: 'issue_id', key: 'id', render: (t) => <Text strong color="primary">{t}</Text> },
          { title: 'รายละเอียดปัญหา', dataIndex: 'description', key: 'desc' },
          { title: 'เวลาที่รับแจ้ง', dataIndex: 'reported_at', render: (d) => dayjs(d).format('D MMM YY HH:mm') },
          { title: 'Response SLA', dataIndex: 'response_sla_status', render: (s) => <StatusTag status={s} /> },
          { title: 'Resolve SLA', dataIndex: 'resolve_sla_status', render: (s) => <StatusTag status={s} /> },
          { title: 'สถานะ', dataIndex: 'status', render: (s) => <StatusTag status={s} /> }
        ]}
        rowKey="sla_id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );

  const renderTORScope = () => {
    const columns = [
      {
        title: 'ข้อที่',
        dataIndex: 'clause_no',
        key: 'no',
        width: 100,
        render: (text, record) => <Text strong={record.is_group}>{text}</Text>
      },
      {
        title: 'หัวข้อการดำเนินงาน',
        dataIndex: 'title',
        key: 'title',
        render: (text, record) => (
          <div style={{ paddingLeft: record.parent_no ? '20px' : '0' }}>
            <Text strong={record.is_group}>{text}</Text>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{record.description}</div>
          </div>
        )
      },
      {
        title: 'การจับคู่ระบบ/งวดงาน/ภาคผนวก',
        key: 'mapping',
        width: 350,
        render: (_, record) => {
          const assignedIds = record.milestone_ids ? record.milestone_ids.split(',').length : 0;
          const isAllMilestones = milestones.length > 0 && assignedIds === milestones.length;

          return (
            <Space wrap>
              {isAllMilestones ? (
                <Tag color="gold" icon={<ClockCircleOutlined />}>ทุกงวดงาน</Tag>
              ) : (
                record.milestone_titles && record.milestone_titles.split(', ').map(title => (
                  <Tag key={title} color="gold" icon={<ClockCircleOutlined />}>{title}</Tag>
                ))
              )}
              {record.annex_table_no && (
                <Tag color="blue" icon={<FileDoneOutlined />}>ภาคผนวก ตารางที่ {record.annex_table_no}</Tag>
              )}
              {record.category_name && (
                <Tag color="cyan" icon={<UnorderedListOutlined />}>{record.category_name}</Tag>
              )}
            </Space>
          );
        }
      },
      {
        title: 'จัดการ',
        key: 'action',
        width: 100,
        render: (_, record) => (
          !record.is_group && (
            <Button 
              size="small" 
              type="primary" 
              ghost 
              icon={<EditOutlined />} 
              onClick={() => handleEditMapping(record)}
            >
              จัดการ
            </Button>
          )
        )
      }
    ];

    return (
      <Card 
        variant="borderless" 
        style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', animation: 'fadeIn 0.5s ease' }}
        title={<Space><SearchOutlined /> <Text strong>ขอบเขตงานตามสัญญา (TOR Scope Mapping)</Text></Space>}
      >
        <Table 
          dataSource={torScope}
          columns={columns}
          rowKey="clause_id"
          pagination={false}
          size="middle"
        />
      </Card>
    );
  };

  const renderDeliverables = () => {
    const selectedMilestone = milestones.find(m => m.milestone_id === selectedMilestoneId);
    const allTasksDone = currentMilestoneTasks.length > 0 && currentMilestoneTasks.every(t => t.status === 'Done' || t.status === 'Verified');
    
    return (
      <Flex vertical gap={24} style={{ animation: 'fadeIn 0.5s ease' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card 
              variant="borderless" 
              style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              title={<Space><FileDoneOutlined /> <Text strong>รายการสิ่งส่งมอบตามงวดงาน: {selectedMilestone?.title}</Text></Space>}
            >
              <Table 
                dataSource={deliverables}
                pagination={false}
                rowKey="deliverable_id"
                columns={[
                  { title: 'ชื่อรายการสิ่งส่งมอบ', dataIndex: 'name', key: 'name' },
                  { title: 'สถานะ', dataIndex: 'status', key: 'status', render: (s) => <StatusTag status={s} /> },
                  { 
                    title: 'จัดการ', 
                    key: 'action', 
                    render: (_, record) => (
                      user?.role === 'admin' && (
                        <Space>
                          <Button size="small" type="primary" ghost>อนุมัติ</Button>
                          <Button size="small" danger ghost>ตีกลับ</Button>
                        </Space>
                      )
                    )
                  }
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card 
              variant="borderless" 
              style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              title={<Space><SearchOutlined /> <Text strong>สถานะความพร้อมการส่งงวด</Text></Space>}
            >
              <Flex vertical gap={20}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Progress 
                    type="dashboard" 
                    percent={selectedMilestone?.progress_percent} 
                    strokeColor={selectedMilestone?.progress_percent === 100 ? '#52c41a' : token.colorPrimary}
                  />
                  <div style={{ marginTop: '10px' }}>
                    <Text strong style={{ fontSize: '16px' }}>{selectedMilestone?.title}</Text>
                  </div>
                </div>
                
                <Divider style={{ margin: 0 }} />
                
                <List size="small">
                  <List.Item extra={allTasksDone ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <SyncOutlined spin style={{ color: '#1677ff' }} />}>
                    <Text type={allTasksDone ? 'success' : 'secondary'}>งานตาม TOR ครบถ้วน</Text>
                  </List.Item>
                  <List.Item extra={deliverables.every(d => d.status === 'Approved') ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#faad14' }} />}>
                    <Text type={deliverables.every(d => d.status === 'Approved') ? 'success' : 'secondary'}>เอกสารสิ่งส่งมอบครบถ้วน</Text>
                  </List.Item>
                </List>

                {user?.role === 'admin' && (
                  <Button 
                    type="primary" 
                    size="large" 
                    block 
                    style={{ height: '50px', borderRadius: '12px' }}
                    disabled={!allTasksDone || !deliverables.every(d => d.status === 'Approved')}
                  >
                    ยืนยันปิดงวดงาน (Final Review)
                  </Button>
                )}
              </Flex>
            </Card>
          </Col>
        </Row>
      </Flex>
    );
  };

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Area */}
      <Flex justify="space-between" align="center" style={{ marginBottom: '32px' }} wrap="wrap" gap={20}>
        <div>
          <Title level={2} style={{ margin: 0, letterSpacing: '-1px' }}>
            <Space>
              <div style={{ backgroundColor: token.colorPrimary, padding: '8px', borderRadius: '12px', display: 'flex' }}>
                <RocketOutlined style={{ color: '#fff' }} />
              </div>
              ระบบติดตามความคืบหน้าโครงการ
            </Space>
          </Title>
          <Text type="secondary" style={{ fontSize: '15px' }}>
            โครงการบำรุงรักษาระบบสารสนเทศศูนย์ข้อมูลแรงงานแห่งชาติ (MA Big Data Analytics)
          </Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} size="large" style={{ borderRadius: '10px' }}>รายงานภาพรวม</Button>
          <Button type="primary" icon={<SyncOutlined spin={loading} />} onClick={fetchData} size="large" style={{ borderRadius: '10px' }}>รีเฟรชข้อมูล</Button>
        </Space>
      </Flex>

      {/* Main Tabs Selection */}
      <div className="custom-tabs-container">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          size="large"
          items={[
            { key: 'dashboard', label: <Space><DashboardOutlined /> แดชบอร์ด</Space> },
            user?.role === 'admin' && { key: 'scope', label: <Space><SearchOutlined /> ขอบเขตงาน (TOR)</Space> },
            { key: 'tasks', label: <Space><UnorderedListOutlined /> แผนงวดงาน (TOR)</Space> },
            { key: 'payments', label: <Space><BarChartOutlined /> การเบิกจ่ายงวดเงิน</Space> },
            { key: 'sla', label: <Space><SafetyCertificateOutlined /> SLA & Maintenance</Space> },
            { key: 'deliverables', label: <Space><FileDoneOutlined /> สิ่งส่งมอบ {user?.role === 'admin' && <Badge dot status="processing" style={{ marginLeft: 4 }} />}</Space> }
          ].filter(Boolean)}
        />
      </div>

      <div style={{ marginTop: '24px' }}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'scope' && renderTORScope()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'sla' && renderSLA()}
        {activeTab === 'deliverables' && renderDeliverables()}
      </div>

      {/* --- 🛠️ Edit Task Modal --- */}
      <Modal
        title={<Space><EditOutlined /> แก้ไขรายละเอียดงาน TOR</Space>}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="บันทึกข้อมูล"
        cancelText="ยกเลิก"
        width={600}
        centered
        styles={{ body: { paddingTop: '20px' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveTask}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tor_clause" label="TOR Clause" rules={[{ required: true, message: 'กรุณาระบุ TOR' }]}>
                <Input placeholder="เช่น 5.1.1" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="status" label="สถานะการดำเนินงาน" rules={[{ required: true }]}>
                <Select options={[
                  { label: 'Pending (รอดำเนินการ)', value: 'Pending' },
                  { label: 'In Progress (กำลังดำเนินการ)', value: 'In Progress' },
                  { label: 'Done (เสร็จสิ้น)', value: 'Done' },
                  { label: 'Verified (ตรวจสอบแล้ว)', value: 'Verified' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="maintenance_type" label="ประเภทงาน (Maintenance Type)" rules={[{ required: true }]}>
                <Select options={[
                  { label: 'งานทั่วไปตาม TOR (General)', value: 'General' },
                  { label: 'งานซ่อมบำรุงแก้ไข (CM)', value: 'CM' },
                  { label: 'งานบำรุงรักษาเชิงป้องกัน (PM)', value: 'PM' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="รายละเอียดงาน" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="ระบุรายละเอียดการดำเนินงานตาม TOR" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="responsible_id" label="ผู้รับผิดชอบหลัก (PM / Head Tech)">
                <Select 
                  placeholder="เลือก PM หรือ Head Tech"
                  showSearch
                  optionFilterProp="label"
                  options={projectUsers
                    .filter(u => u.role === 'manager' || u.role === 'head_technician')
                    .map(u => ({ label: `${u.full_name} (${u.role})`, value: u.user_id }))
                  }
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="executor_id" label="ผู้ดำเนินการ (ลูกทีม)">
                <Select 
                  placeholder="เลือกผู้ดำเนินการ"
                  showSearch
                  optionFilterProp="label"
                  options={projectUsers
                    .filter(u => u.role === 'technician' || u.role === 'user')
                    .map(u => ({ label: `${u.full_name} (${u.role})`, value: u.user_id }))
                  }
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="completion_date" label="วันที่เสร็จสิ้น (ถ้ามี)">
                <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* --- 🔗 TOR Mapping Modal (Admin Only) --- */}
      <Modal
        title={<Space><UnorderedListOutlined /> ตั้งค่าการจับคู่ขอบเขตงาน (TOR Mapping)</Space>}
        open={isMappingModalVisible}
        onCancel={() => setIsMappingModalVisible(false)}
        onOk={() => mappingForm.submit()}
        confirmLoading={loading}
        okText="บันทึกการจับคู่"
        cancelText="ยกเลิก"
        width={500}
        centered
      >
        <div style={{ marginBottom: '20px' }}>
          <Text type="secondary">หัวข้อ TOR:</Text>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{mappingClause?.clause_no} {mappingClause?.title}</div>
        </div>

        <Form form={mappingForm} layout="vertical" onFinish={handleSaveMapping}>
          <Form.Item name="milestone_ids" label="งวดงานที่เกี่ยวข้อง (เลือกได้หลายงวด)">
            <Select 
              mode="multiple"
              placeholder="เลือกหนึ่งหรือหลายงวดงาน"
              options={milestones.map(m => ({ label: m.title, value: m.milestone_id }))}
              allowClear
            />
          </Form.Item>

          <Form.Item name="category_id" label="หมวดหมู่ระบบที่เกี่ยวข้อง">
            <Select 
              placeholder="เลือกหมวดหมู่ระบบ"
              showSearch
              optionFilterProp="label"
              options={categories.map(c => ({ label: c.category_name, value: c.category_id }))}
              allowClear
            />
          </Form.Item>

          <Form.Item name="annex_table_no" label="ภาคผนวกตารางที่ (ถ้ามี)">
            <Select 
              placeholder="เลือกตารางภาคผนวก"
              options={[
                { label: 'ตารางที่ 1: Hardware/Software แม่ข่าย', value: 1 },
                { label: 'ตารางที่ 2: ระบบสารสนเทศ', value: 2 },
              ]}
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- 💸 Payment Modal (Admin Only) --- */}
      <Modal
        title={<Space><EditOutlined /> แก้ไขการเบิกจ่ายงวดงาน</Space>}
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        onOk={() => paymentForm.submit()}
        confirmLoading={loading}
        okText="บันทึก"
        cancelText="ยกเลิก"
        centered
      >
        <div style={{ marginBottom: '20px' }}>
          <Text type="secondary">งวดงาน:</Text>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{editingMilestone?.title}</div>
        </div>

        <Form form={paymentForm} layout="vertical" onFinish={handleSavePayment}>
          <Form.Item name="payment_amount" label="จำนวนเงิน (บาท)" rules={[{ required: true }]}>
            <Input type="number" step="0.01" prefix="฿" />
          </Form.Item>

          <Form.Item name="payment_status" label="สถานะการเบิกจ่าย">
            <Select options={[
              { label: 'รอดำเนินการ (Pending)', value: 'Pending' },
              { label: 'อยู่ระหว่างดำเนินการ (In Process)', value: 'In Process' },
              { label: 'เบิกจ่ายแล้ว (Paid)', value: 'Paid' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-tabs-container .ant-tabs-nav::before {
          display: none;
        }
        .custom-tabs-container .ant-tabs-tab {
          background: #fff;
          border-radius: 12px !important;
          padding: 12px 24px !important;
          margin-right: 12px !important;
          border: 1px solid #e2e8f0 !important;
          transition: all 0.3s ease;
        }
        .custom-tabs-container .ant-tabs-tab-active {
          background: ${token.colorPrimary} !important;
          border-color: ${token.colorPrimary} !important;
        }
        .custom-tabs-container .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #fff !important;
        }
        .custom-tabs-container .ant-tabs-ink-bar {
          display: none;
        }
        .project-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          font-size: 11px;
          color: #64748b !important;
        }
        .project-table .ant-table-row:hover > td {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}

// Additional Icon
function RocketOutlined(props) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="24" 
      height="24" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
      <path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3"></path>
      <path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5"></path>
      <line x1="10" y1="5" x2="19" y2="14"></line>
    </svg>
  );
}
