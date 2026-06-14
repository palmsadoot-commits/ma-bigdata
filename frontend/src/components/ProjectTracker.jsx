import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, Row, Col, Typography, Table, Button, Space, Tag, 
  Statistic, Divider, Empty, message, Badge, Tooltip,
  Progress, theme, Flex, Tabs, Select, Timeline, List, Avatar,
  Modal, Form, Input, DatePicker, InputNumber
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
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined
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
  const [project, setProject] = useState(null); // ✅ ข้อมูลโครงการ
  const user = JSON.parse(localStorage.getItem('user'));

  // --- 🛠️ Management States ---
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isMappingModalVisible, setIsMappingModalVisible] = useState(false); // ✅ Modal สำหรับ Map TOR
  const [editingTask, setEditingTask] = useState(null);
  const [mappingClause, setMappingClause] = useState(null); // ✅ Clause ที่กำลัง Map
  const [form] = Form.useForm();
  const [mappingForm] = Form.useForm();

  // --- 🛠️ Milestone Management States ---
  const [isMilestoneModalVisible, setIsMilestoneModalVisible] = useState(false);
  const [editingMilestoneData, setEditingMilestoneData] = useState(null);
  const [milestoneForm] = Form.useForm();
  
  // --- 🛠️ Deliverables Management States ---
  const [isDeliverableModalVisible, setIsDeliverableModalVisible] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState(null);
  const [deliverableForm] = Form.useForm();

  // --- 🛠️ TOR Scope CRUD States ---
  const [isTorModalVisible, setIsTorModalVisible] = useState(false);
  const [editingTor, setEditingTor] = useState(null);
  const [torForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [milestonesRes, tasksRes, slaRes, usersRes, torRes, catRes, projectsRes] = await Promise.all([
        axiosInstance.get('/projects/milestones'),
        axiosInstance.get('/projects/tasks'),
        axiosInstance.get('/projects/sla-logs'),
        axiosInstance.get('/projects/users'),
        axiosInstance.get('/projects/tor-scope'),
        axiosInstance.get('/categories'), // ✅ ดึงหมวดหมู่
        axiosInstance.get('/projects') // ✅ ดึงโครงการ
      ]);
      setMilestones(milestonesRes.data || []);
      setTasks(tasksRes.data || []);
      setSlaLogs(slaRes.data || []);
      setProjectUsers(usersRes.data || []);
      setTorScope(torRes.data || []);
      setCategories(catRes.data || []);
      setProject(projectsRes.data?.[0] || null); // ✅ เซ็ตโครงการหลัก
      
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
      annex_table_no: record.annex_table_no ? String(record.annex_table_no).split(',').map(Number) : [],
      deadline_days: record.deadline_days
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

  // --- 🛠️ Milestone Management Handlers ---
  const handleAddMilestone = () => {
    setEditingMilestoneData(null);
    milestoneForm.resetFields();
    setIsMilestoneModalVisible(true);
  };

  const handleEditMilestoneDetails = (milestone) => {
    setEditingMilestoneData(milestone);
    milestoneForm.setFieldsValue({
      installment_no: milestone.installment_no,
      title: milestone.title,
      description: milestone.description,
      start_date: milestone.start_date ? dayjs(milestone.start_date) : null,
      end_date: milestone.end_date ? dayjs(milestone.end_date) : null
    });
    setIsMilestoneModalVisible(true);
  };

  const handleDeleteMilestone = (milestoneId) => {
    Modal.confirm({
      title: 'ยืนยันการลบงวดงาน?',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการลบงวดงานนี้? ข้อมูลงานย่อยอาจได้รับผลกระทบ',
      okText: 'ลบข้อมูล',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setLoading(true);
        try {
          await axiosInstance.delete(`/projects/milestones/${milestoneId}`);
          alertSuccess('สำเร็จ', 'ลบข้อมูลงวดงานเรียบร้อย');
          fetchData();
        } catch (err) {
          alertError('ผิดพลาด', 'ไม่สามารถลบงวดงานได้');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSaveMilestone = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null
      };

      if (editingMilestoneData) {
        await axiosInstance.put(`/projects/milestones/${editingMilestoneData.milestone_id}`, payload);
        alertSuccess('สำเร็จ', 'อัปเดตข้อมูลงวดงานเรียบร้อย');
      } else {
        await axiosInstance.post('/projects/milestones', payload);
        alertSuccess('สำเร็จ', 'เพิ่มงวดงานใหม่เรียบร้อย');
      }
      setIsMilestoneModalVisible(false);
      fetchData();
    } catch (err) {
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลงวดงานได้');
    } finally {
      setLoading(false);
    }
  };

  // --- 🛠️ Deliverables Management Handlers ---
  const handleAddDeliverable = () => {
    if (!selectedMilestoneId) {
      alertError('ผิดพลาด', 'กรุณาเลือกงวดงานก่อนเพิ่มสิ่งส่งมอบ');
      return;
    }
    setEditingDeliverable(null);
    deliverableForm.resetFields();
    setIsDeliverableModalVisible(true);
  };

  const handleEditDeliverable = (record) => {
    setEditingDeliverable(record);
    deliverableForm.setFieldsValue({
      name: record.name,
      status: record.status
    });
    setIsDeliverableModalVisible(true);
  };

  const handleDeleteDeliverable = (id) => {
    Modal.confirm({
      title: 'ยืนยันการลบรายการสิ่งส่งมอบ?',
      content: 'คุณต้องการลบรายการสิ่งส่งมอบนี้ใช่หรือไม่?',
      okText: 'ลบข้อมูล',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setLoading(true);
        try {
          await axiosInstance.delete(`/projects/deliverables/${id}`);
          alertSuccess('สำเร็จ', 'ลบรายการสิ่งส่งมอบเรียบร้อย');
          // Refresh only deliverables
          const res = await axiosInstance.get(`/projects/deliverables?milestone_id=${selectedMilestoneId}`);
          setDeliverables(res.data || []);
        } catch (err) {
          alertError('ผิดพลาด', 'ไม่สามารถลบรายการได้');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSaveDeliverable = async (values) => {
    setLoading(true);
    try {
      if (editingDeliverable) {
        await axiosInstance.put(`/projects/deliverables/${editingDeliverable.deliverable_id}`, values);
        alertSuccess('สำเร็จ', 'อัปเดตสิ่งส่งมอบเรียบร้อย');
      } else {
        await axiosInstance.post('/projects/deliverables', {
          ...values,
          milestone_id: selectedMilestoneId
        });
        alertSuccess('สำเร็จ', 'เพิ่มสิ่งส่งมอบใหม่เรียบร้อย');
      }
      setIsDeliverableModalVisible(false);
      // Refresh only deliverables
      const res = await axiosInstance.get(`/projects/deliverables?milestone_id=${selectedMilestoneId}`);
      setDeliverables(res.data || []);
    } catch (err) {
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกสิ่งส่งมอบได้');
    } finally {
      setLoading(false);
    }
  };

  // --- 🛠️ TOR Scope CRUD Handlers ---
  const handleAddTor = () => {
    setEditingTor(null);
    torForm.resetFields();
    setIsTorModalVisible(true);
  };

  const handleEditTor = (record) => {
    setEditingTor(record);
    torForm.setFieldsValue({
      clause_no: record.clause_no,
      title: record.title,
      description: record.description,
      parent_no: record.parent_no,
      is_group: record.is_group === 1,
      merge_title: record.merge_title === 1
    });
    setIsTorModalVisible(true);
  };

  const handleDeleteTor = (id) => {
    Modal.confirm({
      title: 'ยืนยันการลบขอบเขตงาน?',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการลบขอบเขตงาน (TOR) นี้? การลบจะลบการจับคู่ที่เกี่ยวข้องทั้งหมดด้วย',
      okText: 'ลบข้อมูล',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setLoading(true);
        try {
          await axiosInstance.delete(`/projects/tor-scope/${id}`);
          alertSuccess('สำเร็จ', 'ลบขอบเขตงานเรียบร้อย');
          fetchData();
        } catch (err) {
          alertError('ผิดพลาด', 'ไม่สามารถลบขอบเขตงานได้');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSaveTor = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        is_group: values.is_group ? 1 : 0
      };

      if (editingTor) {
        await axiosInstance.put(`/projects/tor-scope/${editingTor.clause_id}`, payload);
        alertSuccess('สำเร็จ', 'อัปเดตขอบเขตงานเรียบร้อย');
      } else {
        await axiosInstance.post('/projects/tor-scope', payload);
        alertSuccess('สำเร็จ', 'เพิ่มขอบเขตงานใหม่เรียบร้อย');
      }
      setIsTorModalVisible(false);
      fetchData();
    } catch (err) {
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกขอบเขตงานได้');
    } finally {
      setLoading(false);
    }
  };

  // --- 🛠️ Reusable Component: Milestone Header ---
  const renderMilestoneHeader = () => {
    const selectedMilestone = milestones.find(m => m.milestone_id === selectedMilestoneId);
    return (
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ margin: 0 }}>รายละเอียดงานแต่ละงวด: {selectedMilestone?.title || 'ยังไม่ได้เลือกงวดงาน'}</Title>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            {selectedMilestone?.description || 'ไม่มีรายละเอียดงวดงาน'}
          </Text>
          {user?.role === 'admin' && selectedMilestone && (
            <Space style={{ marginTop: 12 }}>
              <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => handleEditMilestoneDetails(selectedMilestone)}>
                แก้ไขงวดงาน
              </Button>
              <Button size="small" danger ghost icon={<DeleteOutlined />} onClick={() => handleDeleteMilestone(selectedMilestone.milestone_id)}>
                ลบงวดงาน
              </Button>
            </Space>
          )}
        </div>
        <Space direction="vertical" align="end">
          <Select 
            style={{ width: 280 }}
            size="large"
            placeholder="เลือกงวดงาน"
            value={selectedMilestoneId}
            onChange={setSelectedMilestoneId}
            options={milestones.map(m => ({ label: `${m.title} (${dayjs(m.start_date).format('D MMM')} - ${dayjs(m.end_date).format('D MMM YY')})`, value: m.milestone_id }))}
          />
          {user?.role === 'admin' && (
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddMilestone} style={{ width: '100%' }}>
              เพิ่มงวดงานใหม่
            </Button>
          )}
        </Space>
      </Flex>
    );
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
        {renderMilestoneHeader()}
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
    // Transform data to support "Merged Title" row + "Data" row for specific items
    const displayData = [];
    torScope.forEach(item => {
      if (item.merge_title === 1) {
        // Add Title Row (Merged)
        displayData.push({ 
          ...item, 
          key: `title-${item.clause_id}`, 
          rowType: 'title' 
        });
        // Add Data Row (Standard)
        displayData.push({ 
          ...item, 
          key: `data-${item.clause_id}`, 
          rowType: 'data' 
        });
      } else {
        displayData.push({ 
          ...item, 
          key: item.clause_id, 
          rowType: 'standard' 
        });
      }
    });

    const columns = [
      {
        title: 'ข้อที่',
        dataIndex: 'clause_no',
        key: 'no',
        width: 100,
        onCell: (record) => ({
          rowSpan: record.rowType === 'title' ? 2 : (record.rowType === 'data' ? 0 : 1),
        }),
        render: (text, record) => <Text strong={record.is_group || record.rowType === 'title'}>{text}</Text>
      },
      {
        title: 'หัวข้อการดำเนินงาน / รายละเอียดงาน',
        dataIndex: 'title',
        key: 'title',
        onCell: (record) => ({
          colSpan: record.rowType === 'title' ? 3 : 1,
        }),
        render: (text, record) => {
          if (record.rowType === 'title') {
            return (
              <div style={{ padding: '4px 0' }}>
                <Text strong style={{ fontSize: '15px', color: token.colorPrimary }}>{text}</Text>
              </div>
            );
          }
          
          return (
            <div style={{ paddingLeft: record.parent_no ? '20px' : '0' }}>
              {record.rowType === 'standard' && (
                <div style={{ marginBottom: '4px' }}>
                  <Text strong={record.is_group}>{text}</Text>
                </div>
              )}
              {record.description && (
                <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'pre-wrap' }}>{record.description}</div>
              )}
            </div>
          );
        }
      },
      {
        title: 'กำหนดส่ง',
        key: 'deadline',
        width: 150,
        onCell: (record) => ({
          colSpan: record.rowType === 'title' ? 0 : 1,
        }),
        render: (_, record) => {
          if (record.rowType === 'title') return null;
          if (record.deadline_days && project?.contract_sign_date) {
            const deadline = dayjs(project.contract_sign_date).add(record.deadline_days, 'day');
            const isOverdue = dayjs().isAfter(deadline) && record.status !== 'Done' && record.status !== 'Verified';
            return (
              <Tooltip title={`คำนวนจากวันที่ลงนามสัญญา (${dayjs(project.contract_sign_date).format('DD/MM/YYYY')}) + ${record.deadline_days} วัน`}>
                <Tag color={isOverdue ? 'error' : 'warning'} icon={<CalendarOutlined />}>
                  {deadline.format('DD/MM/YYYY')}
                </Tag>
              </Tooltip>
            );
          }
          return '-';
        }
      },
      {
        title: 'การจับคู่ระบบ/งวดงาน/ภาคผนวก',
        key: 'mapping',
        width: 350,
        onCell: (record) => ({
          colSpan: record.rowType === 'title' ? 0 : 1,
        }),
        render: (_, record) => {
          if (record.rowType === 'title') return null;
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
              {record.annex_table_no && String(record.annex_table_no).split(',').map(no => (
                <Tag key={no} color="blue" icon={<FileDoneOutlined />}>ภาคผนวก ตารางที่ {no}</Tag>
              ))}
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
        width: 150,
        onCell: (record) => ({
          rowSpan: record.rowType === 'title' ? 2 : (record.rowType === 'data' ? 0 : 1),
        }),
        render: (_, record) => {
          if (user?.role !== 'admin') return null;
          return (
            <Space>
              <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => handleEditTor(record)} />
              {!record.is_group && (
                <Button size="small" type="default" icon={<UnorderedListOutlined />} onClick={() => handleEditMapping(record)}>
                  Map
                </Button>
              )}
              <Button size="small" danger ghost icon={<DeleteOutlined />} onClick={() => handleDeleteTor(record.clause_id)} />
            </Space>
          );
        }
      }
    ];

    return (
      <Card 
        variant="borderless" 
        style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', animation: 'fadeIn 0.5s ease' }}
        title={
          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <Space><SearchOutlined /> <Text strong>ขอบเขตงานตามสัญญา (TOR Scope Mapping)</Text></Space>
            {user?.role === 'admin' && (
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddTor}>
                เพิ่มหัวข้อ TOR
              </Button>
            )}
          </Flex>
        }
      >
        <Table 
          dataSource={displayData}
          columns={columns}
          rowKey="key"
          pagination={false}
          size="middle"
          rowClassName={(record) => record.rowType === 'title' ? 'tor-title-row' : (record.rowType === 'data' ? 'tor-data-row' : '')}
        />
      </Card>
    );
  };

  const renderDeliverables = () => {
    const selectedMilestone = milestones.find(m => m.milestone_id === selectedMilestoneId);
    const allTasksDone = currentMilestoneTasks.length > 0 && currentMilestoneTasks.every(t => t.status === 'Done' || t.status === 'Verified');
    
    return (
      <Flex vertical gap={24} style={{ animation: 'fadeIn 0.5s ease' }}>
        <Card 
          variant="borderless" 
          style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          {renderMilestoneHeader()}
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card 
              variant="borderless" 
              style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              title={
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                  <Space><FileDoneOutlined /> <Text strong>รายการสิ่งส่งมอบตามงวดงาน</Text></Space>
                  {user?.role === 'admin' && (
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddDeliverable}>
                      เพิ่มรายการส่งมอบ
                    </Button>
                  )}
                </Flex>
              }
            >
              <Table 
                dataSource={deliverables}
                pagination={false}
                rowKey="deliverable_id"
                columns={[
                  { 
                    title: 'ลำดับ', 
                    key: 'index', 
                    width: 60,
                    render: (text, record, index) => index + 1 
                  },
                  { title: 'ชื่อรายการสิ่งส่งมอบ', dataIndex: 'name', key: 'name' },
                  { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 120, render: (s) => <StatusTag status={s} /> },
                  { 
                    title: 'จัดการ', 
                    key: 'action', 
                    width: 150,
                    render: (_, record) => {
                      if (user?.role !== 'admin') return null;
                      return (
                        <Space>
                          <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => handleEditDeliverable(record)} />
                          <Button size="small" danger ghost icon={<DeleteOutlined />} onClick={() => handleDeleteDeliverable(record.deliverable_id)} />
                        </Space>
                      );
                    }
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
                    percent={selectedMilestone?.progress_percent || 0} 
                    strokeColor={selectedMilestone?.progress_percent === 100 ? '#52c41a' : token.colorPrimary}
                  />
                </div>
                
                <Divider style={{ margin: 0 }} />
                
                <List size="small">
                  <List.Item extra={allTasksDone ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <SyncOutlined spin style={{ color: '#1677ff' }} />}>
                    <Text type={allTasksDone ? 'success' : 'secondary'}>งานตาม TOR ครบถ้วน</Text>
                  </List.Item>
                  <List.Item extra={deliverables.length > 0 && deliverables.every(d => d.status === 'Approved') ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#faad14' }} />}>
                    <Text type={deliverables.length > 0 && deliverables.every(d => d.status === 'Approved') ? 'success' : 'secondary'}>เอกสารสิ่งส่งมอบครบถ้วน</Text>
                  </List.Item>
                </List>

                {user?.role === 'admin' && (
                  <Button 
                    type="primary" 
                    size="large" 
                    block 
                    style={{ height: '50px', borderRadius: '12px' }}
                    disabled={!allTasksDone || deliverables.length === 0 || !deliverables.every(d => d.status === 'Approved')}
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
            { key: 'deliverables', label: <Space><FileDoneOutlined /> สิ่งส่งมอบงวดงาน {user?.role === 'admin' && <Badge dot status="processing" style={{ marginLeft: 4 }} />}</Space> },
            { key: 'payments', label: <Space><BarChartOutlined /> การเบิกจ่ายงวดเงิน</Space> },
            { key: 'sla', label: <Space><SafetyCertificateOutlined /> SLA & Maintenance</Space> }
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

      {/* --- 🛠️ Milestone Modal (Admin Only) --- */}
      <Modal
        title={<Space><EditOutlined /> {editingMilestoneData ? 'แก้ไขข้อมูลและรายละเอียดงวดงาน' : 'เพิ่มงวดงานใหม่'}</Space>}
        open={isMilestoneModalVisible}
        onCancel={() => setIsMilestoneModalVisible(false)}
        onOk={() => milestoneForm.submit()}
        confirmLoading={loading}
        okText="บันทึกข้อมูล"
        cancelText="ยกเลิก"
        width={600}
        centered
      >
        <Form form={milestoneForm} layout="vertical" onFinish={handleSaveMilestone}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="installment_no" label="งวดที่" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item name="title" label="ชื่องวดงาน / หัวข้อหลัก" rules={[{ required: true }]}>
                <Input placeholder="เช่น งวดที่ 1" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="รายละเอียดงานแต่ละงวด (คำอธิบาย)">
            <Input.TextArea rows={4} placeholder="ระบุรายละเอียดงานหรือเงื่อนไขต่างๆ ของงวดนี้..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="วันที่เริ่ม">
                <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="วันที่สิ้นสุด (กำหนดส่ง)">
                <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* --- 🛠️ Deliverable Modal (Admin Only) --- */}
      <Modal
        title={<Space><FileDoneOutlined /> {editingDeliverable ? 'แก้ไขรายการสิ่งส่งมอบ' : 'เพิ่มรายการสิ่งส่งมอบ'}</Space>}
        open={isDeliverableModalVisible}
        onCancel={() => setIsDeliverableModalVisible(false)}
        onOk={() => deliverableForm.submit()}
        confirmLoading={loading}
        okText="บันทึก"
        cancelText="ยกเลิก"
        centered
      >
        <Form form={deliverableForm} layout="vertical" onFinish={handleSaveDeliverable}>
          <Form.Item name="name" label="ชื่อรายการสิ่งส่งมอบ" rules={[{ required: true, message: 'กรุณาระบุชื่อรายการสิ่งส่งมอบ' }]}>
            <Input.TextArea rows={3} placeholder="เช่น 1) แผนการบริหารจัดการ ดูแล บำรุงรักษารายการคอมพิวเตอร์แม่ข่าย..." />
          </Form.Item>

          <Form.Item name="status" label="สถานะการส่งมอบ" initialValue="Pending" rules={[{ required: true }]}>
            <Select options={[
              { label: 'รอดำเนินการ (Pending)', value: 'Pending' },
              { label: 'ส่งมอบแล้วรอตรวจ (Uploaded)', value: 'Uploaded' },
              { label: 'อนุมัติผ่าน (Approved)', value: 'Approved' },
              { label: 'ตีกลับ/ไม่อนุมัติ (Rejected)', value: 'Rejected' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- 🛠️ TOR Scope Modal (Admin Only) --- */}
      <Modal
        title={<Space><SearchOutlined /> {editingTor ? 'แก้ไขหัวข้อ TOR' : 'เพิ่มหัวข้อ TOR ใหม่'}</Space>}
        open={isTorModalVisible}
        onCancel={() => setIsTorModalVisible(false)}
        onOk={() => torForm.submit()}
        confirmLoading={loading}
        okText="บันทึกข้อมูล"
        cancelText="ยกเลิก"
        width={600}
        centered
      >
        <Form form={torForm} layout="vertical" onFinish={handleSaveTor}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="clause_no" label="ข้อที่ (เช่น 5.1)" rules={[{ required: true }]}>
                <Input placeholder="เลขข้อ TOR" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="title" label="หัวข้อการดำเนินงาน" rules={[{ required: true }]}>
                <Input placeholder="ชื่อหัวข้อหลัก" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="รายละเอียดงาน (ถ้ามี)">
            <Input.TextArea rows={3} placeholder="คำอธิบายเพิ่มเติม..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="parent_no" label="เป็นหัวข้อย่อยของ (เลขข้อหลัก)">
                <Input placeholder="เช่น 5 (เว้นว่างถ้าเป็นข้อหลัก)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Flex gap={16} style={{ marginTop: '30px' }}>
                <Form.Item name="is_group" valuePropName="checked" noStyle>
                  <Switch checkedChildren="หัวข้อกลุ่ม" unCheckedChildren="หัวข้อปกติ" />
                </Form.Item>
                <Form.Item name="merge_title" valuePropName="checked" noStyle>
                  <Switch checkedChildren="ผสานเซล" unCheckedChildren="ปกติ" />
                </Form.Item>
              </Flex>
            </Col>
          </Row>
        </Form>
      </Modal>

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
              mode="multiple"
              placeholder="เลือกตารางภาคผนวก"
              options={[
                { label: 'ตารางที่ 1: Hardware/Software แม่ข่าย', value: 1 },
                { label: 'ตารางที่ 2: ระบบสารสนเทศ', value: 2 },
              ]}
              allowClear
            />
          </Form.Item>

          <Form.Item name="deadline_days" label="กำหนดส่ง (จำนวนวันหลังจากลงนามสัญญา)">
            <InputNumber style={{ width: '100%' }} placeholder="เช่น 7, 30, 90" min={1} />
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
