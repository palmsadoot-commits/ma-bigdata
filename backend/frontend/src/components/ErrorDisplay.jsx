import React, { useState, useEffect } from 'react';
import { Button, Result, Typography, Select, Card, Tag, Flex, theme } from 'antd';
import { HomeOutlined, CustomerServiceOutlined, ReloadOutlined, LockOutlined, StopOutlined, BugOutlined, CloudServerOutlined, ClockCircleOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';

const { Text, Paragraph, Title } = Typography;

const ErrorDisplay = ({ code: propCode, allowPreview = false }) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { code: pathCode } = useParams();
  const [searchParams] = useSearchParams();
  
  // Priority: URL Test Param > URL Path Param > Prop > Default 404
  const urlTestCode = searchParams.get('test_code');
  const [activeCode, setActiveCode] = useState(urlTestCode || pathCode || propCode || '404');

  const isDarkMode = document.body.classList.contains('dark-mode');

  // Sync state if path param changes
  useEffect(() => {
    if (pathCode) setActiveCode(pathCode);
  }, [pathCode]);

  // Sync state if URL test param changes
  useEffect(() => {
    if (urlTestCode) setActiveCode(urlTestCode);
  }, [urlTestCode]);

  const handleTryAgain = () => {
    // พยายามย้อนกลับไปหน้าก่อนหน้าที่เคยอยู่
    navigate(-1);
    
    // เผื่อกรณีที่ย้อนกลับไม่ได้ (ไม่มีประวัติ) ให้พาไปหน้า Dashboard หลังจากดีเลย์เล็กน้อย
    setTimeout(() => {
      if (window.location.pathname.includes('/error')) {
        navigate('/dashboard');
      }
    }, 100);
  };

  const config = {
    // --- 2xx Success (For Preview) ---
    '200': {
      title: '200 OK',
      subTitle: 'ทุกอย่างปกติดี!',
      extra: 'คำขอของคุณถูกดำเนินการสำเร็จแล้ว ไม่มีอะไรต้องกังวล',
      icon: <div className="error-animation">✅</div>,
      button: <Button type="primary" onClick={() => navigate('/dashboard')}>กลับสู่หน้าหลัก</Button>
    },
    '201': {
      title: '201 Created',
      subTitle: 'สร้างข้อมูลใหม่สำเร็จ',
      extra: 'เซิร์ฟเวอร์ได้รับข้อมูลและบันทึกลงฐานข้อมูลเรียบร้อยแล้ว',
      icon: <div className="error-animation">🎉</div>,
      button: <Button type="primary" onClick={() => navigate('/dashboard')}>ตกลง</Button>
    },

    // --- 4xx Client Errors ---
    '400': {
      title: '400 Bad Request',
      subTitle: 'ส่งข้อมูลผิดรูปแบบ',
      extra: 'เซิร์ฟเวอร์ไม่เข้าใจคำขอของคุณ อาจเป็นเพราะข้อมูลที่ส่งไปไม่ครบถ้วนหรือผิดประเภท',
      icon: <div className="error-animation">🤕</div>,
      button: <Button icon={<ReloadOutlined />} onClick={handleTryAgain}>ลองใหม่อีกครั้ง</Button>
    },
    '401': {
      title: '401 Unauthorized',
      subTitle: 'คุณคือใคร?',
      extra: 'กรุณาเข้าสู่ระบบก่อนเข้าถึงหน้านี้ หรือ Token ของคุณอาจหมดอายุแล้ว',
      icon: <div className="error-animation">🔑</div>,
      button: <Button type="primary" icon={<LockOutlined />} onClick={() => navigate('/')}>ไปหน้าล็อกอิน</Button>
    },
    '403': {
      title: '403 Forbidden',
      subTitle: 'คุณไม่มีสิทธิ์เข้าถึง!',
      extra: 'เรารู้นะว่าคุณคือใคร แต่คุณไม่มีสิทธิ์ได้รับอนุญาตให้เข้าดูหน้านี้',
      icon: <div className="error-animation">🚫</div>,
      button: <Button danger onClick={() => navigate('/dashboard')}>กลับพื้นที่ปลอดภัย</Button>
    },
    '404': {
      title: '404 Not Found',
      subTitle: 'ขออภัย! ไม่พบหน้าที่คุณตามหา',
      extra: 'สงสัยหน้าเว็บนี้จะหายไปในจักรวาลข้อมูลของเราเสียแล้ว... ลองตรวจสอบ URL อีกครั้งนะ',
      icon: <div className="error-animation">🕵️‍♂️</div>,
      button: <Button type="primary" size="large" icon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>กลับสู่หน้าหลัก</Button>
    },
    '405': {
      title: '405 Method Not Allowed',
      subTitle: 'ใช้คำสั่งผิดประเภท',
      extra: 'เซิร์ฟเวอร์ไม่อนุญาตให้ใช้คำสั่งนี้ (เช่น ส่ง GET ในที่ที่ต้องใช้ POST)',
      icon: <div className="error-animation">📵</div>,
      button: <Button onClick={() => navigate(-1)}>ย้อนกลับ</Button>
    },

    // --- 5xx Server Errors ---
    '500': {
      title: '500 Internal Error',
      subTitle: 'อุ๊ปส์! ระบบขัดข้องเล็กน้อย',
      extra: 'เซิร์ฟเวอร์ของเรากำลังประมวลผลอย่างหนัก หรืออาจมีบัคในระบบ โปรดรอสักครู่แล้วลองใหม่นะ',
      icon: <div className="error-animation">🔥</div>,
      button: <Button type="primary" size="large" onClick={handleTryAgain}>ลองใหม่อีกครั้ง</Button>
    },
    '502': {
      title: '502 Bad Gateway',
      subTitle: 'การเชื่อมต่อผิดพลาด',
      extra: 'เซิร์ฟเวอร์หน้าด่านคุยกับเซิร์ฟเวอร์หลังบ้านไม่รู้เรื่อง อาจกำลังรีสตาร์ทระบบอยู่',
      icon: <div className="error-animation">🛰️</div>,
      button: <Button icon={<ReloadOutlined />} onClick={handleTryAgain}>ลองใหม่อีกครั้ง</Button>
    },
    '503': {
      title: 'Maintenance',
      subTitle: 'กำลังปิดปรับปรุงระบบชั่วคราว',
      extra: 'เรากำลังอัปเกรดระบบให้เทพกว่าเดิม เพื่อมอบประสบการณ์การใช้งานที่ดีที่สุดให้คุณ',
      icon: <div className="maintenance-animation">🏗️</div>,
      button: <Button icon={<CustomerServiceOutlined />} onClick={() => window.open('https://line.me', '_blank')}>ติดต่อเจ้าหน้าที่</Button>
    },
    '504': {
      title: '504 Gateway Timeout',
      subTitle: 'เซิร์ฟเวอร์ตอบสนองช้าเกินไป',
      extra: 'ระบบใช้เวลาประมวลผลนานเกินกำหนด อาจเป็นเพราะข้อมูลมีขนาดใหญ่มาก',
      icon: <div className="error-animation">⏳</div>,
      button: <Button icon={<ClockCircleOutlined />} onClick={handleTryAgain}>ลองใหม่อีกครั้ง</Button>
    }
  };

  const current = config[activeCode] || config['404'];

  return (
    <div className="error-page-container">
      <style>{`
        .error-page-container {
          height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: ${token.colorBgLayout};
          font-family: 'Kanit', sans-serif;
          overflow: hidden;
        }
        .error-animation {
          font-size: 100px;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
          animation: floating 3s ease-in-out infinite;
        }
        .maintenance-animation {
          font-size: 100px;
          animation: wrench 2s linear infinite;
        }
        @keyframes floating {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(10deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes wrench {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-15 reversed); }
          75% { transform: rotate(15deg); }
          100% { transform: rotate(0deg); }
        }
        .ant-result-title {
          font-size: clamp(40px, 8vw, 80px) !important;
          font-weight: 900 !important;
          background: linear-gradient(45deg, ${token.colorPrimary}, ${token.colorPurple || '#722ed1'});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0 !important;
        }
        .ant-result-subtitle {
          font-size: clamp(18px, 4vw, 26px) !important;
          font-weight: 600 !important;
          color: ${token.colorText} !important;
        }
        .preview-selector {
          position: fixed;
          bottom: 20px;
          background: ${token.colorBgContainer};
          padding: 15px;
          border-radius: 12px;
          box-shadow: ${token.boxShadow};
          z-index: 1000;
          border: 1px solid ${token.colorBorder};
          max-width: 90%;
        }
      `}</style>
      
      <Result
        icon={current.icon}
        title={current.title}
        subTitle={current.subTitle}
        extra={
          <Flex vertical align="center" style={{ width: '100%' }} gap="middle">
            <Paragraph style={{ maxWidth: 460, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: '16px' }}>{current.extra}</Text>
            </Paragraph>
            <div style={{ marginTop: 20 }}>{current.button}</div>
          </Flex>
        }
      />

      {(allowPreview || searchParams.get('mode') === 'preview') && (
        <div className="preview-selector">
          <Flex vertical gap="small" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0 }}><BugOutlined /> ทดสอบหน้า Error (Preview Mode)</Title>
            <Flex wrap="wrap" gap="small" align="center">
              <Text size="small">เลือกโค้ดเพื่อดูตัวอย่าง:</Text>
              <Select 
                value={activeCode} 
                onChange={setActiveCode} 
                style={{ width: 220 }}
                options={[
                  { label: '🟢 200 OK (สำเร็จ)', value: '200' },
                  { label: '🟢 201 Created (สร้างแล้ว)', value: '201' },
                  { label: '🟠 400 Bad Request (ข้อมูลผิด)', value: '400' },
                  { label: '🟠 401 Unauthorized (ไม่พบตัวตน)', value: '401' },
                  { label: '🟠 403 Forbidden (ไม่มีสิทธิ์)', value: '403' },
                  { label: '🟠 404 Not Found (หาไม่เจอ)', value: '404' },
                  { label: '🟠 405 Method Not Allowed', value: '405' },
                  { label: '🔴 500 Internal Error (ระบบพัง)', value: '500' },
                  { label: '🔴 502 Bad Gateway', value: '502' },
                  { label: '🔴 503 Maintenance (ปิดซ่อม)', value: '503' },
                  { label: '🔴 504 Gateway Timeout', value: '504' },
                ]}
              />
              <Button type="dashed" onClick={() => navigate('/dashboard')}>ออกจากการพรีวิว</Button>
            </Flex>
          </Flex>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;
