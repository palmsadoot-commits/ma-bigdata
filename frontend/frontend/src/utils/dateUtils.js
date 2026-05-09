// ไฟล์: src/utils/dateUtils.js

/**
 * ฟังก์ชันจัดรูปแบบวันที่ภาษาไทย
 * @param {string|Date} dateString - ข้อมูลวันที่ที่ต้องการแปลง
 * @param {Object} options - ตัวเลือกการแสดงผล
 * @param {string} options.monthType - 'long' (เมษายน) หรือ 'short' (เม.ย.)
 * @param {string} options.yearType - 'numeric' (2569) หรือ '2-digit' (69)
 * @param {boolean} options.showTime - true (แสดงเวลา) หรือ false (ซ่อนเวลา)
 */
export const formatThaiDate = (dateString, options = {}) => {
  if (!dateString) return '-';
  const date = new Date(dateString);

  // ตั้งค่า Default: เดือนเต็ม, พ.ศ.เต็ม, แสดงเวลา
  const {
    monthType = 'long',   
    yearType = 'numeric', 
    showTime = true       
  } = options;

  const formatOptions = {
    day: 'numeric',
    month: monthType,
    year: yearType,
  };

  // ถ้าต้องการให้แสดงเวลาด้วย
  if (showTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
    formatOptions.second = '2-digit';
  }

  // แปลงเป็นภาษาไทยและลบคำว่า " เวลา" ที่ระบบมักจะใส่มาให้อัตโนมัติออก
  return date.toLocaleDateString('th-TH', formatOptions).replace(' เวลา', '');
};