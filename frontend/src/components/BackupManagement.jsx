import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Row, Col, Typography, Button, Table, Space, Tag, Form, Radio, Checkbox, 
  TimePicker, Popconfirm, Divider, Tabs, Select, Empty, Progress, 
  Input, Calendar, Tooltip, ConfigProvider, App, Badge, Modal 
} from 'antd';

import { 
  DatabaseOutlined, SettingOutlined, DownloadOutlined, RollbackOutlined, 
  CloudServerOutlined, SaveOutlined, DeleteOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, CodeOutlined, FileZipOutlined, GithubOutlined, 
  CalendarOutlined, LeftOutlined, RightOutlined, SyncOutlined, GoogleOutlined,
  SafetyCertificateOutlined, ClearOutlined, EditOutlined, PlusOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import dayjs from 'dayjs';
import axiosInstance from '../services/api/axiosInstance';
import { alertSuccess, alertError, alertConfirm } from '../utils/alert';
import { API_BASE_URL } from '../utils/config';

// 🇹🇭 โหลดภาษาไทยให้กับ Ant Design และ DayJS
import thTH from 'antd/locale/th_TH';
import 'dayjs/locale/th';
dayjs.locale('th');

const { Title, Text } = Typography;
const { Option } = Select;
const BACKEND_URL = API_BASE_URL; // สำหรับ Download Link

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StorageStatusBar = ({ title, stats, icon, color, isCloud = false }) => {
  if (!stats) return null;
  const isDark = document.body.classList.contains('dark-mode');
  const pct = stats.percentage || 0;
  const displayColor = (color === '#111827' && isDark) ? '#f3f4f6' : color;
  
  return (
    <Card size="small" variant="borderless" style={{ marginBottom: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <Text strong style={{ color: displayColor, display: 'flex', alignItems: 'center', gap: '8px' }}>{icon} {title}</Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>{formatBytes(stats.used)} / {formatBytes(stats.total)}</Text>
      </div>
      <Progress 
        percent={parseFloat(pct.toFixed(1))} 
        strokeColor={pct >= 90 ? '#ef4444' : displayColor} 
        railColor={isDark ? '#374151' : '#f1f5f9'}
        status={pct >= 90 ? 'exception' : 'normal'}
        showInfo={false}
        size="small"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <Text type="secondary" style={{ fontSize: '11px' }}>
          ใช้ไป (รวม): {pct.toFixed(1)}% 
          {stats.categoryUsed > 0 && (
            <span style={{ marginLeft: '8px', color: color, fontWeight: '500' }}>
              (เฉพาะส่วนนี้: {formatBytes(stats.categoryUsed)})
            </span>
          )}
        </Text>
        <Text type="secondary" style={{ fontSize: '11px', color: pct >= 90 ? '#ef4444' : 'var(--text-sub)' }}>
          {isCloud ? 'คงเหลือบน Cloud:' : 'พื้นที่ดิสก์คงเหลือ:'} {formatBytes(stats.remaining)}
        </Text>
      </div>
    </Card>
  );
};

export default function BackupManagement() {
  const { message: msg } = App.useApp();
  
  // --- 1. State Declarations ---
  const [logs, setLogs] = useState([]);
  const [sourceLogs, setSourceLogs] = useState([]);
  const [githubLogs, setGithubLogs] = useState([]); 
  const [gdriveLogs, setGdriveLogs] = useState([]); 
  const [storageStats, setStorageStats] = useState(null);
  
  // ✅ [New] States สำหรับเก็บรายการที่เลือก
  const [selectedDbKeys, setSelectedDbKeys] = useState([]);
  const [selectedSrcKeys, setSelectedSrcKeys] = useState([]);
  const [selectedGitKeys, setSelectedGitKeys] = useState([]);
  const [selectedGdriveKeys, setSelectedGdriveKeys] = useState([]);
  const [storageHistory, setStorageHistory] = useState([]); // ✅ [New] เก็บประวัติพื้นที่ย้อนหลัง


  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('backupActiveTab') || '0');
  const [taskHistory, setTaskHistory] = useState([]); // ✅ [New] เก็บประวัติแผนงานจริงจาก DB
  const [calendarValue, setCalendarValue] = useState(() => dayjs());

  const [dbSetting, setDbSetting] = useState(null);
  const [sourceSettings, setSourceSettings] = useState([]); // ✅ เปลี่ยนเป็น Array รองรับหลาย Profile
  const [githubSetting, setGithubSetting] = useState(null);
  const [gdriveSetting, setGdriveSetting] = useState(null); 
  const [cleanupSetting, setCleanupSetting] = useState(null); // ✅ [New] สำหรับ Cleanup
  const [cleanupPreview, setCleanupPreview] = useState(null); // ✅ [New] สำหรับวิเคราะห์ข้อมูลก่อนลบ
  const [detailModalVisible, setDetailModalVisible] = useState(false); // ✅ [New] สำหรับ Drill Down
  const [detailType, setDetailType] = useState(null); // ✅ [New]
  const [detailData, setDetailData] = useState([]); // ✅ [New]
  const [isDetailLoading, setIsDetailLoading] = useState(false); // ✅ [New]
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false); // ✅ [New]
  const [calendarModalData, setCalendarModalData] = useState([]); // ✅ [New]
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null); // ✅ [New]
  const [gdriveFileStatus, setGdriveFileStatus] = useState({}); // { log_id: [ {id, exists} ] }
  
  const [loading, setLoading] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false); 
  const [gdriveLoading, setGdriveLoading] = useState(false); 
  const [cleanupLoading, setCleanupLoading] = useState(false); // ✅ [New]
  const [isPreviewLoading, setIsPreviewLoading] = useState(false); // ✅ [New]
  
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const [isDbBackingUp, setIsDbBackingUp] = useState(false);
  const [dbProgress, setDbProgress] = useState(0);

  const [isGithubPushing, setIsGithubPushing] = useState(false);
  const [githubProgress, setGithubProgress] = useState(0);

  const [isGdrivePushing, setIsGdrivePushing] = useState(false); 
  const [gdriveProgress, setGdriveProgress] = useState(0);

  const [isCleaningUp, setIsCleaningUp] = useState(false); // ✅ [New]
  const [cleanupProgress, setCleanupProgress] = useState(0); // ✅ [New]

  // ✅ State สำหรับการจับคู่ Focus Mirroring (เก็บ timestamp และ type)
  const [hoveredMirror, setHoveredMirror] = useState({ timestamp: null, type: null });

  const [form] = Form.useForm(); 
  const [githubForm] = Form.useForm(); 
  const [gdriveForm] = Form.useForm(); 
  const [cleanupForm] = Form.useForm(); // ✅ [New]

  // 📊 [New] Storage Analytics Chart Component
  const StorageAnalyticsChart = ({ data }) => {
    if (!data || data.length === 0) return <Empty description="ไม่พบข้อมูลสถิติพื้นที่ย้อนหลัง" style={{ padding: '40px 0' }} />;
    const isDark = document.body.classList.contains('dark-mode');
    
    const formattedData = data.map(item => ({
      date: dayjs(item.snapshot_date).format('DD/MM'),
      'ฐานข้อมูล': parseFloat((item.db_used / (1024 * 1024)).toFixed(2)),
      'ซอร์สโค้ด': parseFloat((item.source_used / (1024 * 1024)).toFixed(2)),
      'GitHub': parseFloat((item.github_used / (1024 * 1024)).toFixed(2)),
      'Google Drive': parseFloat((item.gdrive_used / (1024 * 1024)).toFixed(2))
    }));

    return (
      <div style={{ width: '100%', height: 350, padding: '20px 0 0' }}>
        <ResponsiveContainer>
          <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient>
              <linearGradient id="colorSrc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
              <linearGradient id="colorGit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#111827" stopOpacity={0.8}/><stop offset="95%" stopColor="#111827" stopOpacity={0}/></linearGradient>
              <linearGradient id="colorGdrive" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e2e8f0'} />
            <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} unit="MB" />
            <ChartTooltip 
              contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: 'var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Area type="monotone" dataKey="ฐานข้อมูล" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorDb)" stackId="1" />
            <Area type="monotone" dataKey="ซอร์สโค้ด" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSrc)" stackId="1" />
            <Area type="monotone" dataKey="GitHub" stroke="#111827" fillOpacity={1} fill="url(#colorGit)" stackId="1" />
            <Area type="monotone" dataKey="Google Drive" stroke="#10b981" fillOpacity={1} fill="url(#colorGdrive)" stackId="1" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // --- 2. Data Fetching ---
  const verifyGDriveFilesOnCloud = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/backup/gdrive/verify-files');
      setGdriveFileStatus(res.data);
    } catch (err) { console.error("Verify Cloud Status Error:", err); }
  }, []);

  const fetchCleanupPreview = useCallback(async () => {
    setIsPreviewLoading(true);
    try {
      const res = await axiosInstance.get('/cleanup/preview');
      setCleanupPreview(res.data);
    } catch (err) {
      console.error("Fetch Cleanup Preview Error:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

  const fetchCleanupDetails = async (type) => {
    setDetailType(type);
    setDetailModalVisible(true);
    setIsDetailLoading(true);
    try {
      const res = await axiosInstance.get(`/cleanup/preview/details?type=${type}`);
      setDetailData(res.data || []);
    } catch (err) {
      console.error("Fetch Details Error:", err);
      alertError('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลรายละเอียดได้');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const fetchTaskHistory = useCallback(async (start, end) => {
    try {
      const res = await axiosInstance.get(`/backup/task-history?start=${start}&end=${end}`);
      setTaskHistory(res.data || []);
    } catch (err) { console.error("Fetch Task History Error:", err); }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSourceLoading(true);
    setGdriveLoading(true);
    setCleanupLoading(true);
    try {
      // ✅ ดึงข้อมูลช่วงวันที่สำหรับปฏิทิน (ย้อนหลัง 30 วัน ล่วงหน้า 15 วัน เพื่อให้สอดคล้องกับ Backend)
      // และครอบคลุมทั้งเดือนปัจจุบันเพื่อป้องกันการกระพริบเมื่อสลับ Tab
      const start = calendarValue.startOf('month').subtract(7, 'day').locale('en').format('YYYY-MM-DD');
      const end = calendarValue.endOf('month').add(15, 'day').locale('en').format('YYYY-MM-DD');

      const [logRes, settingRes, srcLogRes, srcSettingRes, githubLogRes, githubSettingRes, gdriveLogRes, gdriveSettingRes, cleanupSettingRes, statsRes, historyRes] = await Promise.all([
        axiosInstance.get('/backup/logs'),
        axiosInstance.get('/backup/settings'),
        axiosInstance.get('/backup/source/logs'),
        axiosInstance.get('/backup/source/settings'),
        axiosInstance.get('/backup/github/logs'),
        axiosInstance.get('/backup/github/settings'),
        axiosInstance.get('/backup/gdrive/logs'),
        axiosInstance.get('/backup/gdrive/settings'),
        axiosInstance.get('/cleanup/settings'),
        axiosInstance.get('/backup/storage-stats').catch(() => ({ data: null })),
        axiosInstance.get('/backup/storage-history').catch(() => ({ data: [] }))
      ]);

      await fetchTaskHistory(start, end); // ✅ [Fixed] เรียกใช้ประวัติแผนงานจริงจาก DB
      
      setLogs(logRes.data || []);
      setSourceLogs(srcLogRes.data || []);
      setGithubLogs(githubLogRes.data || []);
      setGdriveLogs(gdriveLogRes.data || []);
      setStorageStats(statsRes?.data || null);
      setStorageHistory(historyRes?.data || []);
      
      setDbSetting(settingRes.data);
      setSourceSettings(srcSettingRes.data || []);
      setGithubSetting(githubSettingRes.data);
      setGdriveSetting(gdriveSettingRes.data);
      setCleanupSetting(cleanupSettingRes.data);

      if (gdriveLogRes.data && gdriveLogRes.data.length > 0) {
        verifyGDriveFilesOnCloud();
      }

      // ✅ Fetch Preview เมื่อโหลดข้อมูล
      fetchCleanupPreview();
      
      // ✅ ใช้ setTimeout เพื่อป้องกัน Warning: useForm instance not connected
      setTimeout(() => {
        if (settingRes.data) {
          form.setFieldsValue({
            schedule_type: settingRes.data.schedule_type,
            schedule_days: settingRes.data.schedule_type === 'weekly' ? settingRes.data.schedule_days?.split(',') : settingRes.data.schedule_days,
            schedule_time: settingRes.data.schedule_time ? dayjs(settingRes.data.schedule_time, 'HH:mm:ss') : dayjs('02:00:00', 'HH:mm:ss'),
            is_active: settingRes.data.is_active === 1
          });
        }

        if (githubSettingRes.data) {
          githubForm.setFieldsValue({
            github_token: githubSettingRes.data.github_token,
            repo_url: githubSettingRes.data.repo_url,
            branch_name: githubSettingRes.data.branch_name || 'main',
            sync_targets: githubSettingRes.data.sync_targets ? githubSettingRes.data.sync_targets.split(',') : ['database', 'source'],
            schedule_type: githubSettingRes.data.schedule_type || 'daily',
            schedule_days: githubSettingRes.data.schedule_type === 'weekly' ? (githubSettingRes.data.schedule_days ? githubSettingRes.data.schedule_days.split(',') : []) : githubSettingRes.data.schedule_days,
            schedule_time: githubSettingRes.data.schedule_time ? dayjs(githubSettingRes.data.schedule_time, 'HH:mm:ss') : dayjs('05:00:00', 'HH:mm:ss'),
            is_active: githubSettingRes.data.is_active === 1
          });
        }

        if (gdriveSettingRes.data) {
          gdriveForm.setFieldsValue({
            client_id: gdriveSettingRes.data.client_id,
            client_secret: gdriveSettingRes.data.client_secret,
            refresh_token: gdriveSettingRes.data.refresh_token,
            folder_id: gdriveSettingRes.data.folder_id,
            sync_targets: gdriveSettingRes.data.sync_targets ? gdriveSettingRes.data.sync_targets.split(',') : ['database', 'source'],
            schedule_type: gdriveSettingRes.data.schedule_type || 'daily',
            schedule_days: gdriveSettingRes.data.schedule_type === 'weekly' ? (gdriveSettingRes.data.schedule_days ? gdriveSettingRes.data.schedule_days.split(',') : []) : gdriveSettingRes.data.schedule_days,
            schedule_time: gdriveSettingRes.data.schedule_time ? dayjs(gdriveSettingRes.data.schedule_time, 'HH:mm:ss') : dayjs('06:00:00', 'HH:mm:ss'),
            is_active: gdriveSettingRes.data.is_active === 1
          });
        }

        if (cleanupSettingRes.data) {
          cleanupForm.setFieldsValue({
            db_retention_days: cleanupSettingRes.data.db_retention_days,
            source_retention_days: cleanupSettingRes.data.source_retention_days,
            system_log_retention_days: cleanupSettingRes.data.system_log_retention_days,
            ticket_log_retention_days: cleanupSettingRes.data.ticket_log_retention_days,
            schedule_type: cleanupSettingRes.data.schedule_type,
            schedule_days: cleanupSettingRes.data.schedule_type === 'weekly' ? cleanupSettingRes.data.schedule_days?.split(',') : cleanupSettingRes.data.schedule_days,
            schedule_time: cleanupSettingRes.data.schedule_time ? dayjs(cleanupSettingRes.data.schedule_time, 'HH:mm:ss') : dayjs('03:00:00', 'HH:mm:ss'),
            is_active: cleanupSettingRes.data.is_active === 1
          });
        }
      }, 50);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSourceLoading(false);
      setGdriveLoading(false);
      setCleanupLoading(false);
    }
  }, [form, githubForm, gdriveForm, cleanupForm, verifyGDriveFilesOnCloud, fetchCleanupPreview, fetchTaskHistory]);

  // --- 3. Effects ---
  useEffect(() => { fetchData(); }, [fetchData]);

  // ✅ [New] ดึงประวัติแผนงานใหม่เมื่อมีการเปลี่ยนเดือนในปฏิทิน
  useEffect(() => {
    const start = calendarValue.clone().startOf('month').subtract(7, 'day').locale('en').format('YYYY-MM-DD');
    const end = calendarValue.clone().endOf('month').add(7, 'day').locale('en').format('YYYY-MM-DD');
    fetchTaskHistory(start, end);
  }, [calendarValue, fetchTaskHistory]);

  // ✅จัดการตำแหน่ง Scroll (Scroll Persistence) แบบ Real-time
  useEffect(() => {
    if (loading === false && sourceLoading === false) {
      const savedScrollPos = sessionStorage.getItem('backupScrollPos');
      if (savedScrollPos) {
        const timer = setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScrollPos), behavior: 'instant' });
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, sourceLoading]);

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        sessionStorage.setItem('backupScrollPos', window.scrollY.toString());
      }, 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const [activeProfileId, setActiveProfileId] = useState('1');

  // --- 4. Logic & Handlers ---
  const handleTabChange = (key) => {
    setActiveTab(key);
    localStorage.setItem('backupActiveTab', key);
  };

  const handleAddProfile = async () => {
    try {
      const res = await axiosInstance.post('/backup/source/profiles');
      alertSuccess('สำเร็จ', 'เพิ่มโปรไฟล์สำรองข้อมูลใหม่แล้ว');
      fetchData();
      setActiveProfileId(res.data.id.toString());
    } catch (e) { alertError('ผิดพลาด', 'ไม่สามารถเพิ่มโปรไฟล์ได้'); }
  };

  const handleDeleteProfile = async (id) => {
    const result = await alertConfirm('ยืนยันการลบ?', 'การลบโปรไฟล์นี้จะทำให้ตารางเวลาที่ตั้งไว้ถูกยกเลิกด้วย ยืนยันหรือไม่?');
    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/backup/source/profiles/${id}`);
        alertSuccess('ลบสำเร็จ');
        fetchData();
        setActiveProfileId('1');
      } catch (e) { alertError('ผิดพลาด', 'ไม่สามารถลบโปรไฟล์ได้'); }
    }
  };

  const handleSaveDynamicSourceSettings = async (id, values) => {
    try {
      let days = '';
      if (values.schedule_type === 'weekly') days = values.schedule_days ? values.schedule_days.join(',') : '';
      else if (values.schedule_type === 'monthly') days = values.schedule_days || '1';

      const payload = {
        id,
        profile_name: values.profile_name,
        target_folders: values.target_folders ? values.target_folders.join(',') : '',
        ignore_extensions: values.ignore_extensions ? values.ignore_extensions.join(',') : '',
        ignored_folders: values.ignored_folders ? values.ignored_folders.join(',') : '',
        schedule_type: values.schedule_type,
        schedule_days: days,
        schedule_time: values.schedule_time ? values.schedule_time.format('HH:mm:ss') : '04:00:00',
        is_active: values.is_active ? 1 : 0
      };
      await axiosInstance.put('/backup/source/settings', payload);
      alertSuccess('บันทึกสำเร็จ', `อัปเดต ${values.profile_name} เรียบร้อยแล้ว`);
      fetchData(); 
    } catch (error) {
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
    }
  };

  // Profile Form Component (Internal Helper)
  const ProfileForm = ({ profile }) => {
    const [pForm] = Form.useForm();
    
    useEffect(() => {
        pForm.setFieldsValue({
            profile_name: profile.profile_name,
            target_folders: profile.target_folders ? profile.target_folders.split(',') : [],
            ignore_extensions: profile.ignore_extensions ? profile.ignore_extensions.split(',').filter(Boolean) : [],
            ignored_folders: profile.ignored_folders ? profile.ignored_folders.split(',').filter(Boolean) : [],
            schedule_type: profile.schedule_type,
            schedule_days: profile.schedule_type === 'weekly' ? profile.schedule_days?.split(',') : profile.schedule_days,
            schedule_time: profile.schedule_time ? dayjs(profile.schedule_time, 'HH:mm:ss') : dayjs('04:00:00', 'HH:mm:ss'),
            is_active: profile.is_active === 1
        });
    }, [profile, pForm]);

    return (
        <Form 
          form={pForm} 
          layout="vertical" 
          onFinish={(v) => handleSaveDynamicSourceSettings(profile.id, v)}
          onValuesChange={(changedValues, allValues) => {
            // 🔄 จัดการความสัมพันธ์ระหว่างสำรองข้อมูลแบบ Full กับรายการละเว้น
            if (changedValues.target_folders) {
              const isFullBackup = changedValues.target_folders.includes('node_modules');
              if (isFullBackup) {
                pForm.setFieldsValue({ ignored_folders: [], ignore_extensions: [] });
              } else {
                const currentIgnored = pForm.getFieldValue('ignored_folders') || [];
                const currentExts = pForm.getFieldValue('ignore_extensions') || [];
                if (currentIgnored.length === 0 && currentExts.length === 0) {
                  pForm.setFieldsValue({
                    ignored_folders: ['.git', 'node_modules', 'dist', 'build', 'backups'],
                    ignore_extensions: ['.sql', '.mp4', '.zip', '.rar', '.log']
                  });
                }
              }
            }
            // 🔄 ถ้าผู้ใช้ไปยุ่งกับรายการละเว้น -> ต้องเอาเครื่องหมาย Full Backup ออก
            if (changedValues.ignored_folders || changedValues.ignore_extensions) {
              const hasExclusions = (allValues.ignored_folders && allValues.ignored_folders.length > 0) || 
                                  (allValues.ignore_extensions && allValues.ignore_extensions.length > 0);
              if (hasExclusions) {
                const currentTargets = allValues.target_folders || [];
                const filtered = currentTargets.filter(t => t !== 'node_modules');
                pForm.setFieldsValue({ target_folders: filtered });
              }
            }
          }}
        >
          <Row gutter={16} align="middle">
            <Col xs={24} sm={16}>
              <Form.Item name="profile_name" label={<Text strong style={{ color: 'var(--text-main)' }}>ชื่อโปรไฟล์สำรองข้อมูล</Text>} rules={[{ required: true, message: 'กรุณาระบุชื่อโปรไฟล์' }]}>
                <Input size="large" prefix={<EditOutlined style={{ color: '#8b5cf6' }} />} placeholder="เช่น สำรองรายวัน (Source), Weekly Full..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              {profile.id != 1 && (
                <Popconfirm title="ยืนยันการลบ?" description="การลบโปรไฟล์จะทำให้ตารางเวลาที่ตั้งไว้ถูกยกเลิก" onConfirm={() => handleDeleteProfile(profile.id)}>
                    <Button danger icon={<DeleteOutlined />} type="text">ลบโปรไฟล์นี้</Button>
                </Popconfirm>
              )}
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0', borderColor: 'var(--border-color)' }} />

          <Form.Item name="target_folders" label={<Text strong style={{ color: 'var(--text-main)' }}>เลือกส่วนที่ต้องการบีบอัด (.zip)</Text>}>
            <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Checkbox value="frontend"><Text strong style={{ color: 'var(--text-main)' }}>1. Frontend (React)</Text></Checkbox>
              <Checkbox value="backend"><Text strong style={{ color: 'var(--text-main)' }}>2. Backend (Node.js/Express)</Text></Checkbox>
              <Checkbox value="node_modules"><Text type="danger" strong>3. สำรองข้อมูลแบบ Full (Backup ทุกอย่างใน Project ไม่ละเว้น)</Text></Checkbox>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, current) => prev.target_folders !== current.target_folders}>
            {({ getFieldValue }) => {
              const isFull = getFieldValue('target_folders')?.includes('node_modules');
              if (isFull) return null;
              return (
                <>
                  <Divider style={{ margin: '12px 0', borderColor: 'var(--border-color)', borderStyle: 'dashed' }} />
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item 
                        name="ignore_extensions" 
                        label={<Text strong style={{ color: 'var(--text-main)' }}>ละเว้นไฟล์</Text>}
                        extra={<Text type="secondary" style={{ fontSize: '11px' }}>รายการแนะนำ: .sql, .mp4, .zip, .log - จะถูกข้ามเมื่อเลือกแบบ Full Backup</Text>}
                      >
                        <Select
                          mode="tags"
                          style={{ width: '100%' }}
                          placeholder="เพิ่มนามสกุลไฟล์..."
                          tokenSeparators={[',', ' ']}
                          options={[
                            { value: '.sql', label: '.sql' }, { value: '.mp4', label: '.mp4' },
                            { value: '.zip', label: '.zip' }, { value: '.rar', label: '.rar' },
                            { value: '.log', label: '.log' }, { value: '.tmp', label: '.tmp' }
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item 
                        name="ignored_folders" 
                        label={<Text strong style={{ color: 'var(--text-main)' }}>ละเว้นโฟลเดอร์</Text>}
                        extra={<Text type="secondary" style={{ fontSize: '11px' }}>รายการแนะนำ: .git, node_modules, dist - จะถูกข้ามเมื่อเลือกแบบ Full Backup</Text>}
                      >
                        <Select
                          mode="tags"
                          style={{ width: '100%' }}
                          placeholder="เพิ่มชื่อโฟลเดอร์..."
                          tokenSeparators={[',', ' ']}
                          options={[
                            { value: '.git', label: '.git' }, { value: 'node_modules', label: 'node_modules' },
                            { value: 'dist', label: 'dist' }, { value: 'build', label: 'build' },
                            { value: 'backups', label: 'backups' }, { value: 'uploads', label: 'uploads' }
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              );
            }}
          </Form.Item>

          <Divider style={{ margin: '12px 0', borderColor: 'var(--border-color)' }} />

          <Form.Item name="is_active" id="src_profile_is_active" valuePropName="checked" style={{ backgroundColor: 'var(--bg-app)', padding: '10px 15px', borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <Checkbox><Text strong style={{ color: '#8b5cf6' }}>เปิดใช้งาน Auto Backup สำหรับโปรไฟล์นี้</Text></Checkbox>
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="schedule_type" label={<Text strong style={{ color: 'var(--text-main)' }}>รูปแบบรอบการทำงาน</Text>}>
                <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                  <Radio.Button value="daily" style={{ width: '33.33%', textAlign: 'center' }}>วัน</Radio.Button>
                  <Radio.Button value="weekly" style={{ width: '33.34%', textAlign: 'center' }}>สัปดาห์</Radio.Button>
                  <Radio.Button value="monthly" style={{ width: '33.33%', textAlign: 'center' }}>เดือน</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="schedule_time" label={<Text strong style={{ color: 'var(--text-main)' }}>เวลาที่ระบบประมวลผล</Text>} rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item noStyle shouldUpdate={(prev, current) => prev.schedule_type !== current.schedule_type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('schedule_type');
              if (type === 'weekly') return <Form.Item name="schedule_days" label={<Text strong style={{ color: 'var(--text-main)' }}>เลือกวันในสัปดาห์</Text>}><Checkbox.Group options={weekOptions} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} /></Form.Item>;
              if (type === 'monthly') return <Form.Item name="schedule_days" label={<Text strong style={{ color: 'var(--text-main)' }}>เลือกวันที่ของเดือน</Text>}><Select options={monthOptions} size="large" /></Form.Item>;
              return null;
            }}
          </Form.Item>

          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block size="large" style={{ backgroundColor: '#8b5cf6', height: '45px', borderRadius: '8px', marginTop: '10px' }}>บันทึกการตั้งค่า {profile.profile_name}</Button>
        </Form>
    );
  };

  // ✅ [New] Bulk Delete Handlers
  const handleBulkDeleteDb = async () => {
    const result = await alertConfirm('ยืนยันลบหลายรายการ?', `คุณกำลังจะลบไฟล์สำรองฐานข้อมูลจำนวน ${selectedDbKeys.length} รายการ ยืนยันหรือไม่?`);
    if (result.isConfirmed) {
      try {
        setLoading(true);
        await axiosInstance.post('/backup/bulk-delete', { file_names: selectedDbKeys });
        alertSuccess('ลบสำเร็จ', `ลบข้อมูล ${selectedDbKeys.length} รายการเรียบร้อยแล้ว`);
        setSelectedDbKeys([]); // ✅ ล้างสถานะการเลือกทันทีหลังลบสำเร็จ
        fetchData();
      } catch (e) { alertError('ผิดพลาด', 'ไม่สามารถลบข้อมูลแบบกลุ่มได้'); } finally { setLoading(false); }
    }
  };

  const handleBulkDeleteSource = async () => {
    const result = await alertConfirm('ยืนยันลบหลายรายการ?', `คุณกำลังจะลบไฟล์สำรอง Source Code จำนวน ${selectedSrcKeys.length} รายการ ยืนยันหรือไม่?`);
    if (result.isConfirmed) {
      try {
        setSourceLoading(true);
        await axiosInstance.post('/backup/source/bulk-delete', { file_names: selectedSrcKeys });
        alertSuccess('ลบสำเร็จ', `ลบข้อมูล ${selectedSrcKeys.length} รายการเรียบร้อยแล้ว`);
        setSelectedSrcKeys([]); // ✅ ล้างสถานะการเลือกทันทีหลังลบสำเร็จ
        fetchData();
      } catch (e) { alertError('ผิดพลาด', 'ไม่สามารถลบข้อมูลแบบกลุ่มได้'); } finally { setSourceLoading(false); }
    }
  };

  const handleBulkDeleteGithub = async () => {
    const result = await alertConfirm('ยืนยันลบประวัติ GitHub?', `คุณกำลังจะลบประวัติการ Sync จำนวน ${selectedGitKeys.length} รายการ ยืนยันหรือไม่?`);
    if (result.isConfirmed) {
      try {
        setGithubLoading(true);
        await axiosInstance.post('/backup/github/bulk-delete', { log_ids: selectedGitKeys });
        alertSuccess('ลบสำเร็จ', `ลบประวัติ ${selectedGitKeys.length} รายการเรียบร้อยแล้ว`);
        setSelectedGitKeys([]);
        fetchData();
      } catch (e) { alertError('ผิดพลาด', 'ไม่สามารถลบประวัติแบบกลุ่มได้'); } finally { setGithubLoading(false); }
    }
  };

  const handleBulkDeleteGdrive = async () => {
    const result = await alertConfirm('ยืนยันลบประวัติ GDrive?', `คุณกำลังจะลบประวัติการ Sync จำนวน ${selectedGdriveKeys.length} รายการ ยืนยันหรือไม่? (ลบเฉพาะประวัติในระบบ ไม่กระทบไฟล์บน Cloud)`);
    if (result.isConfirmed) {
      try {
        setGdriveLoading(true);
        await axiosInstance.post('/backup/gdrive/bulk-delete', { log_ids: selectedGdriveKeys });
        alertSuccess('ลบสำเร็จ', `ลบประวัติ ${selectedGdriveKeys.length} รายการเรียบร้อยแล้ว`);
        setSelectedGdriveKeys([]);
        fetchData();
      } catch (e) { alertError('ผิดพลาด', 'ไม่สามารถลบประวัติแบบกลุ่มได้'); } finally { setGdriveLoading(false); }
    }
  };




  const getListData = (value) => {
    const listData = [];
    const dateString = value.locale('en').format('YYYY-MM-DD'); // ✅ Force Gregorian
    
    // 1. ดึงแผนงานจากฐานข้อมูล (Snapshot ที่บันทึกไว้)
    const dailyTasks = taskHistory.filter(h => h.scheduled_date === dateString);
    const linkedLogIds = { db: new Set(), source: new Set(), github: new Set(), gdrive: new Set() };

    if (dailyTasks.length > 0) {
      dailyTasks.forEach(task => {
        let content = '';
        if (task.task_type === 'db') content = 'DB Backup';
        else if (task.task_type === 'source') content = 'Code Backup';
        else if (task.task_type === 'github') content = 'Git Push';
        else if (task.task_type === 'gdrive') content = 'GDrive Upload';

        // หา Log จริงเพื่อเอารายละเอียด (ถ้ามี)
        let logDetail = null;
        if (task.log_id) {
            linkedLogIds[task.task_type].add(task.log_id); 
            if (task.task_type === 'db') logDetail = logs.find(l => l.log_id === task.log_id);
            else if (task.task_type === 'source') logDetail = sourceLogs.find(l => l.log_id === task.log_id);
            else if (task.task_type === 'github') logDetail = githubLogs.find(l => l.log_id === task.log_id);
            else if (task.task_type === 'gdrive') logDetail = gdriveLogs.find(l => l.log_id === task.log_id);
        }

        listData.push({
          id: `task-${task.id}`, 
          type: task.task_type === 'source' ? 'src' : task.task_type,
          status: task.status, // success, error, pending, missed
          time: task.scheduled_time.substring(0, 5),
          content: content,
          detail: logDetail ? (logDetail.file_name || logDetail.remarks) : null,
          size: logDetail?.file_size,
          actual_time: task.completed_at ? dayjs(task.completed_at).format('HH:mm') : null
        });
      });
    }

    // 2. สำหรับกรณี Manual Backup หรือประวัติเก่าที่ไม่ได้อยู่ในแผน (Unlinked Logs)
    const filterUnlinked = (logList, type, contentLabel) => {
        logList.forEach(log => {
            const logDate = dayjs(log.created_at).locale('en').format('YYYY-MM-DD');
            if (logDate === dateString && !linkedLogIds[type].has(log.log_id)) {
                listData.push({
                    id: `log-${type}-${log.log_id}`,
                    type: type === 'source' ? 'src' : type,
                    status: (log.status?.toLowerCase().includes('success') || log.status?.includes('สำเร็จ')) ? 'success' : 'error',
                    time: dayjs(log.created_at).format('HH:mm'),
                    content: contentLabel,
                    detail: log.file_name || log.remarks,
                    size: log.file_size,
                    actual_time: dayjs(log.created_at).format('HH:mm')
                });
            }
        });
    };

    filterUnlinked(logs, 'db', 'DB Backup');
    filterUnlinked(sourceLogs, 'source', 'Code Backup');
    filterUnlinked(githubLogs, 'github', 'Git Push');
    filterUnlinked(gdriveLogs, 'gdrive', 'GDrive Upload');

    return listData.sort((a, b) => a.time.localeCompare(b.time));
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    const isDark = document.body.classList.contains('dark-mode');

    // ✅ Grouping Logic: รวมรายการประเภทเดียวกันในวันเดียวกัน
    const groupedData = listData.reduce((acc, item) => {
      const key = `${item.type}-${item.content}`;
      if (!acc[key]) {
        acc[key] = { ...item, count: 1, items: [item], displayTime: item.actual_time || item.time };
      } else {
        acc[key].count += 1;
        acc[key].items.push(item);
        // 🕒 เทียบเวลาเพื่อหาเวลาล่าสุด (Latest Time)
        const currentItemTime = item.actual_time || item.time;
        if (currentItemTime > acc[key].displayTime) acc[key].displayTime = currentItemTime;
        // 🚦 จัดลำดับความสำคัญของสถานะ (error > success > pending)
        if (item.status === 'error') acc[key].status = 'error';
        else if (item.status === 'success' && acc[key].status !== 'error') acc[key].status = 'success';
      }
      return acc;
    }, {});

    const displayItems = Object.values(groupedData);

    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {displayItems.map((item, index) => {
          let bgColor = isDark ? '#2d3238' : '#f8fafc', textColor = isDark ? '#ffffff' : '#475569', borderColor = isDark ? '#4b5563' : '#e2e8f0', icon = null;

          if (item.status === 'success') { bgColor = isDark ? 'rgba(64, 192, 87, 0.15)' : '#dcfce7'; textColor = isDark ? '#4ade80' : '#166534'; borderColor = isDark ? '#40c057' : '#bbf7d0'; } 
          else if (item.status === 'error') { bgColor = isDark ? 'rgba(250, 82, 82, 0.15)' : '#fee2e2'; textColor = isDark ? '#fca5a5' : '#991b1b'; borderColor = isDark ? '#fa5252' : '#fecaca'; } 
          else if (item.status === 'pending') { bgColor = isDark ? 'rgba(250, 176, 5, 0.15)' : '#fef9c3'; textColor = isDark ? '#fde047' : '#854d0e'; borderColor = isDark ? '#fab005' : '#fef08a'; }
          else if (item.status === 'missed') { bgColor = isDark ? 'rgba(239, 68, 68, 0.4)' : '#fee2e2'; textColor = isDark ? '#ff8787' : '#b91c1c'; borderColor = '#ef4444'; }

          if (item.type === 'db') icon = <DatabaseOutlined style={{ marginRight: 4 }}/>;
          if (item.type === 'src') icon = <FileZipOutlined style={{ marginRight: 4 }}/>;
          if (item.type === 'github') icon = <GithubOutlined style={{ marginRight: 4 }}/>;
          if (item.type === 'gdrive') icon = <GoogleOutlined style={{ marginRight: 4 }}/>;

          return (
            <li key={index} style={{ marginBottom: 6 }}>
              <Tooltip title={
                item.status === 'missed' ? `ผิดเงื่อนไข: ไม่พบการสำรองข้อมูลในวันที่กำหนด` : 
                item.status === 'pending' ? `รอดำเนินการ - เวลา ${item.time}` :
                `รวม ${item.count} รายการ - ล่าสุด ${item.displayTime}`
              }>
                <div 
                  onClick={() => {
                    setSelectedCalendarDate(value.format('DD/MM/YYYY'));
                    setCalendarModalData(item.items);
                    setIsCalendarModalVisible(true);
                  }}
                  style={{
                    fontSize: '11px', padding: '4px 6px', borderRadius: '6px',
                    backgroundColor: bgColor, color: textColor, border: `1px solid ${borderColor}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                    boxShadow: item.status === 'missed' ? '0 0 8px rgba(239, 68, 68, 0.3)' : '0 1px 2px rgba(0,0,0,0.02)', position: 'relative'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    {icon} {item.status === 'missed' ? <Text strong style={{ color: 'inherit', fontSize: '10px' }}>MISSED: {item.content}</Text> : item.content}
                    {item.count > 1 && (
                      <Badge 
                        count={item.count} 
                        size="small" 
                        style={{ backgroundColor: '#ff4d4f', marginLeft: '4px', fontSize: '9px', minWidth: '16px', height: '16px', lineHeight: '16px', boxShadow: 'none' }} 
                      />
                    )}
                  </span>
                  <span style={{ fontWeight: 'bold', fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>{item.displayTime}</span>
                </div>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    );
  };

  const cellRender = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  const customCalendarHeader = ({ value, type, onChange, onTypeChange }) => {
    const currentMonth = value.month();
    const currentYear = value.year();
    const isDark = document.body.classList.contains('dark-mode');
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    const yearOptions = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      yearOptions.push(<Option key={i} value={i}>{i}</Option>);
    }

    return (
      <div className="modern-calendar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ fontSize: '22px', color: '#6366f1' }} />
          <Text strong className="calendar-title" style={{ color: 'var(--text-main)' }}>ปฏิทินสำรองข้อมูล</Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isDark ? 'var(--bg-app)' : '#f8fafc', padding: '6px 16px', borderRadius: '30px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Button 
            shape="round" 
            size="small" 
            style={{ border: '1px solid var(--border-color)', boxShadow: 'none', fontWeight: '500', padding: '0 12px' }} 
            onClick={() => {
              const today = dayjs();
              onChange(today);
              setCalendarValue(today);
            }}
          >
            วันนี้
          </Button>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button type="text" size="small" icon={<LeftOutlined style={{color: 'var(--text-sub)'}}/>} onClick={() => { const newValue = value.clone().subtract(1, 'month'); onChange(newValue); setCalendarValue(newValue); }} />
            
            <Space size={0} style={{ margin: '0 4px' }}>
              <Select 
                value={currentMonth} 
                onChange={(newMonth) => { const newValue = value.clone().month(newMonth); onChange(newValue); setCalendarValue(newValue); }}
                variant="borderless"
                popupMatchSelectWidth={false}
                style={{ fontWeight: 'bold', color: 'var(--text-main)', minWidth: '95px' }}
              >
                {thaiMonths.map((m, i) => <Option key={i} value={i}>{m}</Option>)}
              </Select>
              <Select 
                value={currentYear} 
                onChange={(newYear) => { const newValue = value.clone().year(newYear); onChange(newValue); setCalendarValue(newValue); }}
                variant="borderless"
                popupMatchSelectWidth={false}
                style={{ fontWeight: 'bold', color: 'var(--text-main)' }}
              >
                {yearOptions}
              </Select>
            </Space>

            <Button type="text" size="small" icon={<RightOutlined style={{color: 'var(--text-sub)'}}/>} onClick={() => { const newValue = value.clone().add(1, 'month'); onChange(newValue); setCalendarValue(newValue); }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-sub)', marginRight: '4px' }}>สัญลักษณ์:</span>
          <div style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(64, 192, 87, 0.15)' : '#dcfce7', color: isDark ? '#4ade80' : '#166534', border: '1px solid var(--border-color)', fontWeight: '500' }}>สำเร็จ</div>
          <div style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(250, 82, 82, 0.15)' : '#fee2e2', color: isDark ? '#fca5a5' : '#991b1b', border: '1px solid var(--border-color)', fontWeight: '500' }}>ล้มเหลว</div>
          <div style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(250, 176, 5, 0.15)' : '#fef9c3', color: isDark ? '#fde047' : '#854d0e', border: '1px solid var(--border-color)', fontWeight: '500' }}>รอดำเนินการ</div>
        </div>
      </div>
    );
  };

  const handleSaveSourceSettings = async (values) => {
    try {
      let days = '';
      if (values.schedule_type === 'weekly') days = values.schedule_days ? values.schedule_days.join(',') : '';
      else if (values.schedule_type === 'monthly') days = values.schedule_days || '1';

      // ✅ ตรวจสอบอีกครั้งก่อนส่ง: ถ้าเป็น Full Backup ต้องไม่มีรายการละเว้น
      const isFullBackup = values.target_folders?.includes('node_modules');
      
      const payload = {
        target_folders: values.target_folders ? values.target_folders.join(',') : '',
        ignore_extensions: isFullBackup ? '' : (values.ignore_extensions ? values.ignore_extensions.join(',') : ''),
        ignored_folders: isFullBackup ? '' : (values.ignored_folders ? values.ignored_folders.join(',') : ''),
        schedule_type: values.schedule_type,
        schedule_days: days,
        schedule_time: values.schedule_time ? values.schedule_time.format('HH:mm:ss') : '04:00:00',
        is_active: values.is_active ? 1 : 0
      };
      await axiosInstance.put('/backup/source/settings', payload);
      alertSuccess('บันทึกสำเร็จ', 'อัปเดตการตั้งค่าสำรอง Source Code เรียบร้อยแล้ว');
      fetchData(); 
    } catch (error) {
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
    }
  };

  const handleManualSourceBackup = async () => {
    // ดึงค่าจากโปรไฟล์ที่เลือกอยู่ปัจจุบันใน Tab
    const currentProfile = sourceSettings.find(p => p.id.toString() === activeProfileId);
    if (!currentProfile) return alertError('ผิดพลาด', 'ไม่พบข้อมูลโปรไฟล์');
    
    const folders = currentProfile.target_folders ? currentProfile.target_folders.split(',') : [];
    if (folders.length === 0) return alertError('ผิดพลาด', 'โปรไฟล์นี้ยังไม่ได้เลือกโฟลเดอร์ที่จะสำรองข้อมูล');
    
    setIsZipping(true);
    setZipProgress(0);
    const progressInterval = setInterval(() => {
      setZipProgress(prev => prev >= 90 ? prev : prev + Math.floor(Math.random() * 10) + 1);
    }, 500);

    try {
      await axiosInstance.post('/backup/source/manual', { 
        target_folders: folders,
        ignore_extensions: currentProfile.ignore_extensions || '',
        ignored_folders: currentProfile.ignored_folders || '',
        profile_id: activeProfileId // ✅ ส่ง profile_id เพื่ออัปเดตปฏิทินให้ถูกต้อง
      });
      clearInterval(progressInterval);
      setZipProgress(100);
      setTimeout(() => {
        setIsZipping(false);
        msg.success({ content: `บีบอัดไฟล์ตามโปรไฟล์ "${currentProfile.profile_name}" สำเร็จ!`, key: 'zipping', duration: 3 });
        fetchData();
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setIsZipping(false);
      setZipProgress(0);
      msg.error({ content: 'เกิดข้อผิดพลาดในการบีบอัดไฟล์!', key: 'zipping', duration: 3 });
    }
  };

  const handleDeleteSource = async (fileName) => {
    try {
      setSourceLoading(true);
      await axiosInstance.delete(`/backup/source/${fileName}`);
      alertSuccess('ลบสำเร็จ', 'ลบไฟล์ Zip ออกจากระบบแล้ว');
      fetchData();
    } catch (error) { alertError('ผิดพลาด', 'ไม่สามารถลบไฟล์ได้'); } finally { setSourceLoading(false); }
  };

  const handleSaveSettings = async (values) => {
    try {
      let days = '';
      if (values.schedule_type === 'weekly') days = values.schedule_days ? values.schedule_days.join(',') : '';
      else if (values.schedule_type === 'monthly') days = values.schedule_days || '1';

      const payload = {
        schedule_type: values.schedule_type,
        schedule_days: days,
        schedule_time: values.schedule_time ? values.schedule_time.format('HH:mm:ss') : '02:00:00',
        is_active: values.is_active ? 1 : 0
      };
      await axiosInstance.put('/backup/settings', payload);
      alertSuccess('บันทึกสำเร็จ', 'อัปเดตเวลาสำรองข้อมูล Database แล้ว');
      fetchData();
    } catch (error) {
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
    }
  };

  const handleManualBackup = async () => {
    setIsDbBackingUp(true);
    setDbProgress(0);
    const progressInterval = setInterval(() => {
      setDbProgress(prev => prev >= 90 ? prev : prev + Math.floor(Math.random() * 10) + 1);
    }, 400);

    try {
      await axiosInstance.post('/backup/manual');
      clearInterval(progressInterval);
      setDbProgress(100);
      setTimeout(() => {
        setIsDbBackingUp(false);
        alertSuccess('แบ็คอัพสำเร็จ', 'สำรองข้อมูลฐานข้อมูลเรียบร้อยแล้ว');
        fetchData();
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setIsDbBackingUp(false);
      setDbProgress(0);
      alertError('ผิดพลาด', 'การสำรองข้อมูลล้มเหลว');
    }
  };

  const handleRestore = async (fileName) => {
    const result = await alertConfirm('อันตราย! ยืนยันการกู้คืน?', `ข้อมูลปัจจุบันทั้งหมดจะถูกเขียนทับด้วยไฟล์ ${fileName} คุณแน่ใจหรือไม่?`);
    if (result.isConfirmed) {
      try {
        setLoading(true);
        await axiosInstance.post('/backup/restore', { file_name: fileName });
        alertSuccess('กู้คืนสำเร็จ', 'กู้คืนฐานข้อมูลเรียบร้อยแล้ว ระบบพร้อมใช้งาน');
        fetchData();
      } catch (error) { alertError('ผิดพลาด', 'การกู้คืนข้อมูลล้มเหลว'); } finally { setLoading(false); }
    }
  };

  const handleDelete = async (fileName) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/backup/${fileName}`);
      alertSuccess('ลบสำเร็จ', 'ลบไฟล์สำรองข้อมูลออกจากระบบแล้ว');
      fetchData();
    } catch (error) { alertError('ผิดพลาด', 'ไม่สามารถลบไฟล์ได้'); } finally { setLoading(false); }
  };

  const handleSaveGithubSettings = async (values) => {
    try {
      let days = '';
      if (values.schedule_type === 'weekly') days = values.schedule_days ? values.schedule_days.join(',') : '';
      else if (values.schedule_type === 'monthly') days = values.schedule_days || '1';

      const payload = {
        github_token: values.github_token,
        repo_url: values.repo_url,
        branch_name: values.branch_name,
        sync_targets: values.sync_targets ? values.sync_targets.join(',') : '',
        schedule_type: values.schedule_type,
        schedule_days: days,
        schedule_time: values.schedule_time ? values.schedule_time.format('HH:mm:ss') : '05:00:00',
        is_active: values.is_active ? 1 : 0
      };
      
      await axiosInstance.put('/backup/github/settings', payload);
      alertSuccess('บันทึกสำเร็จ', 'อัปเดตการตั้งค่า GitHub เรียบร้อยแล้ว');
      fetchData();
    } catch (error) {
      console.error("Save Github Settings Error:", error);
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่า GitHub ได้');
    }
  };

  const handleManualGithubPush = async () => {
    const targets = githubForm.getFieldValue('sync_targets');
    if (!targets || targets.length === 0) return alertError('ผิดพลาด', 'กรุณาเลือกข้อมูลที่ต้องการ Push อย่างน้อย 1 รายการ');

    setIsGithubPushing(true);
    setGithubProgress(0);
    const progressInterval = setInterval(() => {
      setGithubProgress(prev => prev >= 90 ? prev : prev + Math.floor(Math.random() * 5) + 1);
    }, 400);

    try {
      const res = await axiosInstance.post('/backup/github/manual', { sync_targets: targets });
      clearInterval(progressInterval);
      setGithubProgress(100);
      setTimeout(() => {
        setIsGithubPushing(false);
        msg.success({ content: `สำเร็จ! ${res.data.message}`, key: 'githubPush', duration: 4 });
        fetchData();
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setIsGithubPushing(false);
      setGithubProgress(0);
      const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาดในการ Push ตรวจสอบ Token และ URL';
      msg.error({ content: errMsg, key: 'githubPush', duration: 5 });
      fetchData(); 
    }
  };

  const handleDeleteGithubLog = async (logId) => {
    try {
      setGithubLoading(true);
      await axiosInstance.delete(`/backup/github/logs/${logId}`);
      alertSuccess('ลบสำเร็จ', 'ลบประวัติการ Push เรียบร้อยแล้ว');
      fetchData();
    } catch (error) {
      alertError('ผิดพลาด', 'ไม่สามารถลบประวัติได้');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleSaveGdriveSettings = async (values) => {
    try {
      let days = '';
      if (values.schedule_type === 'weekly') days = values.schedule_days ? values.schedule_days.join(',') : '';
      else if (values.schedule_type === 'monthly') days = values.schedule_days || '1';

      const payload = {
        client_id: values.client_id,
        client_secret: values.client_secret,
        refresh_token: values.refresh_token,
        folder_id: values.folder_id,
        sync_targets: values.sync_targets ? values.sync_targets.join(',') : '',
        schedule_type: values.schedule_type,
        schedule_days: days,
        schedule_time: values.schedule_time ? values.schedule_time.format('HH:mm:ss') : '06:00:00',
        is_active: values.is_active ? 1 : 0
      };
      
      await axiosInstance.put('/backup/gdrive/settings', payload);
      alertSuccess('บันทึกสำเร็จ', 'อัปเดตการตั้งค่า Google Drive เรียบร้อยแล้ว');
      fetchData();
    } catch (error) {
      console.error("Save GDrive Settings Error:", error);
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่า Google Drive ได้');
    }
  };

  const handleManualGdrivePush = async () => {
    const targets = gdriveForm.getFieldValue('sync_targets');
    if (!targets || targets.length === 0) return alertError('ผิดพลาด', 'กรุณาเลือกข้อมูลที่ต้องการอัปโหลดอย่างน้อย 1 รายการ');

    setIsGdrivePushing(true);
    setGdriveProgress(0);
    const progressInterval = setInterval(() => {
      setGdriveProgress(prev => prev >= 90 ? prev : prev + Math.floor(Math.random() * 5) + 1);
    }, 400);

    try {
      const res = await axiosInstance.post('/backup/gdrive/manual', { sync_targets: targets });
      clearInterval(progressInterval);
      setGdriveProgress(100);
      setTimeout(() => {
        setIsGdrivePushing(false);
        msg.success({ content: `สำเร็จ! ${res.data.message}`, key: 'gdrivePush', duration: 4 });
        fetchData();
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setIsGdrivePushing(false);
      setGdriveProgress(0);
      const errMsg = error.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปโหลด ตรวจสอบ Credentials';
      msg.error({ content: errMsg, key: 'gdrivePush', duration: 5 });
      fetchData(); 
    }
  };

  const handleDeleteGdriveLog = async (logId) => {
    const result = await alertConfirm('ยืนยันการลบประวัติ?', 'คุณต้องการลบไฟล์จริงใน Google Drive ด้วยหรือไม่?', { 
      confirmButtonText: 'ลบทั้งคู่ (Cloud & DB)', 
      cancelButtonText: 'ลบเฉพาะประวัติ',
      showDenyButton: true, denyButtonText: 'ยกเลิก'
    });
    if (result.isConfirmed || (result.isDismissed === false && result.value === false)) {
      const deleteCloud = result.isConfirmed;
      if (result.isDenied) return;
      try {
        setGdriveLoading(true);
        await axiosInstance.delete(`/backup/gdrive/logs/${logId}?deleteFromCloud=${deleteCloud}`);
        fetchData(); alertSuccess('ลบสำเร็จ');
      } catch (e) { alertError('ล้มล้ว'); } finally { setGdriveLoading(false); }
    }
  };

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
      alertSuccess('บันทึกสำเร็จ', 'อัปเดตการตั้งค่า Auto Cleanup เรียบร้อยแล้ว');
      fetchData();
    } catch (error) {
      alertError('ผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่า Cleanup ได้');
    }
  };

  const handleManualCleanup = async () => {
    const result = await alertConfirm('ยืนยันการล้างข้อมูล?', 'ระบบจะลบไฟล์สำรองและ Log ที่เก่ากว่ากำหนดทันที ยืนยันหรือไม่?');
    if (!result.isConfirmed) return;

    setIsCleaningUp(true);
    setCleanupProgress(0);
    const progressInterval = setInterval(() => {
      setCleanupProgress(prev => prev >= 95 ? prev : prev + Math.floor(Math.random() * 5) + 2);
    }, 300);

    try {
      const res = await axiosInstance.post('/cleanup/manual');
      clearInterval(progressInterval);
      setCleanupProgress(100);
      setTimeout(() => {
        setIsCleaningUp(false);
        const report = res.data.report || {};
        const total = (report.dbDeleted || 0) + (report.sourceDeleted || 0) + (report.sysLogsDeleted || 0) + (report.ticketLogsDeleted || 0);
        alertSuccess('ล้างข้อมูลสำเร็จ', `ลบไฟล์ DB: ${report.dbDeleted}, Code: ${report.sourceDeleted}, Logs: ${report.sysLogsDeleted + report.ticketLogsDeleted} รายการ (รวม ${total})`);
        fetchData();
      }, 600);
    } catch (error) {
      clearInterval(progressInterval);
      setIsCleaningUp(false);
      setCleanupProgress(0);
      alertError('ผิดพลาด', 'การล้างข้อมูลล้มเหลว');
    }
  };

  const sourceColumns = [
    { title: 'ชื่อไฟล์', dataIndex: 'file_name', key: 'file_name', align: 'center', render: (text) => <Text strong style={{ color: '#8b5cf6' }}><FileZipOutlined /> {text}</Text> },
    { title: 'เป้าหมาย', dataIndex: 'target_folders', key: 'target_folders', align: 'center', render: folders => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
           {folders === 'Full' ? (
             <Text strong style={{ color: '#10b981', fontSize: '12px' }}>- ทั้งหมด (ไม่รวม DB)</Text>
           ) : (
             <>
               {folders?.includes('frontend') && <Text type="secondary" style={{fontSize: '12px'}}>- Frontend</Text>}
               {folders?.includes('backend') && <Text type="secondary" style={{fontSize: '12px'}}>- Backend</Text>}
               {folders?.includes('node_modules') && <Text type="danger" style={{fontSize: '12px'}}>- node_modules</Text>}
             </>
           )}
        </div>
      )
    },
    { title: 'ขนาดไฟล์', dataIndex: 'file_size', key: 'file_size', align: 'center' },
    { title: 'วันที่ทำรายการ', dataIndex: 'created_at', key: 'created_at', align: 'center', render: date => dayjs(date).format('DD/MM/YYYY HH:mm:ss') },
    { title: 'สถานะ', dataIndex: 'status', key: 'status', align: 'center', render: status => status.includes('Success') ? <Tag color="success" icon={<CheckCircleOutlined />}>สำเร็จ</Tag> : <Tag color="error" icon={<CloseCircleOutlined />}>ล้มเหลว</Tag> },
    { title: 'จัดการ', key: 'action', align: 'center', fixed: 'right', width: 100, render: (_, record) => (
        <Space>
          <Button size="small" type="dashed" icon={<DownloadOutlined />} href={`${BACKEND_URL}/backups/source/${record.file_name}`} target="_blank">โหลด</Button>
          <Popconfirm title="ยืนยันการลบ?" onConfirm={() => handleDeleteSource(record.file_name)}><Button size="small" type="primary" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }
  ];

  const columns = [
    { title: 'ชื่อไฟล์', dataIndex: 'file_name', key: 'file_name', align: 'center', render: (text) => <Text strong style={{ color: '#0ea5e9' }}><DatabaseOutlined /> {text}</Text> },
    { title: 'ขนาดไฟล์', dataIndex: 'file_size', key: 'file_size', align: 'center' },
    { title: 'วันที่ทำรายการ', dataIndex: 'created_at', key: 'created_at', align: 'center', render: date => dayjs(date).format('DD/MM/YYYY HH:mm:ss') },
    { title: 'สถานะ', dataIndex: 'status', key: 'status', align: 'center', render: status => status.includes('Success') ? <Tag color="success" icon={<CheckCircleOutlined />}>สำเร็จ</Tag> : <Tag color="error" icon={<CloseCircleOutlined />}>ล้มเหลว</Tag> },
    { title: 'จัดการ', key: 'action', align: 'center', fixed: 'right', width: 120, render: (_, record) => (
        <Space>
          <Button size="small" type="dashed" icon={<DownloadOutlined />} href={`${BACKEND_URL}/backups/database/${record.file_name}`} target="_blank">โหลด</Button>
          <Button size="small" type="primary" style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }} icon={<RollbackOutlined />} onClick={() => handleRestore(record.file_name)} disabled={!record.status.includes('Success')}>กู้คืน</Button>
          <Popconfirm title="ยืนยันการลบ?" onConfirm={() => handleDelete(record.file_name)}><Button size="small" type="primary" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }
  ];
  
  const githubColumns = [
    { title: 'เป้าหมายที่ Sync', dataIndex: 'sync_targets', key: 'sync_targets', align: 'center', render: folders => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
           {folders?.includes('database') && <Text type="secondary" style={{fontSize: '12px'}}><DatabaseOutlined/> ล่าสุด (.sql)</Text>}
           {folders?.includes('source') && <Text type="secondary" style={{fontSize: '12px'}}><FileZipOutlined/> ล่าสุด (.zip)</Text>}
        </div>
      )
    },
    { title: 'สถานะ', dataIndex: 'status', key: 'status', align: 'center', render: status => (status.includes('สำเร็จ') || status.includes('Success')) ? <Tag color="success" icon={<CheckCircleOutlined />}>สำเร็จ</Tag> : <Tag color="error" icon={<CloseCircleOutlined />}>ล้มเหลว</Tag> },
    { title: 'ผู้ทำรายการ', dataIndex: 'created_by', key: 'created_by', align: 'center', render: text => <Tag color="default"><GithubOutlined /> {text}</Tag> },
    { title: 'วันที่ทำรายการ', dataIndex: 'created_at', key: 'created_at', align: 'center', render: date => dayjs(date).format('DD/MM/YYYY HH:mm:ss') },
    { title: 'หมายเหตุ', dataIndex: 'remarks', key: 'remarks', align: 'center', render: text => <Text type="secondary" style={{ fontSize: '12px' }}>{text || '-'}</Text> },
    { title: 'จัดการ', key: 'action', align: 'center', fixed: 'right', width: 80, render: (_, record) => (
        <Space>
          <Popconfirm title="ยืนยันการลบประวัตินี้?" onConfirm={() => handleDeleteGithubLog(record.log_id)}><Button size="small" type="primary" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }
  ];

  const gdriveColumns = [
    { 
      title: 'สถานะอัปโหลด', 
      key: 'cloud_status', 
      align: 'center', 
      width: 130,
      render: (_, record) => {
        const statuses = gdriveFileStatus[record.log_id];
        if (!statuses || statuses.length === 0) return <Tag color="default">ไม่มีข้อมูลไฟล์</Tag>;
        
        const allExist = statuses.every(f => f.exists && !f.trashed);
        const anyTrashed = statuses.some(f => f.trashed);
        const anyMissing = statuses.some(f => !f.exists);

        if (allExist) return <Tooltip title="ไฟล์ทั้งหมดอยู่บน Google Drive อย่างปลอดภัย"><Tag color="success" icon={<CheckCircleOutlined />}>ออนไลน์</Tag></Tooltip>;
        
        if (anyTrashed) {
          const trashedNames = statuses.filter(f => f.trashed).map(f => f.type === 'DB' ? 'ไฟล์ Database' : 'ไฟล์ Source Code').join(' และ ');
          return <Tooltip title={`${trashedNames} อยู่ในถังขยะ (กรุณาตรวจสอบในถังขยะ Google Drive)`}><Tag color="error" icon={<DeleteOutlined />}>อยู่ในถังขยะ</Tag></Tooltip>;
        }

        if (anyMissing) {
          const missingNames = statuses.filter(f => !f.exists).map(f => f.type === 'DB' ? 'ไฟล์ Database' : 'ไฟล์ Source Code').join(' และ ');
          return <Tooltip title={`${missingNames} หายไปจาก Cloud (กรุณาตรวจสอบใน Google Drive)`}><Tag color="warning" icon={<SyncOutlined spin />}>ไฟล์ไม่ครบ</Tag></Tooltip>;
        }

        return <Tag color="error" icon={<CloseCircleOutlined />}>ผิดพลาด</Tag>;
      }
    },
    { 
      title: 'เป้าหมายที่ Sync', 
      dataIndex: 'sync_targets', 
      key: 'sync_targets', 
      align: 'center', 
      render: (targets, record) => {
        const statuses = gdriveFileStatus[record.log_id] || [];
        const targetsArr = targets ? targets.split(',') : [];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
            {targetsArr.map(t => {
              const fileInfo = statuses.find(s => (t === 'database' ? s.type === 'DB' : s.type === 'Source'));
              const isOk = fileInfo && fileInfo.exists && !fileInfo.trashed;
              const label = t === 'database' ? 'Database' : 'Source Code';
              const icon = t === 'database' ? <DatabaseOutlined /> : <CodeOutlined />;
              
              // ✅ [New] Focus Mirroring Logic
              const type = t === 'database' ? 'DB' : 'Source';
              const isMirrored = hoveredMirror.timestamp && hoveredMirror.type === type && record.remarks?.includes(hoveredMirror.timestamp);

              return (
                <div 
                  key={t} 
                  className={isMirrored ? 'mirror-highlight' : ''}
                  style={{ 
                    fontSize: '11px', 
                    padding: '2px 10px', 
                    borderRadius: '12px',
                    backgroundColor: isOk ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: isOk ? '#16a34a' : '#dc2626',
                    border: `1px solid ${isOk ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: 'fit-content',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {icon} {label}
                </div>
              );
            })}
          </div>
        );
      }
    },
    { title: 'ผู้ทำรายการ', dataIndex: 'created_by', key: 'created_by', align: 'center', render: text => <Tag color="default"><GoogleOutlined /> {text}</Tag> },
    { title: 'วันที่ทำรายการ', dataIndex: 'created_at', key: 'created_at', align: 'center', render: date => dayjs(date).format('DD/MM/YYYY HH:mm:ss') },
    { 
      title: 'หมายเหตุ', 
      dataIndex: 'remarks', 
      key: 'remarks', 
      align: 'center', 
      render: (text) => {
        if (!text) return <Text type="secondary" style={{ fontSize: '12px' }}>-</Text>;
        const lines = text.split('|').map(l => l.trim());
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
            {lines.map((line, idx) => {
              const match = line.match(/(.*)\((.*)\)/);
              if (match) {
                const ts = match[2];
                const type = line.toLowerCase().includes('db') || line.toLowerCase().includes('database') ? 'DB' : 'Source';
                return (
                  <Tooltip title={ts} key={idx}>
                    <div 
                      style={{ whiteSpace: 'nowrap', cursor: 'help' }}
                      onMouseEnter={() => setHoveredMirror({ timestamp: ts, type })}
                      onMouseLeave={() => setHoveredMirror({ timestamp: null, type: null })}
                    >
                      <Text type="secondary" style={{ fontSize: '11px' }}>{match[1].trim()}</Text>
                    </div>
                  </Tooltip>
                );
              }
              return <div key={idx}><Text type="secondary" style={{ fontSize: '11px' }}>{line}</Text></div>;
            })}
          </div>
        );
      } 
    },
    { title: 'จัดการ', key: 'action', align: 'center', fixed: 'right', width: 100, render: (_, record) => (
        <Space>
          <Button size="small" type="primary" danger icon={<DeleteOutlined />} onClick={() => handleDeleteGdriveLog(record.log_id)}>ลบ</Button>
        </Space>
      )
    }
  ];

  const weekOptions = [
    { label: 'จ.', value: '1' }, { label: 'อ.', value: '2' }, { label: 'พ.', value: '3' },
    { label: 'พฤ.', value: '4' }, { label: 'ศ.', value: '5' }, { label: 'ส.', value: '6' }, { label: 'อา.', value: '0' }
  ];
  const monthOptions = Array.from({ length: 31 }, (_, i) => ({ label: `วันที่ ${i + 1}`, value: `${i + 1}` }));

  // --- 5. Render ---
  const isDark = document.body.classList.contains('dark-mode');

  return (
    <div style={{ padding: 'clamp(8px, 3vw, 20px)', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Title level={2} style={{ color: 'var(--text-main)', margin: 0, fontSize: 'clamp(18px, 4vw, 24px)' }}>
            <SafetyCertificateOutlined style={{ color: '#f97316', marginRight: '8px' }}/> <span className="hide-on-mobile">ระบบจัดการสำรองและล้างข้อมูล</span><span className="show-on-mobile">Backup & Cleanup</span>
          </Title>
        </div>
        <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading} className="mobile-full-width">รีเฟรชข้อมูล</Button>
      </div>

      <style>{`
        @media (max-width: 576px) {
          .mobile-full-width { width: 100%; }
          .hide-on-mobile { display: none; }
          .show-on-mobile { display: inline; }
          .backup-tabs .ant-tabs-tab { padding: 8px 12px !important; font-size: 14px !important; }
        }
        @media (min-width: 577px) {
          .show-on-mobile { display: none; }
        }

        .backup-tabs .ant-tabs-nav { background: var(--bg-card); border-radius: 12px; padding: 4px 8px; margin-bottom: 8px; border: 1px solid var(--border-color); }
        .backup-tabs .ant-tabs-tab { padding: 12px 24px; font-size: 16px; border-radius: 8px 8px 0 0 !important; }
        
        /* ✅ สี Tab ปกติ */
        .backup-tabs .ant-tabs-tab-active { background-color: #0ea5e9 !important; border-bottom: none !important; }
        .backup-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #ffffff !important; }

        /* ✅ สี Tab สำหรับ Calendar (เหลือง) */
        .backup-tabs .ant-tabs-tab-active[data-node-key="0"] { background-color: #f5e106 !important; }

        /* ✅ ปรับสีตัวอักษรสำหรับ Tab Calendar ให้เป็นสีดำเพื่อให้อ่านง่ายบนพื้นเหลือง */
        .backup-tabs .ant-tabs-tab-active[data-node-key="0"] .ant-tabs-tab-btn { color: #000000 !important; }

        /* ✅ สี Tab สำหรับ Source (ม่วง) */
        .backup-tabs .ant-tabs-tab-active[data-node-key="1"] { background-color: #8B5CF6 !important; }

        /* ✅ สี Tab สำหรับ Database (ฟ้า) */
        .backup-tabs .ant-tabs-tab-active[data-node-key="2"] { background-color: #0EA5E9 !important; }

        /* ✅ สี Tab สำหรับ GitHub (Deep Dark) */
        .backup-tabs .ant-tabs-tab-active[data-node-key="3"] { background-color: rgb(17, 24, 39) !important; }

        /* ✅ สี Tab สำหรับ GDrive (เขียว) */
        .backup-tabs .ant-tabs-tab-active[data-node-key="4"] { background-color: #10b981 !important; }

        /* ✅ สี Tab สำหรับ Cleanup (ส้ม) */
        .backup-tabs .ant-tabs-tab-active[data-node-key="5"] { background-color: #f97316 !important; }

        /* ✅ [New] Focus Mirroring CSS (AntD 6 High Specificity) */
        .mirror-highlight {
          transform: scale(1.1) translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          border: 1.5px solid #6366f1 !important;
          background-color: #6366f1 !important;
          color: white !important;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 5;
        }
        .gdrive-row-connected td {
          background-color: rgba(99, 102, 241, 0.08) !important;
          transition: all 0.2s ease;
        }
        .gdrive-row-connected td:first-child {
          border-left: 5px solid #6366f1 !important;
        }
        .gdrive-row-faded {
          opacity: 0.3;
          filter: grayscale(0.8) blur(0.2px);
          transition: all 0.3s ease;
        }
        .dark-mode .mirror-highlight {
          box-shadow: 0 4px 15px rgba(129, 140, 248, 0.7);
          background-color: #818cf8 !important;
          border-color: #818cf8 !important;
        }
        
        .modern-calendar-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background-color: var(--bg-card); border-bottom: 1px solid var(--border-color); flex-wrap: wrap; gap: 16px; border-radius: 12px 12px 0 0; }
        .calendar-title { font-size: 18px; margin: 0; }
        @media (max-width: 768px) { 
          .modern-calendar-header { flex-direction: column; align-items: stretch; padding: 12px; } 
          .calendar-title { font-size: 15px; } 
          .modern-calendar .ant-picker-cell-inner { min-height: 80px !important; }
        }
        
        .modern-calendar table thead tr th { font-size: 0 !important; text-align: center !important; padding-bottom: 12px; font-weight: 600; }
        .modern-calendar table thead tr th:nth-child(1)::after { content: 'อา.'; font-size: 14px; color: #ef4444; } 
        .modern-calendar table thead tr th:nth-child(2)::after { content: 'จ.'; font-size: 14px; color: #eab308; } 
        .modern-calendar table thead tr th:nth-child(3)::after { content: 'อ.'; font-size: 14px; color: #ec4899; } 
        .modern-calendar table thead tr th:nth-child(4)::after { content: 'พ.'; font-size: 14px; color: #10b981; } 
        .modern-calendar table thead tr th:nth-child(5)::after { content: 'พฤ.'; font-size: 14px; color: #f97316; } 
        .modern-calendar table thead tr th:nth-child(6)::after { content: 'ศ.'; font-size: 14px; color: #3b82f6; } 
        .modern-calendar table thead tr th:nth-child(7)::after { content: 'ส.'; font-size: 14px; color: #a855f7; } 
        
        @media (min-width: 992px) {
          .modern-calendar table thead tr th:nth-child(1)::after { content: 'อาทิตย์'; } 
          .modern-calendar table thead tr th:nth-child(2)::after { content: 'จันทร์'; } 
          .modern-calendar table thead tr th:nth-child(3)::after { content: 'อังคาร'; } 
          .modern-calendar table thead tr th:nth-child(4)::after { content: 'พุธ'; } 
          .modern-calendar table thead tr th:nth-child(5)::after { content: 'พฤหัส'; } 
          .modern-calendar table thead tr th:nth-child(6)::after { content: 'ศุกร์'; } 
          .modern-calendar table thead tr th:nth-child(7)::after { content: 'เสาร์'; } 
        }

        .modern-calendar-card .ant-card-body { padding: 0 !important; overflow: hidden; }
        .modern-calendar { background-color: var(--bg-app); background-image: radial-gradient(var(--border-color) 1px, transparent 0); background-size: 20px 20px; }
        .modern-calendar .ant-picker-calendar-header { padding: 0 !important; border-bottom: none !important; }
        
        .modern-calendar .ant-picker-cell-inner, .modern-calendar .ant-picker-calendar-date { 
          height: auto !important; min-height: 120px !important; max-height: none !important;
          background: var(--bg-card) !important; opacity: 0.9; margin: 4px !important; border-radius: 8px !important; 
          border: 1px solid var(--border-color) !important; transition: all 0.3s ease; overflow: visible !important;
        }
        .modern-calendar .ant-picker-cell:not(.ant-picker-cell-in-view) .ant-picker-cell-inner { background: var(--bg-app) !important; opacity: 0.5; }
        .modern-calendar .ant-picker-calendar-date-content { height: auto !important; overflow: visible !important; }
        .modern-calendar .ant-picker-cell-inner:hover { background: var(--bg-card) !important; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border-color: #ffffff !important; }
        .modern-calendar .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before { border: 2px solid #6366f1 !important; border-radius: 8px; }
        .modern-calendar .ant-picker-cell-selected .ant-picker-cell-inner { background-color: rgba(99, 102, 241, 0.2) !important; border: 1px solid #6366f1 !important; }
        body.dark-mode .ant-picker-calendar { background: transparent; }

        .modern-calendar .ant-picker-content tbody tr:not(:has(.ant-picker-cell-in-view)) {
          display: none;
        }

        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>

      <Tabs 
        type="card" 
        className="backup-tabs"
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: '0',
            label: <span><CalendarOutlined /> ปฏิทินงาน (Calendar)</span>,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Card className="modern-calendar-card" variant="borderless" style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)', marginTop: 0 }}>
                  <ConfigProvider locale={thTH}>
                    <Calendar className="modern-calendar" value={calendarValue} onChange={setCalendarValue} headerRender={customCalendarHeader} cellRender={cellRender} mode="month" />
                  </ConfigProvider>
                </Card>
              </div>
            )
          },
          {
            key: '1',
            label: <span><CodeOutlined /> สำรองข้อมูล (Source)</span>,
            forceRender: true,
            children: (
              <Row gutter={[24, 24]} style={{ marginTop: '0px' }} align="top">
                <Col xs={24} lg={10}>
                  <StorageStatusBar 
                    title="พื้นที่สำรองข้อมูล (Source)" 
                    stats={storageStats?.source} 
                    icon={<CodeOutlined />} 
                    color="#8b5cf6" 
                  />
                  
                  <Card 
                    title={<><SettingOutlined /> จัดการโปรไฟล์สำรอง Source Code</>} 
                    variant="borderless" 
                    style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }} 
                    styles={{ header: { backgroundColor: '#8B5CF6', color: '#ffffff', borderBottom: '1px solid var(--border-color)' } }}
                    extra={<Button type="default" size="small" icon={<SyncOutlined />} onClick={handleAddProfile} style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.5)', background: 'transparent' }}>เพิ่มโปรไฟล์</Button>}
                  >
                    <Tabs
                      type="editable-card"
                      activeKey={activeProfileId}
                      onChange={setActiveProfileId}
                      onEdit={(targetKey, action) => {
                        if (action === 'add') handleAddProfile();
                        else handleDeleteProfile(targetKey);
                      }}
                      hideAdd
                      items={sourceSettings.map(profile => ({
                        key: profile.id.toString(),
                        label: profile.profile_name,
                        closable: profile.id != 1,
                        children: <ProfileForm profile={profile} />
                      }))}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={14}>
                  <Card 
                    title={
                        <Space>
                            <CodeOutlined /> 
                            ประวัติการสำรอง Source Code
                        </Space>
                    } 
                    extra={
                        <Space>
                            {selectedSrcKeys.length > 0 && (
                                <>
                                    <Button size="middle" danger icon={<ClearOutlined />} onClick={() => setSelectedSrcKeys([])}>ยกเลิก {selectedSrcKeys.length}</Button>
                                    <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleBulkDeleteSource}>
                                        ลบ {selectedSrcKeys.length}
                                    </Button>
                                </>
                            )}
                            <Button type="primary" icon={<FileZipOutlined />} onClick={handleManualSourceBackup} disabled={isZipping} style={{ backgroundColor: '#8b5cf6' }}>เริ่มบีบอัดทันที</Button>
                        </Space>
                    } 
                    variant="borderless" 
                    style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }} 
                    styles={{ 
                      header: { backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' },
                      body: { padding: 0 }
                    }}
                  >
                    {isZipping && <div style={{ padding: '0 20px 20px' }}><Text strong style={{ color: '#8b5cf6' }}>กำลังบีบอัดไฟล์...</Text><Progress percent={zipProgress} status="active" strokeColor="#8b5cf6" /></div>}
                    <Table 
                      rowSelection={{
                        selectedRowKeys: selectedSrcKeys,
                        onChange: (keys) => setSelectedSrcKeys(keys),
                      }}
                      columns={sourceColumns} 
                      dataSource={sourceLogs} 
                      rowKey="log_id" 
                      pagination={{ pageSize: 10 }} 
                      loading={sourceLoading} 
                      size="middle" 
                      scroll={{ x: 'max-content' }} 
                      rowClassName={(record) => dayjs(record.created_at).format('DD/MM/YYYY HH:mm:ss') === hoveredMirror.timestamp ? 'mirror-highlight' : ''}
                    />
                  </Card>
                </Col>

              </Row>
            )
          },
          {
            key: '2',
            label: <span><DatabaseOutlined /> สำรองข้อมูล (DB)</span>,
            forceRender: true,
            children: (
              <Row gutter={[24, 24]} style={{ marginTop: '0px' }} align="top">
                <Col xs={24} lg={8}>
                  <StorageStatusBar 
                    title="พื้นที่สำรองข้อมูล (DB)" 
                    stats={storageStats?.db} 
                    icon={<DatabaseOutlined />} 
                    color="#0ea5e9" 
                  />
                  <Card 
                    title={<><SettingOutlined /> ตั้งเวลาสำรองข้อมูลอัตโนมัติ</>} 
                    variant="borderless" 
                    style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }} 
                    styles={{ header: { backgroundColor: '#0EA5E9', color: '#ffffff', borderBottom: '1px solid var(--border-color)' } }}
                  >
                    <Form form={form} layout="vertical" onFinish={handleSaveSettings}>
                      <Form.Item name="is_active" id="db_is_active" valuePropName="checked" style={{ backgroundColor: 'var(--bg-app)', padding: '10px 15px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                        <Checkbox><Text strong style={{ color: '#0EA5E9' }}>เปิดใช้งาน Auto Backup (Database)</Text></Checkbox>
                      </Form.Item>
                      <Form.Item name="schedule_type" label={<Text strong style={{ color: 'var(--text-main)' }}>รูปแบบรอบการทำงาน</Text>}>
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
                      <Form.Item name="schedule_time" id="db_schedule_time" label={<Text strong style={{ color: 'var(--text-main)' }}>เวลาที่ระบบประมวลผล (แนะนำ 00:30 น.)</Text>} rules={[{ required: true, message: 'กรุณาเลือกเวลา' }]}>
                        <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                      </Form.Item>
                      <Divider style={{ borderColor: 'var(--border-color)' }}/><Button type="primary" htmlType="submit" icon={<SaveOutlined />} block size="large" style={{ backgroundColor: '#0EA5E9' }}>บันทึกการตั้งค่า</Button>
                    </Form>
                  </Card>
                </Col>
                <Col xs={24} lg={16}>
                  <Card 
                    title={
                        <Space>
                            <DatabaseOutlined /> 
                            ประวัติการสำรองฐานข้อมูล
                        </Space>
                    } 
                    extra={
                        <Space>
                            {selectedDbKeys.length > 0 && (
                                <>
                                    <Button size="middle" danger icon={<ClearOutlined />} onClick={() => setSelectedDbKeys([])}>ยกเลิก {selectedDbKeys.length}</Button>
                                    <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleBulkDeleteDb}>
                                        ลบ {selectedDbKeys.length}
                                    </Button>
                                </>
                            )}
                            <Button type="primary" icon={<DatabaseOutlined />} onClick={handleManualBackup} disabled={isDbBackingUp} style={{ backgroundColor: '#0EA5E9' }}>สำรอง DB ทันที</Button>
                        </Space>
                    } 
                    variant="borderless" 
                    style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }} 
                    styles={{ 
                      header: { backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' },
                      body: { padding: 0 }
                    }}
                  >
                    {isDbBackingUp && <div style={{ padding: '0 20px 20px' }}><Text strong style={{ color: '#0EA5E9' }}>กำลังส่งออกไฟล์...</Text><Progress percent={dbProgress} status="active" strokeColor="#0EA5E9" /></div>}
                    <Table 
                      rowSelection={{
                        selectedRowKeys: selectedDbKeys,
                        onChange: (keys) => setSelectedDbKeys(keys),
                      }}
                      columns={columns} 
                      dataSource={logs} 
                      rowKey="log_id" 
                      pagination={{ pageSize: 10 }} 
                      loading={loading && !isDbBackingUp} 
                      size="middle" 
                      scroll={{ x: 'max-content' }} 
                      rowClassName={(record) => dayjs(record.created_at).format('DD/MM/YYYY HH:mm:ss') === hoveredMirror.timestamp ? 'mirror-highlight' : ''}
                    />
                  </Card>
                </Col>

              </Row>
            )
          },
          {
            key: '3',
            label: <span><GithubOutlined /> อัปโหลดขึ้น (GitHub)</span>,
            forceRender: true,
            children: (
              <Row gutter={[24, 24]} style={{ marginTop: '0px' }} align="top">
                <Col xs={24} lg={10}>
                  <StorageStatusBar 
                    title="พื้นที่บน GitHub (โควตาจำลอง)" 
                    stats={storageStats?.github} 
                    icon={<GithubOutlined />} 
                    color={isDark ? '#e6edf3' : '#111827'} 
                    isCloud={true}
                  />
                  <Card title={<span style={{ color: '#ffffff', fontWeight: 600 }}><SettingOutlined style={{ marginRight: 8 }} />ตั้งค่า GitHub (Auto Push)</span>} 
 variant="borderless" style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }} styles={{ header: { backgroundColor: isDark ? '#1f2937' : '#111827', color: '#ffffff', borderBottom: '1px solid var(--border-color)' } }}>
                    <Form form={githubForm} layout="vertical" onFinish={handleSaveGithubSettings}>
                      <Form.Item name="is_active" id="github_is_active" valuePropName="checked" style={{ backgroundColor: 'var(--bg-app)', padding: '10px 15px', borderRadius: 8, border: '1px solid var(--border-color)' }}><Checkbox><Text strong style={{ color: 'var(--text-main)' }}>เปิดใช้งาน Auto Push</Text></Checkbox></Form.Item>
                      <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>GitHub Token (PAT)</Text>} name="github_token" rules={[{ required: true, message: 'กรุณากรอก Token' }]}><Input.Password placeholder="ghp_xxxx" size="large" /></Form.Item>
                      <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>Repository URL</Text>} name="repo_url" rules={[{ required: true, message: 'กรุณากรอก URL' }]}><Input placeholder="https://github.com/..." size="large" /></Form.Item>
                      <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>Branch เป้าหมาย</Text>} name="branch_name"><Input placeholder="main" size="large" /></Form.Item>
                      <Form.Item name="sync_targets" label={<Text strong style={{ color: 'var(--text-main)' }}>ข้อมูลที่ต้องการ Push</Text>}><Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><Checkbox value="database"><Text strong style={{ color: 'var(--text-main)' }}>ไฟล์ .sql</Text></Checkbox><Checkbox value="source"><Text strong style={{ color: 'var(--text-main)' }}>ไฟล์ Source Code</Text></Checkbox></Checkbox.Group></Form.Item>
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
                      <Form.Item name="schedule_time" id="github_schedule_time" label={<Text strong style={{ color: 'var(--text-main)' }}>เวลาดำเนินการ (แนะนำ 01:00 น.)</Text>} rules={[{ required: true, message: 'กรุณาเลือกเวลา' }]}>
                        <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                      </Form.Item>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block size="large" style={{ backgroundColor: isDark ? '#374151' : '#111827', borderColor: isDark ? '#4b5563' : '#111827', color: '#ffffff', fontWeight: 600 }}>บันทึกการตั้งค่า GitHub</Button>
                    </Form>
                  </Card>
                </Col>
                <Col xs={24} lg={14}>
                  <Card 
                    title={
                        <Space style={{ color: 'var(--text-main)' }}>
                            <GithubOutlined /> 
                            ประวัติการ Push
                        </Space>
                    } 
                    extra={
                        <Space>
                            {selectedGitKeys.length > 0 && (
                                <>
                                    <Button size="middle" danger icon={<ClearOutlined />} onClick={() => setSelectedGitKeys([])}>ยกเลิก {selectedGitKeys.length}</Button>
                                    <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleBulkDeleteGithub}>
                                        ลบ {selectedGitKeys.length}
                                    </Button>
                                </>
                            )}
                            <Button type="primary" icon={<GithubOutlined />} onClick={handleManualGithubPush} disabled={isGithubPushing} style={{ backgroundColor: isDark ? '#374151' : '#111827', borderColor: isDark ? '#4b5563' : '#111827', color: '#ffffff', fontWeight: 600 }}>Push ทันที</Button>
                        </Space>
                    } 
                    variant="borderless" 
                    style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }} 
                    styles={{ 
                      header: { backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' },
                      body: { padding: 0 }
                    }}
                  >
                    {isGithubPushing && <div style={{ padding: '0 20px 20px' }}><Text strong style={{ color: 'var(--text-main)' }}>กำลังส่งข้อมูล...</Text><Progress percent={githubProgress} status="active" strokeColor={isDark ? '#38bdf8' : '#111827'} /></div>}
                    <Table 
                      rowSelection={{
                        selectedRowKeys: selectedGitKeys,
                        onChange: (keys) => setSelectedGitKeys(keys),
                      }}
                      columns={githubColumns} 
                      dataSource={githubLogs} 
                      rowKey="log_id" 
                      pagination={{ pageSize: 10 }} 
                      loading={githubLoading} 
                      size="middle" 
                      scroll={{ x: 'max-content' }} 
                    />
                  </Card>
                </Col>

              </Row>
            )
          },
          {
            key: '4',
            label: <span><GoogleOutlined /> อัปโหลดขึ้น Cloud (GDrive)</span>,
            forceRender: true,
            children: (
              <Row gutter={[24, 24]} style={{ marginTop: '0px' }} align="top">
                <Col xs={24} lg={10}>
                  <StorageStatusBar 
                    title="พื้นที่บน Google Drive" 
                    stats={storageStats?.gdrive} 
                    icon={<GoogleOutlined />} 
                    color="#10b981" 
                    isCloud={true}
                  />
                  <Card title={<><SettingOutlined /> ตั้งค่า Google Drive (Auto Upload)</>} 
 variant="borderless" style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }} styles={{ header: { backgroundColor: '#10b981', color: '#fff', borderBottom: '1px solid var(--border-color)' } }}>
                    <Form form={gdriveForm} layout="vertical" onFinish={handleSaveGdriveSettings}>
                      <Form.Item name="is_active" valuePropName="checked" style={{ backgroundColor: 'var(--bg-app)', padding: '10px 15px', borderRadius: 8, border: '1px solid var(--border-color)' }}><Checkbox><Text strong style={{ color: 'var(--text-main)' }}>เปิดใช้งาน Auto Upload</Text></Checkbox></Form.Item>
                      <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>Client ID</Text>} name="client_id" rules={[{ required: true, message: 'กรุณากรอก Client ID' }]}><Input placeholder="xxxxxxxxxx.apps.googleusercontent.com" size="large" /></Form.Item>
                      <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>Client Secret</Text>} name="client_secret" rules={[{ required: true, message: 'กรุณากรอก Client Secret' }]}><Input.Password placeholder="GOCSPX-xxxxxx" size="large" /></Form.Item>
                      <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>Refresh Token</Text>} name="refresh_token" rules={[{ required: true, message: 'กรุณากรอก Refresh Token' }]}><Input.Password placeholder="1//0xxxxxxxxx" size="large" /></Form.Item>
                      <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>Folder ID (ตัวเลือก)</Text>} name="folder_id"><Input placeholder="วาง Folder ID ปลายทางที่นี่ (ถ้ามี)" size="large" /></Form.Item>
                      <Form.Item name="sync_targets" label={<Text strong style={{ color: 'var(--text-main)' }}>ข้อมูลที่ต้องการ Upload</Text>}><Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><Checkbox value="database"><Text strong style={{ color: 'var(--text-main)' }}>ไฟล์ .sql</Text></Checkbox><Checkbox value="source"><Text strong style={{ color: 'var(--text-main)' }}>ไฟล์ Source Code</Text></Checkbox></Checkbox.Group></Form.Item>
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
                      <Form.Item name="schedule_time" label={<Text strong style={{ color: 'var(--text-main)' }}>เวลาดำเนินการ (แนะนำ 01:30 น.)</Text>} rules={[{ required: true, message: 'กรุณาเลือกเวลา' }]}>
                        <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                      </Form.Item>
                      <Divider style={{ borderColor: 'var(--border-color)' }}/><Button type="primary" htmlType="submit" icon={<SaveOutlined />} block size="large" style={{ backgroundColor: '#10b981' }}>บันทึกการตั้งค่า GDrive</Button>
                    </Form>
                  </Card>
                </Col>
                <Col xs={24} lg={14}>
                  <Card 
                    title={
                        <Space>
                            <GoogleOutlined /> 
                            ประวัติการอัปโหลด
                        </Space>
                    } 
                    extra={
                        <Space>
                            {selectedGdriveKeys.length > 0 && (
                                <>
                                    <Button size="middle" danger icon={<ClearOutlined />} onClick={() => setSelectedGdriveKeys([])}>ยกเลิก {selectedGdriveKeys.length}</Button>
                                    <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleBulkDeleteGdrive}>
                                        ลบ {selectedGdriveKeys.length}
                                    </Button>
                                </>
                            )}
                            <Button type="primary" icon={<GoogleOutlined />} onClick={handleManualGdrivePush} disabled={isGdrivePushing} style={{ backgroundColor: '#10b981' }}>Upload ทันที</Button>
                        </Space>
                    } 
                    variant="borderless" 
                    style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }} 
                    styles={{ 
                      header: { backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' },
                      body: { padding: 0 }
                    }}
                  >
                    {isGdrivePushing && <div style={{ padding: '0 20px 20px' }}><Text strong style={{ color: '#10b981' }}>กำลังเชื่อมต่อและอัปโหลดข้อมูล...</Text><Progress percent={gdriveProgress} status="active" strokeColor="#10b981" /></div>}
                    <Table 
                      rowSelection={{
                        selectedRowKeys: selectedGdriveKeys,
                        onChange: (keys) => setSelectedGdriveKeys(keys),
                      }}
                      columns={gdriveColumns} 
                      dataSource={gdriveLogs} 
                      rowKey="log_id" 
                      pagination={{ pageSize: 10 }} 
                      loading={gdriveLoading} 
                      size="middle" 
                      scroll={{ x: 'max-content' }}
                      rowClassName={(record) => {
                        const isRowHovered = hoveredMirror.timestamp && record.remarks?.includes(hoveredMirror.timestamp);
                        return isRowHovered ? 'gdrive-row-connected' : (hoveredMirror.timestamp ? 'gdrive-row-faded' : '');
                      }}
                      onRow={() => ({
                        onMouseLeave: () => setHoveredMirror({ timestamp: null, type: null })
                      })}
                    />
                  </Card>
                </Col>

              </Row>
            )
          },
          {
            key: '5',
            label: <span><ClearOutlined /> ล้างข้อมูล (Cleanup)</span>,
            forceRender: true,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Row gutter={[24, 24]} align="top">
                  <Col xs={24} xl={14}>
                    <Card 
                      title={<Space><AreaChartOutlined style={{ color: '#6366f1' }} /> สถิติการใช้งานพื้นที่จัดเก็บ (30 วันย้อนหลัง)</Space>}
                      variant="borderless"
                      style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}
                      styles={{ header: { borderBottom: '1px solid var(--border-color)' } }}
                    >
                      <StorageAnalyticsChart data={storageHistory} />
                      <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>* หน่วยข้อมูลในกราฟคือเมกะไบต์ (MB) และรวมพื้นที่จากทุกช่องทาง</Text>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} xl={10}>
                    <Card 
                      title={<Space><DatabaseOutlined style={{ color: '#0ea5e9' }} /> สถานะพื้นที่จัดเก็บปัจจุบัน</Space>}
                      variant="borderless"
                      style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)', height: '100%' }}
                      styles={{ header: { borderBottom: '1px solid var(--border-color)' } }}
                    >
                      <StorageStatusBar title="ฐานข้อมูล (DB)" stats={storageStats?.db} icon={<DatabaseOutlined />} color="#0ea5e9" />
                      <StorageStatusBar title="ซอร์สโค้ด (Source)" stats={storageStats?.source} icon={<CodeOutlined />} color="#8b5cf6" />
                      <StorageStatusBar title="GitHub (Quota)" stats={storageStats?.github} icon={<GithubOutlined />} color="#111827" isCloud={true} />
                      <StorageStatusBar title="Google Drive" stats={storageStats?.gdrive} icon={<GoogleOutlined />} color="#10b981" isCloud={true} />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[24, 24]} style={{ marginTop: '0px' }} align="top">
                  <Col xs={24} lg={10}>
                    <StorageStatusBar 
                      title="พื้นที่ที่สามารถล้างข้อมูลได้ (Local)" 
                      stats={storageStats?.cleanup} 
                      icon={<ClearOutlined />} 
                      color="#f97316" 
                    />
                    <Card 
                      title={<><SettingOutlined /> ตั้งค่า Auto Cleanup (ล้างข้อมูลอัตโนมัติ)</>} 
                      variant="borderless" 
                      style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }} 
                      styles={{ header: { backgroundColor: '#f97316', color: '#ffffff', borderBottom: '1px solid var(--border-color)' } }}
                    >
                    <Form form={cleanupForm} layout="vertical" onFinish={handleSaveCleanupSettings}>
                      <Form.Item name="is_active" valuePropName="checked" style={{ backgroundColor: 'var(--bg-app)', padding: '10px 15px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                        <Checkbox><Text strong style={{ color: '#f97316' }}>เปิดใช้งานระบบล้างข้อมูลอัตโนมัติ</Text></Checkbox>
                      </Form.Item>
                      
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>เก็บไฟล์ DB (วัน)</Text>}>
                            <Space.Compact style={{ width: '100%' }}>
                              <Form.Item name="db_retention_days" noStyle rules={[{ required: true }]}>
                                <Input type="number" min={1} size="large" />
                              </Form.Item>
                              <Button size="large" disabled style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-sub)' }}>วัน</Button>
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>เก็บไฟล์ Code (วัน)</Text>}>
                            <Space.Compact style={{ width: '100%' }}>
                              <Form.Item name="source_retention_days" noStyle rules={[{ required: true }]}>
                                <Input type="number" min={1} size="large" />
                              </Form.Item>
                              <Button size="large" disabled style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-sub)' }}>วัน</Button>
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>เก็บ System Log (วัน)</Text>}>
                            <Space.Compact style={{ width: '100%' }}>
                              <Form.Item name="system_log_retention_days" noStyle rules={[{ required: true }]}>
                                <Input type="number" min={1} size="large" />
                              </Form.Item>
                              <Button size="large" disabled style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-sub)' }}>วัน</Button>
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={<Text strong style={{ color: 'var(--text-main)' }}>เก็บ Ticket Log (วัน)</Text>}>
                            <Space.Compact style={{ width: '100%' }}>
                              <Form.Item name="ticket_log_retention_days" noStyle rules={[{ required: true }]}>
                                <Input type="number" min={1} size="large" />
                              </Form.Item>
                              <Button size="large" disabled style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-sub)' }}>วัน</Button>
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider style={{ borderColor: 'var(--border-color)' }}/>
                      
                      <Form.Item name="schedule_type" label={<Text strong style={{ color: 'var(--text-main)' }}>รูปแบบรอบการทำงาน</Text>}>
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

                      <Form.Item name="schedule_time" label={<Text strong style={{ color: 'var(--text-main)' }}>เวลาที่ระบบประมวลผล (แนะนำ 03:00 น.)</Text>} rules={[{ required: true, message: 'กรุณาเลือกเวลา' }]}>
                        <TimePicker format="HH:mm" style={{ width: '100%' }} size="large" />
                      </Form.Item>
                      
                      <Divider style={{ borderColor: 'var(--border-color)' }}/>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block size="large" style={{ backgroundColor: '#f97316' }}>บันทึกการตั้งค่า Cleanup</Button>
                    </Form>
                  </Card>
                </Col>
                
                <Col xs={24} lg={14}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span><ClearOutlined /> ประมวลผลและวิเคราะห์รายการลบ</span>
                        <Button size="small" icon={<SyncOutlined spin={isPreviewLoading} />} onClick={fetchCleanupPreview}>วิเคราะห์ใหม่</Button>
                      </div>
                    } 
                    variant="borderless" 
                    style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--card-shadow)', height: '100%' }} 
                    styles={{ header: { backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' } }}
                  >
                    <div style={{ padding: '20px' }}>
                      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '20px', color: 'var(--text-main)' }}>รายการที่เข้าเกณฑ์การล้างข้อมูล (ตามค่าที่ตั้งไว้)</Text>
                      
                      <Row gutter={[16, 16]}>
                        {[
                          { title: 'Database', count: cleanupPreview?.dbCount, days: cleanupPreview?.retention?.db, color: '#0ea5e9', icon: <DatabaseOutlined /> },
                          { title: 'Source Code', count: cleanupPreview?.sourceCount, days: cleanupPreview?.retention?.source, color: '#8b5cf6', icon: <FileZipOutlined /> },
                          { title: 'System Logs', count: cleanupPreview?.sysLogCount, days: cleanupPreview?.retention?.sys, color: '#f59e0b', icon: <SettingOutlined /> },
                          { title: 'Ticket Logs', count: cleanupPreview?.ticketLogCount, days: cleanupPreview?.retention?.ticket, color: '#ec4899', icon: <CheckCircleOutlined /> }
                        ].map((item, idx) => (
                          <Col xs={12} sm={6} key={idx}>
                            <Card 
                              size="small" 
                              hoverable 
                              style={{ textAlign: 'center', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer' }}
                              onClick={() => fetchCleanupDetails(['db', 'source', 'syslog', 'ticketlog'][idx])}
                            >
                              <div style={{ color: item.color, fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>{item.title}</Text>
                              <div style={{ margin: '8px 0' }}>
                                <Title level={2} style={{ margin: 0, color: item.count > 0 ? '#ef4444' : 'var(--text-sub)' }}>{item.count || 0}</Title>
                                <Text style={{ fontSize: '11px', color: 'var(--text-sub)' }}>รายการ</Text>
                              </div>
                              <Tag color="default" style={{ margin: 0, fontSize: '10px' }}>{'>'} {item.days} วัน</Tag>
                              <div style={{ marginTop: '8px' }}><Text style={{ fontSize: '10px', color: '#6366f1' }}>คลิกเพื่อดูรายละเอียด</Text></div>
                            </Card>
                          </Col>
                        ))}
                      </Row>

                      <Divider style={{ margin: '32px 0' }}/>

                      <div style={{ textAlign: 'center' }}>
                        <Title level={4} style={{ color: 'var(--text-main)' }}>ล้างข้อมูลด้วยตนเอง (Manual Cleanup)</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                          กดปุ่มด้านล่างเพื่อเริ่มการลบรายการทั้งหมดที่ระบุไว้ด้านบน <br/>
                          <Text type="danger" strong>⚠️ คำเตือน: ข้อมูลที่ถูกลบไปแล้วไม่สามารถกู้คืนได้</Text>
                        </Text>
                        
                        {isCleaningUp && (
                          <div style={{ maxWidth: '400px', margin: '0 auto 24px' }}>
                            <Text strong style={{ color: '#f97316' }}>กำลังดำเนินการ...</Text>
                            <Progress percent={cleanupProgress} status="active" strokeColor="#f97316" />
                          </div>
                        )}
                        
                        <Button 
                          type="primary" 
                          size="large" 
                          icon={<DeleteOutlined />} 
                          onClick={handleManualCleanup} 
                          loading={isCleaningUp}
                          disabled={!cleanupPreview || (cleanupPreview.dbCount + cleanupPreview.sourceCount + cleanupPreview.sysLogCount + cleanupPreview.ticketLogCount === 0)}
                          style={{ height: '54px', padding: '0 40px', fontSize: '16px', borderRadius: '27px', backgroundColor: '#f97316' }}
                        >
                          เริ่มการล้างข้อมูลทันที
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
              </div>
            )
          }
        ]}
      />

      {/* ✅ [New] Modal สำหรับ Drill Down รายละเอียดที่จะถูกลบ */}
      <Modal
        title={
          <Space>
            <ClearOutlined style={{ color: '#f97316' }} />
            <span>รายละเอียดรายการที่จะถูกลบ: <Text strong style={{ color: '#6366f1' }}>{
              detailType === 'db' ? 'ฐานข้อมูล (Database)' :
              detailType === 'source' ? 'ซอร์สโค้ด (Source Code)' :
              detailType === 'syslog' ? 'System Logs' : 'Ticket Logs'
            }</Text></span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailModalVisible(false)}>ปิดหน้าต่าง</Button>]}
        width={800}
        styles={{ body: { padding: '20px 0' } }}
      >
        <Table
          dataSource={detailData}
          loading={isDetailLoading}
          rowKey={(record) => record.id || record.file_name}
          pagination={{ pageSize: 10 }}
          size="middle"
          scroll={{ y: 400 }}
          columns={[
            ...(detailType === 'db' || detailType === 'source' ? [
              { title: 'ชื่อไฟล์', dataIndex: 'file_name', key: 'file_name', render: text => <Text strong>{text}</Text> },
              { title: 'ขนาด', dataIndex: 'file_size', key: 'file_size', align: 'center', width: 120 },
              { title: 'วันที่สร้าง', dataIndex: 'created_at', key: 'created_at', align: 'center', width: 180, render: date => dayjs(date).format('DD/MM/YYYY HH:mm') }
            ] : []),
            ...(detailType === 'syslog' ? [
              { title: 'Level', dataIndex: 'level', key: 'level', width: 100, render: l => <Tag color={l === 'ERROR' ? 'error' : 'processing'}>{l}</Tag> },
              { title: 'โมดูล', dataIndex: 'module', key: 'module', width: 120 },
              { title: 'ข้อความ', dataIndex: 'message', key: 'message', ellipsis: true },
              { title: 'วัน-เวลา', dataIndex: 'created_at', key: 'created_at', width: 180, render: date => dayjs(date).format('DD/MM/YYYY HH:mm') }
            ] : []),
            ...(detailType === 'ticketlog' ? [
              { title: 'Ticket ID', dataIndex: 'ticket_id', key: 'ticket_id', width: 100 },
              { title: 'การกระทำ', dataIndex: 'action', key: 'action' },
              { title: 'ผู้ดำเนินการ', dataIndex: 'actor', key: 'actor', width: 150 },
              { title: 'วัน-เวลา', dataIndex: 'created_at', key: 'created_at', width: 180, render: date => dayjs(date).format('DD/MM/YYYY HH:mm') }
            ] : [])
          ]}
        />
        <div style={{ padding: '16px 24px 0', textAlign: 'right' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>* แสดงสูงสุด 100 รายการล่าสุดที่เข้าเกณฑ์</Text>
        </div>
      </Modal>

      {/* ✅ [New] Modal สำหรับแสดงรายการ Backup ทั้งหมดของวันที่เลือกจากปฏิทิน */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#6366f1' }} />
            <span>รายการสำรองข้อมูลประจำวันที่: <Text strong style={{ color: '#6366f1' }}>{selectedCalendarDate}</Text></span>
          </Space>
        }
        open={isCalendarModalVisible}
        onCancel={() => setIsCalendarModalVisible(false)}
        footer={[<Button key="close" onClick={() => setIsCalendarModalVisible(false)}>ปิดหน้าต่าง</Button>]}
        width={700}
      >
        <Table
          dataSource={calendarModalData}
          rowKey="id"
          pagination={false}
          size="middle"
          columns={[
            { 
              title: 'ประเภท', 
              dataIndex: 'content', 
              key: 'content',
              render: (text, record) => (
                <Space>
                  {record.type === 'db' && <DatabaseOutlined style={{ color: '#0ea5e9' }} />}
                  {record.type === 'src' && <FileZipOutlined style={{ color: '#8b5cf6' }} />}
                  {record.type === 'github' && <GithubOutlined style={{ color: isDark ? '#e6edf3' : '#111827' }} />}
                  {record.type === 'gdrive' && <GoogleOutlined style={{ color: '#10b981' }} />}
                  <Text strong>{text}</Text>
                </Space>
              )
            },
            { title: 'เวลา', dataIndex: 'time', key: 'time', align: 'center', width: 100 },
            { 
              title: 'รายละเอียด', 
              dataIndex: 'detail', 
              key: 'detail',
              render: (text, record) => (
                <div style={{ maxWidth: '300px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }} ellipsis={{ tooltip: text }}>{text || '-'}</Text>
                  {record.size && <div style={{ fontSize: '10px', color: 'var(--text-sub)' }}>ขนาด: {record.size}</div>}
                </div>
              )
            },
            { 
              title: 'สถานะ', 
              dataIndex: 'status', 
              key: 'status', 
              align: 'center',
              render: status => {
                if (status === 'success') return <Tag color="success">สำเร็จ</Tag>;
                if (status === 'error') return <Tag color="error">ล้มเหลว</Tag>;
                if (status === 'missed') return <Tag color="error" style={{ fontWeight: 'bold' }}>เลยกำหนด/ไม่พบข้อมูล</Tag>;
                return <Tag color="default">รอดำเนินการ</Tag>;
              }
            }
          ]}
        />
      </Modal>
    </div>
  );
}

