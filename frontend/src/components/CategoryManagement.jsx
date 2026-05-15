import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, Table, Button, Space, Typography, Tag, Modal, Form, 
  Input, Select, Popconfirm, Row, Col, Tabs, InputNumber, 
  Switch, message, Divider, Badge, theme 
} from 'antd';
import { 
  AppstoreOutlined, PlusOutlined, EditOutlined, DeleteOutlined, 
  ArrowLeftOutlined, GlobalOutlined, ApartmentOutlined, SettingOutlined,
  DesktopOutlined, ApiOutlined, DatabaseOutlined, TagsOutlined, 
  ProfileOutlined, FileProtectOutlined, SearchOutlined 
} from '@ant-design/icons';
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError } from '../utils/alert';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function CategoryManagement() {
  const { useToken } = theme;
  const { token } = useToken();
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]); 
  
  // Search & Pagination States
  const [projectSearchText, setSearchText] = useState('');
  const [catPageSize, setCatPageSize] = useState(15);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); 
  const [catForm] = Form.useForm();

  const [isProjModalVisible, setIsProjModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null); 
  const [projForm] = Form.useForm();
  const [isProjManageModalVisible, setIsProjManageModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [isTypeManageModalVisible, setIsTypeManageModalVisible] = useState(false);
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm] = Form.useForm();

  const [equipments, setEquipments] = useState([]);
  const [isEqListModalVisible, setIsEqListModalVisible] = useState(false);
  const [isEqFormModalVisible, setIsEqFormModalVisible] = useState(false);
  const [selectedCategoryForEq, setSelectedCategoryForEq] = useState(null);
  const [editingEq, setEditingEq] = useState(null);
  const [eqForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, projRes, typeRes, eqRes, vendRes] = await Promise.all([
        axiosInstance.get('/categories'),
        axiosInstance.get('/projects'),
        axiosInstance.get('/categories/types'),
        axiosInstance.get('/equipments').catch(() => ({ data: [] })),
        axiosInstance.get('/vendors').catch(() => ({ data: [] })) 
      ]);
      
      const sortedCats = catRes.data.sort((a, b) => Number(a.category_id) - Number(b.category_id));
      const sortedProjs = projRes.data.sort((a, b) => Number(a.project_id) - Number(b.project_id));
      const sortedTypes = (typeRes.data || []).sort((a, b) => Number(a.type_id) - Number(b.type_id));
      const sortedEqs = (eqRes.data || []).sort((a, b) => Number(a.equipment_id) - Number(b.equipment_id));
      
      setCategories(sortedCats);
      setProjects(sortedProjs);
      setCategoryTypes(sortedTypes);
      setEquipments(sortedEqs); 
      setVendors(vendRes.data || []);
    } catch (error) {
      alertError('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Filtering Logic ---
  const filteredProjects = useMemo(() => {
    if (!projectSearchText) return projects;
    const search = projectSearchText.toLowerCase();
    return projects.filter(p => 
      p.project_name?.toLowerCase().includes(search) || 
      p.vendor_name?.toLowerCase().includes(search) ||
      p.project_contract?.toLowerCase().includes(search)
    );
  }, [projects, projectSearchText]);

  const handleTypeManage = () => setIsTypeManageModalVisible(true);
  const handleTypeAdd = () => { setEditingType(null); typeForm.resetFields(); setIsTypeModalVisible(true); };
  const handleTypeEdit = (record) => { setEditingType(record); typeForm.setFieldsValue(record); setIsTypeModalVisible(true); };
  const handleTypeDelete = async (id) => {
    try { await axiosInstance.delete(`/categories/types/${id}`); alertSuccess('ลบสำเร็จ', 'ประเภทถูกลบออกแล้ว'); fetchData(); }
    catch (error) { alertError('ลบไม่สำเร็จ', 'ไม่สามารถลบได้'); }
  };
  const handleTypeSubmit = async (values) => {
    try {
      if (editingType) { await axiosInstance.put(`/categories/types/${editingType.type_id}`, values); alertSuccess('อัปเดตสำเร็จ', 'แก้ไขประเภทเรียบร้อย'); }
      else { await axiosInstance.post('/categories/types', values); alertSuccess('เพิ่มสำเร็จ', 'เพิ่มประเภทใหม่เรียบร้อย'); }
      setIsTypeModalVisible(false); fetchData();
    } catch (error) { alertError('บันทึกไม่สำเร็จ', 'รหัส Type อาจซ้ำกัน'); }
  };
  const typeColumns = [
    { title: 'ชื่อประเภท (อังกฤษ/รหัส)', dataIndex: 'type_code', key: 'type_code' },
    { title: 'ชื่อที่แสดงบนหัวตาราง', dataIndex: 'type_name', key: 'type_name' },
    { title: 'จัดการ', key: 'action', align: 'right', width: 120, render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleTypeEdit(record)} />
          <Popconfirm title="ยืนยันการลบ?" onConfirm={() => handleTypeDelete(record.type_id)} okText="ลบ" cancelText="ยกเลิก"><Button type="primary" danger size="small" icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  const handleProjectManage = () => setIsProjManageModalVisible(true);
  const handleProjectAdd = () => { setEditingProject(null); projForm.resetFields(); setIsProjModalVisible(true); };
  const handleProjectEdit = (record) => { setEditingProject(record); projForm.setFieldsValue({ ...record, contract_value: Number(record.contract_value) || 0, penalty_rate: Number(record.penalty_rate) || 0.001 }); setIsProjModalVisible(true); };
  const handleProjectDelete = async (id) => { try { await axiosInstance.delete(`/projects/${id}`); alertSuccess('ลบสำเร็จ', 'ลบโครงการแล้ว'); fetchData(); } catch (error) { alertError('ลบไม่สำเร็จ', error.response?.data?.error || 'เกิดข้อผิดพลาด'); } };
  const handleProjectSubmit = async (values) => { try { if (editingProject) await axiosInstance.put(`/projects/${editingProject.project_id}`, values); else await axiosInstance.post('/projects', values); setIsProjModalVisible(false); fetchData(); alertSuccess('สำเร็จ', 'บันทึกข้อมูลโครงการและสัญญาเรียบร้อย'); } catch (error) { alertError('บันทึกไม่สำเร็จ', 'เกิดข้อผิดพลาด'); } };

  const projManageColumns = [
    { title: 'ชื่อโครงการ', dataIndex: 'project_name', key: 'project_name', width: 250, render: (text) => <Text strong>{text}</Text> },
    { title: 'ผู้รับจ้าง', dataIndex: 'vendor_name', key: 'vendor_name', width: 200, render: (text) => text ? <Tag color="blue">{text}</Tag> : '-' },
    { title: 'เลขที่สัญญา', dataIndex: 'project_contract', key: 'project_contract', align: 'center' },
    { title: 'มูลค่า (฿)', dataIndex: 'contract_value', align: 'right', render: (val) => parseFloat(val).toLocaleString() },
    { title: 'ปรับ/วัน', dataIndex: 'penalty_rate', align: 'center', render: (val) => `${(val * 100).toFixed(2)}%` },
    { title: 'จัดการ', key: 'action', align: 'center', width: 100, render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} style={{ color: '#1890ff' }} onClick={() => handleProjectEdit(record)} />
          <Popconfirm title="ยืนยันการลบโครงการนี้?" onConfirm={() => handleProjectDelete(record.project_id)} okText="ลบ" cancelText="ยกเลิก"><Button type="text" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    },
  ];

  const handleCatAdd = () => { setEditingCategory(null); catForm.resetFields(); catForm.setFieldsValue({ project_id: selectedProject ? selectedProject.project_id : undefined, weighting_factor: 1.0 }); setIsModalVisible(true); };
  const handleCatEdit = (record) => { setEditingCategory(record); catForm.setFieldsValue(record); setIsModalVisible(true); };
  const handleCatDelete = async (id) => { try { await axiosInstance.delete(`/categories/${id}`); alertSuccess('ลบสำเร็จ', 'ลบหมวดหมู่แล้ว'); fetchData(); } catch (error) { alertError('ลบไม่สำเร็จ', 'เกิดข้อผิดพลาด'); } };
  const handleCatSubmit = async (values) => { try { if (editingCategory) await axiosInstance.put(`/categories/${editingCategory.category_id}`, values); else await axiosInstance.post('/categories', values); setIsModalVisible(false); fetchData(); alertSuccess('สำเร็จ', 'บันทึกหมวดหมู่เรียบร้อย'); } catch (error) { alertError('บันทึกไม่สำเร็จ', 'เกิดข้อผิดพลาด'); } };

  const getCatColumns = (headerName) => [
    { title: 'ลำดับ', key: 'index', width: 60, align: 'center', render: (text, record, index) => index + 1 },
    { title: headerName || 'ชื่อหมวดหมู่ / ระบบ', dataIndex: 'category_name', key: 'category_name', render: text => <Text strong>{text}</Text> },
    { title: 'ค่าตัวถ่วง', dataIndex: 'weighting_factor', align: 'center', width: 100, render: (val) => <Tag color="orange" style={{ borderRadius: '8px' }}>{val}</Tag> },
    { title: 'อุปกรณ์ย่อย', key: 'equipment_manage', align: 'center', width: 130, render: (_, record) => {
        const eqCount = equipments.filter(e => e.category_id === record.category_id).length;
        return (
          <Button type="dashed" size="small" style={{ borderRadius: '8px' }} onClick={() => { setSelectedCategoryForEq(record); setIsEqListModalVisible(true); }}>
            <DesktopOutlined /> จัดการ <Tag color={eqCount > 0 ? 'blue' : 'default'} style={{ marginLeft: 5, borderRadius: '10px' }}>{eqCount}</Tag>
          </Button>
        );
      } 
    },
    { title: 'แก้ไข/ลบ', key: 'action', align: 'right', width: 120, render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleCatEdit(record)} />
          <Popconfirm title="ยืนยันการลบ?" onConfirm={() => handleCatDelete(record.category_id)} okText="ลบ" cancelText="ยกเลิก"><Button type="primary" danger size="small" icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    },
  ];

  const getTabIcon = (typeCode) => {
    const code = String(typeCode).toLowerCase();
    if (code.includes('hard')) return <DesktopOutlined />;
    if (code.includes('soft')) return <AppstoreOutlined />;
    if (code.includes('app')) return <GlobalOutlined />;
    if (code.includes('serv')) return <ApiOutlined />;
    return <TagsOutlined />;
  };

  const renderProjectCards = () => {
    const allProjectsList = [...filteredProjects];
    const cardThemes = [
      { bg: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)', color: '#e11d48', tagBg: '#fda4af', border: '#fecdd3' }, 
      { bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', color: '#9333ea', tagBg: '#d8b4fe', border: '#e9d5ff' }, 
      { bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#16a34a', tagBg: '#86efac', border: '#bbf7d0' }, 
      { bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', color: '#0284c7', tagBg: '#7dd3fc', border: '#bae6fd' }, 
      { bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', color: '#ea580c', tagBg: '#fdba74', border: '#fed7aa' }, 
    ];

    if (allProjectsList.length === 0) return <Empty description="ไม่พบโครงการที่ค้นหา" />;

    return (
      <Row gutter={[24, 24]} align="stretch">
        {allProjectsList.map((proj, index) => {
          const count = categories.filter(c => c.project_id === proj.project_id).length;
          const theme = cardThemes[index % cardThemes.length];
          
          return (
            <Col xs={24} sm={12} md={8} lg={8} key={proj.project_id}>
              <div 
                onClick={() => setSelectedProject(proj)}
                style={{
                  background: theme.bg, borderRadius: '24px', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', height: '100%', border: `2px solid ${theme.border}` 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: theme.color, fontSize: '16px', fontWeight: '900', marginBottom: '8px' }}>{proj.project_name}</div>
                    <div style={{ fontSize: '42px', fontWeight: '900', color: '#1e293b', lineHeight: '1' }}>{count}</div>
                    <div style={{ marginTop: '10px' }}><span style={{ background: theme.tagBg, color: '#ffffff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>รายการ</span></div>
                  </div>
                  <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ApartmentOutlined style={{ fontSize: '24px', color: theme.color }} />
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: `1px dashed ${theme.color}40`, fontSize: '13px', color: '#334155' }}>
                  <div style={{ marginBottom: '5px' }}><strong>ผู้รับจ้าง:</strong> {proj.vendor_name || '-'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>เลขที่สัญญา:</strong> <Tag color="white" style={{ color: theme.color, border: `1px solid ${theme.color}60` }}>{proj.project_contract || '-'}</Tag></span>
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    );
  };

  const renderCategoryTabs = () => {
    const projectCategories = categories.filter(c => c.project_id === selectedProject.project_id);
    const tabItems = categoryTypes.map((type, index) => {
      const catsOfType = projectCategories.filter(c => c.category_type === type.type_code);
      return {
        key: String(index + 1),
        label: (
          <span>
            {getTabIcon(type.type_code)} {type.type_code}
            <Tag style={{ color: catsOfType.length > 0 ? '#ffffff' : '#64748b', backgroundColor: catsOfType.length > 0 ? '#3b82f6' : '#e2e8f0', borderRadius: '12px', marginLeft: 8, border: 'none', fontWeight: 'bold' }}>{catsOfType.length}</Tag>
          </span>
        ),
        children: (
          <div style={{ padding: '10px 0' }}>
            <Table 
              columns={getCatColumns(type.type_name)} 
              dataSource={catsOfType} 
              rowKey="category_id" 
              pagination={{ 
                pageSize: catPageSize,
                showSizeChanger: true,
                pageSizeOptions: ['10', '15', '20', '50', '100'],
                onShowSizeChange: (current, size) => setCatPageSize(size),
                showTotal: (total) => `ทั้งหมด ${total} รายการ`
              }} 
              size="middle" 
              scroll={{ x: 'max-content' }}
            />
          </div>
        )
      };
    });
    return (
      <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Tabs className="modern-tabs" type="card" defaultActiveKey="1" items={tabItems} size="large" />
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <style>{`
        .modern-tabs .ant-tabs-tab { padding: 12px 24px; font-size: 15px; border-radius: 12px 12px 0 0 !important; transition: all 0.3s; border: 1px solid #e2e8f0 !important; border-bottom: none !important; background-color: #f8fafc !important; color: #64748b !important; }
        .modern-tabs .ant-tabs-tab-active { background-color: #0ea5e9 !important; border-color: #0ea5e9 !important; }
        .modern-tabs .ant-tabs-tab-active .ant-tabs-tab-btn, .modern-tabs .ant-tabs-tab-active .ant-tabs-tab-btn span { color: #ffffff !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          {selectedProject ? (
            <Space align="center" size="middle">
              <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedProject(null)} style={{ borderRadius: '10px', height: '40px' }}>ย้อนกลับ</Button>
              <Title level={3} style={{ color: '#1e293b', margin: 0 }}>
                <DatabaseOutlined style={{ color: '#0ea5e9', marginRight: '8px' }}/> โครงการ: {selectedProject.project_name}
              </Title>
            </Space>
          ) : (
            <Space size="large">
              <Title level={3} style={{ color: '#1e293b', margin: 0 }}>
                <AppstoreOutlined style={{ color: '#0ea5e9', marginRight: '10px' }}/> จัดการโครงการและหมวดหมู่
              </Title>
              <Search 
                placeholder="ค้นหาชื่อโครงการ, ผู้รับจ้าง หรือสัญญา..." 
                allowClear 
                style={{ width: 350 }} 
                onSearch={v => setSearchText(v)}
                onChange={e => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
              />
            </Space>
          )}
        </div>
        <Space>
          {!selectedProject ? (
            <Button type="primary" icon={<SettingOutlined />} size="large" style={{ backgroundColor: '#2a1a4a', borderRadius: '10px' }} onClick={handleProjectManage}>จัดการโครงการ & สัญญา</Button>
          ) : (
            <>
              <Button type="dashed" icon={<ProfileOutlined />} size="large" style={{ borderRadius: '10px' }} onClick={handleTypeManage}>จัดการประเภท</Button>
              <Button type="primary" icon={<PlusOutlined />} size="large" style={{ backgroundColor: '#10b981', borderColor: '#10b981', borderRadius: '10px' }} onClick={handleCatAdd}>เพิ่มหมวดหมู่ใหม่</Button>
            </>
          )}
        </Space>
      </div>

      {selectedProject ? renderCategoryTabs() : renderProjectCards()}

      <Modal 
        title={<><SettingOutlined /> จัดการรายชื่อโครงการ และ สัญญา</>} 
        open={isProjManageModalVisible} 
        onCancel={() => setIsProjManageModalVisible(false)} 
        footer={null} 
        width={1200} 
        destroyOnHidden
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
          <Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: '#10b981', borderRadius: '8px' }} onClick={handleProjectAdd}>เพิ่มโครงการ</Button>
        </div>
        <Table columns={projManageColumns} dataSource={projects} rowKey="project_id" pagination={{ pageSize: 10 }} scroll={{ x: 'max-content' }} />
      </Modal>

      <Modal title={editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => catForm.submit()} destroyOnHidden>
        <Form form={catForm} layout="vertical" onFinish={handleCatSubmit}>
          <Form.Item name="project_id" label="โครงการ" rules={[{ required: true }]}><Select>{projects.map(p => <Option key={p.project_id} value={p.project_id}>{p.project_name}</Option>)}</Select></Form.Item>
          <Form.Item name="category_name" label="ชื่อหมวดหมู่" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category_type" label="ประเภท" rules={[{ required: true }]}><Select>{categoryTypes.map(t => <Option key={t.type_code} value={t.type_code}>{t.type_name}</Option>)}</Select></Form.Item>
          <Form.Item name="weighting_factor" label="ค่าตัวถ่วง (Weighting Factor)"><InputNumber min={0} step={0.1} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={editingProject ? "แก้ไขโครงการ" : "เพิ่มโครงการใหม่"} open={isProjModalVisible} onCancel={() => setIsProjModalVisible(false)} onOk={() => projForm.submit()} destroyOnHidden>
        <Form form={projForm} layout="vertical" onFinish={handleProjectSubmit}>
          <Form.Item name="project_name" label="ชื่อโครงการ" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="vendor_id" label="ผู้รับจ้าง"><Select allowClear>{vendors.map(v => <Option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</Option>)}</Select></Form.Item>
          <Form.Item name="project_contract" label="เลขที่สัญญา"><Input /></Form.Item>
          <Form.Item name="contract_value" label="มูลค่าสัญญา"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="penalty_rate" label="อัตราค่าปรับต่อวัน (เช่น 0.001)"><InputNumber step={0.0001} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
