import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spin, Typography } from 'antd';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const { Text } = Typography;

export default function LoginSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const userDataStr = params.get('user');

        if (token && userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                userData.token = token; // รวม token เข้ากับก้อน user data

                // เรียกใช้ login จาก AuthContext เพื่อเก็บลง LocalStorage/State
                login(userData);

                const fullName = `${userData.first_name} ${userData.last_name || ''}`;
                
                Swal.fire({
                    icon: 'success',
                    title: 'เข้าสู่ระบบสำเร็จ',
                    text: `ยินดีต้อนรับคุณ ${fullName}`,
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                });

                // พาไปยังหน้าแรก หรือ หน้า Onboarding
                setTimeout(() => {
                    if (userData.requires_onboarding) {
                        navigate('/onboarding');
                    } else {
                        navigate('/');
                    }
                }, 800);

            } catch (err) {
                console.error('Parse user data error:', err);
                navigate('/login?error=invalid_data');
            }
        } else {
            navigate('/login?error=missing_token');
        }
    }, [location, login, navigate]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f4f7f6' }}>
            <Spin size="large" />
            <Text strong style={{ marginTop: 20, fontSize: 16 }}>กำลังพาสถานะการเชื่อมต่อ LINE เข้าสู่ระบบ...</Text>
            <Text type="secondary">กรุณารอสักครู่ ระบบกำลังจัดเตรียมข้อมูลของคุณ</Text>
        </div>
    );
}
