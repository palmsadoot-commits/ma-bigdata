import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Spin } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

export default function ProjectSelection({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/api/projects')
      .then(res => setProjects(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '50px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2}>🚀 ยินดีต้อนรับเข้าสู่ระบบ LIMS</Title>
        <Text strong type="secondary">กรุณาเลือกโปรเจกต์ที่คุณต้องการจัดการในขณะนี้</Text>
      </div>
      
      <Row gutter={[24, 24]} justify="center">
        {projects.map(project => (
          <Col xs={24} sm={12} md={8} lg={6} key={project.project_id}>
            <Card 
              hoverable 
              className="project-card"
              style={{ textAlign: 'center', borderRadius: 15, border: '2px solid #eee' }}
              onClick={() => onSelect(project)}
            >
              <RocketOutlined style={{ fontSize: 40, color: '#ef8157', marginBottom: 15 }} />
              <Title level={4}>{project.project_name}</Title>
              <Text type="secondary">{project.description || 'ไม่มีรายละเอียด'}</Text>
              <br /><br />
              <Button type="primary" block style={{ backgroundColor: '#2a1a4a' }}>
                เข้าสู่โปรเจกต์
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}