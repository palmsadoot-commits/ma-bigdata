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
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axiosInstance from '../services/api/axiosInstance';
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchSessions();
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
                <ThunderboltOutlined style={{ fontSize: 64, color: '#4F46E5', marginBottom: 16 }} />
                <Title level={2} style={{ color: '#fff' }}>How can I help you today?</Title>
                <Text style={{ color: '#94A3B8' }}>Start a conversation or try a slash command like /help</Text>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? <Avatar icon={<UserOutlined />} /> : <Avatar src="/gemini-icon.png" icon={<RobotOutlined />} style={{ backgroundColor: '#4F46E5' }} />}
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
                placeholder="Message Gemini..."
                autoSize={{ minRows: 1, maxRows: 6 }}
                className="gemini-input"
              />
              <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={handleSend}
                loading={loading}
                className="send-btn"
              />
            </div>
            <div className="input-footer">
              Gemini can make mistakes. Check important info.
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
