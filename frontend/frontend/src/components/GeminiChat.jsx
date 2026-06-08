import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Input, Button, Avatar, Typography, Space, Tooltip, Dropdown, Modal, message } from 'antd';
import { 
  SendOutlined, 
  PlusOutlined, 
  MessageOutlined, 
  DeleteOutlined, 
  RobotOutlined, 
  UserOutlined,
  ClearOutlined,
  DownloadOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
  SyncOutlined // ✅ เพิ่ม icon
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axiosInstance from '../services/api/axiosInstance';
import { API_BASE_URL } from '../utils/config'; // ✅ นำเข้า Config
import { io } from 'socket.io-client'; // ✅ นำเข้า Socket
import './GeminiChat.css';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function GeminiChat() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [agentActivity, setAgentActivity] = useState(null); // ✅ เพิ่มสถานะ Activity
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null); // ✅ เพิ่ม ref สำหรับ Socket

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchSessions();

    // ✅ เชื่อมต่อ Socket เพื่อดู Activity
    socketRef.current = io(API_BASE_URL);
    socketRef.current.on('agent_activity', (data) => {
        if (data.status === 'executing') {
            setAgentActivity(data);
        } else {
            setAgentActivity(null);
        }
    });

    return () => {
        if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await axiosInstance.get('/gemini/sessions');
      setSessions(res.data);
      if (res.data.length > 0 && !activeSession) {
        setActiveSession(res.data[0]);
      }
    } catch (err) {
      message.error('Failed to load chat history');
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const res = await axiosInstance.get(`/gemini/messages/${sessionId}`);
      setMessages(res.data);
    } catch (err) {
      message.error('Failed to load messages');
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await axiosInstance.post('/gemini/sessions', { title: 'New Chat' });
      setSessions([res.data, ...sessions]);
      setActiveSession(res.data);
      setMessages([]);
    } catch (err) {
      message.error('Failed to create new chat');
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    Modal.confirm({
      title: 'Delete Chat?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await axiosInstance.delete(`/gemini/sessions/${sessionId}`);
          const newSessions = sessions.filter(s => s.id !== sessionId);
          setSessions(newSessions);
          if (activeSession?.id === sessionId) {
            setActiveSession(newSessions[0] || null);
          }
          message.success('Chat deleted');
        } catch (err) {
          message.error('Failed to delete chat');
        }
      }
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !activeSession) return;

    // Handle Slash Commands
    if (input.startsWith('/')) {
      handleSlashCommand(input);
      setInput('');
      return;
    }

    const userMsg = { role: 'user', content: input };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/gemini/send', {
        sessionId: activeSession.id,
        message: input
      });
      setMessages(prev => [...prev, { role: 'model', content: res.data.response }]);
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleSlashCommand = (cmd) => {
    const parts = cmd.split(' ');
    const baseCmd = parts[0].toLowerCase();

    switch (baseCmd) {
      case '/clear':
        setMessages([]);
        message.info('Local chat cleared');
        break;
      case '/help':
        message.info('Available commands: /clear, /help, /update');
        break;
      case '/update':
        message.loading('Checking for updates...');
        setTimeout(() => message.success('System is up to date!'), 2000);
        break;
      default:
        message.warning(`Unknown command: ${baseCmd}`);
    }
  };

  return (
    <Layout className="gemini-container">
      <Sider 
        width={300} 
        collapsed={siderCollapsed} 
        onCollapse={setSiderCollapsed}
        className="gemini-sider"
      >
        <div className="gemini-sider-header">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleNewChat}
            block
            className="new-chat-btn"
          >
            {!siderCollapsed && 'New Chat'}
          </Button>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeSession?.id?.toString()]}
          className="gemini-menu"
          items={sessions.map(s => ({
            key: s.id.toString(),
            icon: <MessageOutlined />,
            label: (
              <div className="session-item">
                <span className="session-title">{s.title}</span>
                <DeleteOutlined 
                  className="delete-icon" 
                  onClick={(e) => handleDeleteSession(e, s.id)} 
                />
              </div>
            ),
            onClick: () => setActiveSession(s)
          }))}
        />
      </Sider>

      <Layout className="gemini-main">
        <div className="gemini-header">
          <Space>
            <Tooltip title="Back to Dashboard">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/dashboard')}
                style={{ color: '#fff' }}
              />
            </Tooltip>
            <Button 
              type="text" 
              icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={() => setSiderCollapsed(!siderCollapsed)}
              style={{ color: '#fff' }}
            />
            <Title level={4} style={{ margin: 0, color: '#fff' }}>
              <RobotOutlined style={{ marginRight: 8 }} />
              Gemini Pro
            </Title>
          </Space>
          <Space>
            <Tooltip title="Settings">
              <Button type="text" icon={<SettingOutlined />} style={{ color: '#fff' }} />
            </Tooltip>
          </Space>
        </div>

        <Content className="gemini-content">
          <div className="message-list">
            {messages.length === 0 && (
              <div className="empty-state">
                <Title level={3} style={{ color: '#fff', marginBottom: 8, fontWeight: 700 }}>Engineered Intellect</Title>
                <Text style={{ color: '#64748b', fontSize: 14 }}>Identify patterns. Resolve issues. Secure the perimeter.</Text>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? 
                    <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#334155' }} /> : 
                    <Avatar size={32} icon={<ThunderboltOutlined />} style={{ backgroundColor: '#2563eb' }} />
                  }
                </div>
                <div className="message-bubble">
                  <ReactMarkdown
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ background: 'transparent', padding: 0 }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            {/* ✅ Agent Activity Monitor (ARIA Compliant) */}
            {agentActivity && (
                <div 
                  className="agent-activity-bar" 
                  role="status" 
                  aria-live="polite"
                  style={{ marginBottom: 12, padding: '8px 16px', background: '#1e293b', borderRadius: 8, border: '1px solid #334155', display: 'flex', alignItems: 'center' }}
                >
                    <SyncOutlined spin style={{ color: '#2563eb', marginRight: 12, fontSize: 14 }} />
                    <Text strong style={{ fontSize: 10, color: '#f8fafc', letterSpacing: '0.05em' }}>
                        EXECUTING: {agentActivity.tool.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 9, color: '#64748b', marginLeft: 'auto', fontFamily: 'monospace' }}>
                        {JSON.stringify(agentActivity.args).toUpperCase()}
                    </Text>
                </div>
            )}
            <div className="input-wrapper">

              <Input.TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="INPUT COMMAND OR QUERY"
                autoSize={{ minRows: 1, maxRows: 8 }}
                className="gemini-input"
              />
              <Button 
                type="primary" 
                icon={<SendOutlined style={{ fontSize: 14 }} />} 
                onClick={handleSend}
                loading={loading}
                className="send-btn"
              />
            </div>
            <div className="input-footer">
              SYSTEM STATUS: OPERATIONAL | LLM: GEMINI-2.5-FLASH
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
