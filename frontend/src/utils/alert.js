import Swal from 'sweetalert2';

const PRIMARY_COLOR = '#2a1a4a'; 
const DANGER_COLOR = '#ef8157';  

// ✅ อัปเกรดฟังก์ชันนี้: ไม่ต้องกดปุ่มแล้ว ให้มันโหลด 1.5 วินาทีแล้วปิดเอง
export const alertSuccess = (title, text = '', timer = 1500) => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    showConfirmButton: false, // ซ่อนปุ่มตกลง
    timer: timer,             // ตั้งเวลาปิด
    timerProgressBar: true    // แสดงหลอดเวลาวิ่ง
  });
};

export const alertError = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonColor: DANGER_COLOR,
    confirmButtonText: 'ปิด'
  });
};

export const alertConfirm = (title, text = '') => {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: text,
    showCancelButton: true,
    confirmButtonColor: PRIMARY_COLOR,
    cancelButtonColor: '#d33',
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก'
  });
};