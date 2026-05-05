const fs = require('fs');
const path = 'frontend/src/components/BackupManagement.jsx';
let content = fs.readFileSync(path, 'utf8');

console.log('🔄 เริ่มต้นการอัปเกรด Frontend (Adding Cleanup Tab)...');

// 1. เพิ่ม State
const statesStr = `
  const [gdriveSetting, setGdriveSetting] = useState(null); 
  const [cleanupSetting, setCleanupSetting] = useState(null); // ✅ Cleanup State
`;
content = content.replace('const [gdriveSetting, setGdriveSetting] = useState(null);', statesStr);

const formsStr = `
  const [gdriveForm] = Form.useForm(); 
  const [cleanupForm] = Form.useForm(); // ✅ Cleanup Form
`;
content = content.replace('const [gdriveForm] = Form.useForm();', formsStr);

// 2. เพิ่ม Data Fetching
const fetchCallsStr = `
        axiosInstance.get('/backup/gdrive/logs'),
        axiosInstance.get('/backup/gdrive/settings'),
        axiosInstance.get('/cleanup/settings') // ✅ Fetch Cleanup
      ]);
`;
content = content.replace(/axiosInstance\.get\('\/backup\/gdrive\/logs'\),\s*axiosInstance\.get\('\/backup\/gdrive\/settings'\)\s*\]\);/g, fetchCallsStr);

const setSettingStr = `
      setGdriveSetting(gdriveSettingRes.data);
      setCleanupSetting(arguments[0][8]?.data); // ✅ Set Cleanup
`;
content = content.replace('setGdriveSetting(gdriveSettingRes.data);', setSettingStr);

// 3. เพิ่ม useEffect
const cleanupEffectStr = `
  useEffect(() => {
    if (cleanupSetting) {
      cleanupForm.setFieldsValue({
        db_retention_days: cleanupSetting.db_retention_days || 30,
        source_retention_days: cleanupSetting.source_retention_days || 30,
        system_log_retention_days: cleanupSetting.system_log_retention_days || 90,
        ticket_log_retention_days: cleanupSetting.ticket_log_retention_days || 180,
        schedule_type: cleanupSetting.schedule_type || 'weekly',
        schedule_days: cleanupSetting.schedule_type === 'weekly' ? (cleanupSetting.schedule_days ? cleanupSetting.schedule_days.split(',') : []) : cleanupSetting.schedule_days,
        schedule_time: cleanupSetting.schedule_time ? dayjs(cleanupSetting.schedule_time, 'HH:mm:ss') : dayjs('03:00:00', 'HH:mm:ss'),
        is_active: cleanupSetting.is_active === 1
      });
    }
  }, [cleanupSetting, cleanupForm]);
`;
if (!content.includes('cleanupForm.setFieldsValue')) {
    content = content.replace('// --- 4. Logic & Handlers ---', cleanupEffectStr + '\n  // --- 4. Logic & Handlers ---');
}

// 4. เพิ่ม Handlers
const handlersStr = `
  const handleSaveCleanupSettings = async (values) => {
    try {
      let days = '';
      if (values.schedule_type === 'weekly') days = values.schedule_days ? values.schedule_days.join(',') : '';
      else if (values.schedule_type === 'monthly') days = values.schedule_days || '1';

      const payload = {
        ...values,
        schedule_days: days,
        schedule_time: values.schedule_time ? values.schedule_time.format('HH:mm:ss') : '03:00:00',
        is_active: values.is_active ? 1 : 0
      };
      
      await axiosInstance.put('/cleanup/settings', payload);
      alertSuccess('บันทึกสำเร็จ', 'อัปเดตการตั้งค่าการล้างข้อมูลเรียบร้อยแล้ว');
      fetchData();
    } catch (error) {
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
    }
  };

  const handleManualCleanup = async () => {
    const result = await alertConfirm('ยืนยันล้างข้อมูล?', 'ระบบจะลบข้อมูลที่หมดอายุตามที่คุณตั้งค่าไว้ (ไม่สามารถกู้คืนได้) ยืนยันหรือไม่?');
    if (result.isConfirmed) {
        try {
            setLoading(true);
            const res = await axiosInstance.post('/cleanup/manual');
            const { report } = res.data;
            alertSuccess('ล้างข้อมูลสำเร็จ', \`ลบ Backup DB: \${report.dbDeleted}, Source: \${report.sourceDeleted}, SysLogs: \${report.sysLogsDeleted}, TicketLogs: \${report.ticketLogsDeleted} รายการ\`);
        } catch (e) {
            alertError('ผิดพลาด', 'ไม่สามารถล้างข้อมูลได้');
        } finally {
            setLoading(false);
            fetchData();
        }
    }
  };
`;
if (!content.includes('handleSaveCleanupSettings')) {
    content = content.replace('const handleTabChange', handlersStr + '\n  const handleTabChange');
}

// 5. แทรก Tab ใหม่ลงไปที่ตัวสุดท้าย
const tabStr = `
          },
          {
            key: '5',
            label: <span><DeleteOutlined /> ล้างข้อมูล (Cleanup)</span>,
            forceRender: true,
            children: (
              <Row gutter={[24, 24]} style={{ marginTop: '0px' }}>
                <Col xs={24} lg={12}>
                  <Card title={<><SettingOutlined /> นโยบายการล้างข้อมูลอัตโนมัติ (Retention Policy)</>} variant="borderless" style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }} styles={{ header: { backgroundColor: '#ef4444', color: '#fff', borderBottom: '1px solid var(--border-color)' } }}>
                    <Form form={cleanupForm} layout="vertical" onFinish={handleSaveCleanupSettings}>
                      <Form.Item name="is_active" valuePropName="checked" style={{ backgroundColor: 'var(--bg-app)', padding: '10px 15px', borderRadius: 8, border: '1px solid var(--border-color)' }}><Checkbox><Text strong style={{ color: 'var(--text-main)' }}>เปิดใช้งาน Auto Cleanup</Text></Checkbox></Form.Item>
                      <Row gutter={16}>
                        <Col span={12}><Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>เก็บ Backup DB (วัน)</Text>} name="db_retention_days" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} size="large" addonAfter="วัน" /></Form.Item></Col>
                        <Col span={12}><Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>เก็บ Source Code (วัน)</Text>} name="source_retention_days" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} size="large" addonAfter="วัน" /></Form.Item></Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}><Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>เก็บ System Logs (วัน)</Text>} name="system_log_retention_days" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} size="large" addonAfter="วัน" /></Form.Item></Col>
                        <Col span={12}><Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>เก็บประวัติใบงาน (วัน)</Text>} name="ticket_log_retention_days" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} size="large" addonAfter="วัน" /></Form.Item></Col>
                      </Row>
                      <Divider style={{ borderColor: 'var(--border-color)' }}/>
                      <Form.Item name="schedule_type" label={<Text strong style={{ color: 'var(--text-main)' }}>รอบการทำงาน</Text>}>
                        <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                          <Radio.Button value="daily" style={{ width: '33.33%', textAlign: 'center' }}>วัน</Radio.Button>
                          <Radio.Button value="weekly" style={{ width: '33.34%', textAlign: 'center' }}>สัปดาห์</Radio.Button>
                          <Radio.Button value="monthly" style={{ width: '33.33%', textAlign: 'center' }}>เดือน</Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                      <Form.Item noStyle shouldUpdate={(prev, current) => prev.schedule_type !== current.schedule_type}>
                        {({ getFieldValue }) => {
                          const type = getFieldValue('schedule_type');
                          if (type === 'weekly') return <Form.Item name="schedule_days" label={<Text strong style={{ color: 'var(--text-main)' }}>เลือกวันในสัปดาห์</Text>}><Checkbox.Group options={weekOptions} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} /></Form.Item>;
                          if (type === 'monthly') return <Form.Item name="schedule_days" label={<Text strong style={{ color: 'var(--text-main)' }}>เลือกวันที่ของทุกเดือน</Text>}><Select placeholder="เลือกวันที่" size="large" options={monthOptions} /></Form.Item>;
                          return null;
                        }}
                      </Form.Item>
                      <Form.Item name="schedule_time" label={<Text strong style={{ color: 'var(--text-main)' }}>เวลาดำเนินการ (แนะนำช่วงดึก)</Text>} rules={[{ required: true, message: 'กรุณาเลือกเวลา' }]}>
                        <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                      </Form.Item>
                      <Divider style={{ borderColor: 'var(--border-color)' }}/>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block size="large" style={{ backgroundColor: '#ef4444' }}>บันทึกนโยบายล้างข้อมูล</Button>
                    </Form>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card 
                    title={<Space><DeleteOutlined /> การล้างข้อมูลแบบ Manual</Space>} 
                    variant="borderless" 
                    style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)', height: '100%' }} 
                    styles={{ header: { backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' } }}
                  >
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <DeleteOutlined style={{ fontSize: '64px', color: '#ef4444', marginBottom: '20px' }} />
                        <Title level={4} style={{ color: 'var(--text-main)' }}>ล้างข้อมูลขยะที่หมดอายุทันที</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '30px' }}>
                            ระบบจะทำการค้นหาและลบไฟล์ Backup, Source Code และ Logs ต่างๆ ที่มีอายุเกินกว่าที่ตั้งไว้ในฝั่งซ้ายโดยทันที (ไม่สามารถกู้คืนได้)
                        </Text>
                        <Button type="primary" danger size="large" icon={<DeleteOutlined />} onClick={handleManualCleanup} style={{ height: '50px', fontSize: '16px', borderRadius: '8px', padding: '0 40px' }}>
                            ล้างข้อมูลเดี๋ยวนี้
                        </Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            )
`;

const replaceRegex = /\]\}\s*\/\>\s*<\/div>\s*\);\s*\}/;
content = content.replace(replaceRegex, tabStr + '\n          }\n        ]}\n      />\n    </div>\n  );\n}');

fs.writeFileSync(path, content);
console.log('✅ เพิ่ม Cleanup Tab ลงในหน้า Frontend สำเร็จ!');
