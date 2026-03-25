import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, Result, Typography, Space } from 'antd';
import { PrinterOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

export default function TicketPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/tickets/${id}`)
      .then(response => {
        setTicket(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching ticket:', error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}><Spin size="large" /></div>;
  if (!ticket) return <Result status="404" title="ไม่พบข้อมูล" subTitle="ไม่พบใบแจ้งซ่อมที่คุณต้องการพิมพ์" />;

  // ฟังก์ชันจัดรูปแบบวันที่และเวลาแบบไทย
  const formatDate = (dateString) => {
    if (!dateString) return '......./......./.......';
    return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const formatTime = (dateString) => {
    if (!dateString) return '................';
    return new Date(dateString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  };

  return (
    <div style={{ backgroundColor: '#e2e8f0', minHeight: '100vh', padding: '20px 0', fontFamily: '"Sarabun", "Sarabun IT", sans-serif' }}>
      
      {/* แถบเครื่องมือ (จะไม่ถูกพรินต์) */}
      <div className="no-print" style={{ maxWidth: '210mm', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')} size="large">
          กลับไปแดชบอร์ด
        </Button>
        <Space>
          <Text type="secondary">ปรับ Layout เป็น A4 (Portrait) ก่อนพิมพ์</Text>
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} size="large" style={{ backgroundColor: '#28a745' }}>
            พิมพ์เอกสาร
          </Button>
        </Space>
      </div>

      {/* กระดาษ A4 */}
      <div className="a4-paper" style={{ 
        width: '210mm', minHeight: '297mm', margin: '0 auto', backgroundColor: 'white', 
        padding: '20mm', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', position: 'relative', boxSizing: 'border-box'
      }}>
        
        {/* หัวเอกสาร */}
        <div style={{ textAlign: 'center', marginBottom: '25px', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, border: '1px solid #333', padding: '5px 15px' }}>
            <b>หมายเลขแบบฟอร์ม #:</b> {ticket.ticket_number}
          </div>
          <Title level={4} style={{ margin: 0, paddingTop: '10px' }}>แบบฟอร์มแจ้งปัญหาการใช้งาน</Title>
          <Title level={5} style={{ margin: '5px 0 0 0', fontWeight: 'normal' }}>
            ระบบวิเคราะห์ข้อมูลขนาดใหญ่ด้านแรงงาน (Labour Big Data Analytics)<br/>
            เพื่อการพัฒนากำลังแรงงานของประเทศ
          </Title>
        </div>

        {/* ส่วนที่ 1 */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', backgroundColor: '#f0f0f0', padding: '5px 10px', borderLeft: '4px solid #333' }}>ส่วนที่ ๑ ผู้แจ้งปัญหา (เจ้าหน้าที่)</h4>
          <table style={{ width: '100%', lineHeight: '1.8' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%' }}><b>ชื่อผู้ขอใช้บริการ:</b> {ticket.reporter_name}</td>
                <td style={{ width: '50%' }}><b>ตำแหน่ง:</b> {ticket.reporter_position}</td>
              </tr>
              <tr>
                <td><b>หน่วยงาน:</b> {ticket.reporter_department}</td>
                <td><b>โทรศัพท์:</b> {ticket.reporter_phone}</td>
              </tr>
              <tr>
                <td><b>วันที่แจ้ง:</b> {formatDate(ticket.created_at)}</td>
                <td><b>เวลา:</b> {formatTime(ticket.created_at)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ส่วนที่ 2 */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', backgroundColor: '#f0f0f0', padding: '5px 10px', borderLeft: '4px solid #333' }}>ส่วนที่ ๒ รายละเอียด</h4>
          <p style={{ margin: '5px 0' }}><b>หมวดหมู่:</b> [{ticket.category_type}] {ticket.category_name}</p>
          <p style={{ margin: '5px 0' }}><b>เลขครุภัณฑ์/เลขเครื่อง (ถ้ามี):</b> {ticket.equipment_no || '-'}</p>
          <div style={{ marginTop: '10px' }}>
            <b>รายละเอียดปัญหา:</b>
            <div style={{ minHeight: '80px', border: '1px dotted #ccc', padding: '10px', marginTop: '5px', whiteSpace: 'pre-wrap' }}>
              {ticket.problem_detail}
            </div>
          </div>
        </div>

        {/* ส่วนที่ 3 */}
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ margin: '0 0 10px 0', backgroundColor: '#f0f0f0', padding: '5px 10px', borderLeft: '4px solid #333' }}>ส่วนที่ ๓ ผลการดำเนินการ</h4>
          <table style={{ width: '100%', lineHeight: '1.8', marginBottom: '10px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%' }}><b>วันที่ดำเนินการแล้วเสร็จ:</b> {formatDate(ticket.resolved_at)}</td>
                <td style={{ width: '50%' }}><b>เวลา:</b> {formatTime(ticket.resolved_at)}</td>
              </tr>
            </tbody>
          </table>
          <div>
            <b>แนวทางการดำเนินการ / สาเหตุปัญหา / วิธีการแก้ไข:</b>
            <div style={{ minHeight: '100px', border: '1px dotted #ccc', padding: '10px', marginTop: '5px', whiteSpace: 'pre-wrap' }}>
              {ticket.root_cause_and_solution || '\n\n\n'}
            </div>
          </div>
        </div>

        {/* ส่วนที่ 4 และ 5 (ลายเซ็น) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
          
          <div style={{ width: '45%', textAlign: 'center', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>ส่วนที่ ๔ สำหรับผู้แจ้งปัญหา</div>
            <div>ลงชื่อ............................................................</div>
            <div style={{ margin: '10px 0' }}>( {ticket.reporter_name} )</div>
            <div>วันที่ {formatDate(ticket.created_at)}</div>
          </div>

          <div style={{ width: '45%', textAlign: 'center', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>ส่วนที่ ๕ สำหรับผู้ดำเนินการ</div>
            <div>ลงชื่อ............................................................</div>
            <div style={{ margin: '10px 0' }}>( {ticket.technician_name || '................................................'} )</div>
            <div>วันที่ {formatDate(ticket.resolved_at)}</div>
          </div>

        </div>

      </div>

      {/* 🟢 CSS สำหรับควบคุมการ Print ให้เป็น A4 🟢 */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .a4-paper { 
            box-shadow: none !important; 
            margin: 0 !important; 
            width: 100% !important; 
            height: 100% !important; 
            padding: 20mm !important; /* ระยะขอบกระดาษตอนพรินต์ */
          }
        }
      `}} />
    </div>
  );
}