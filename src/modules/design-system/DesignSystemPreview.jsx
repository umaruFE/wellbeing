import React, { useState } from 'react';
import { ConfigProvider } from 'antd';
import {
  Button,
  Input,
  Select,
  Card,
  Table,
  Tabs,
  Badge,
  Switch,
  Checkbox,
  Radio,
  Slider,
  Progress,
  Avatar,
  Tag,
  Space,
  Divider,
  Alert,
  Modal,
  Popconfirm,
  Tooltip,
  Segmented,
} from 'antd';
import {
  User,
  Bell,
  Search,
  Image,
  Video,
  Music,
  BookOpen,
} from 'lucide-react';
import { appAntdTheme } from '../../theme/buildAntdTheme';

const { Option } = Select;

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '年龄', dataIndex: 'age', key: 'age' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' },
];

const data = [
  { key: '1', name: '张三', age: 28, role: '管理员', status: '在线' },
  { key: '2', name: '李四', age: 32, role: '编辑', status: '离线' },
  { key: '3', name: '王五', age: 25, role: '创作者', status: '在线' },
  { key: '4', name: '赵六', age: 30, role: '审核员', status: '在线' },
];

const ButtonSection = () => (
  <div>
    <Card title="按钮类型" style={{ marginBottom: '24px' }}>
      <Space wrap size="large">
        <Button type="primary">主要按钮</Button>
        <Button>默认按钮</Button>
        <Button type="dashed">虚线按钮</Button>
        <Button type="text">文字按钮</Button>
        <Button type="link">链接按钮</Button>
      </Space>
    </Card>
    <Card title="按钮状态" style={{ marginBottom: '24px' }}>
      <Space wrap size="large">
        <Button type="primary" disabled>禁用按钮</Button>
        <Button type="primary" loading>加载按钮</Button>
        <Button type="primary" danger>危险按钮</Button>
        <Button type="primary" ghost>幽灵按钮</Button>
      </Space>
    </Card>
    <Card title="按钮尺寸">
      <Space wrap size="large">
        <Button type="primary" size="small">小号按钮</Button>
        <Button type="primary">默认按钮</Button>
        <Button type="primary" size="large">大号按钮</Button>
      </Space>
    </Card>
  </div>
);

const InputSection = () => (
  <div>
    <Card title="输入框" style={{ marginBottom: '24px' }}>
      <Space wrap direction="vertical" size="large" style={{ width: '100%' }}>
        <Input placeholder="普通输入框" />
        <Input placeholder="带图标的输入框" prefix={<Search />} />
        <Input placeholder="禁用状态" disabled />
        <Input status="error" style={{ width: '300px' }} placeholder="错误状态" />
        <Input.Password placeholder="密码输入框" />
        <Input.TextArea placeholder="多行文本框" rows={4} />
      </Space>
    </Card>
    <Card title="分段选择器" style={{ marginBottom: '24px' }}>
      <Space wrap direction="vertical" size="large" style={{ width: '100%' }}>
        <Segmented
          options={['课程', '图片', '视频', '音频']}
          defaultValue="课程"
        />
        <Segmented
          options={['选项一', '选项二', '选项三']}
          disabled
        />
        <Segmented
          options={[
            { label: '苹果', value: 'apple' },
            { label: '香蕉', value: 'banana' },
            { label: '橙子', value: 'orange' },
          ]}
          block
        />
        <Segmented
          options={[
            {
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpen size={14} />
                  <span>课程</span>
                </span>
              ),
              value: 'courses',
            },
            {
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Image size={14} />
                  <span>图片</span>
                </span>
              ),
              value: 'images',
            },
            {
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Video size={14} />
                  <span>视频</span>
                </span>
              ),
              value: 'videos',
            },
            {
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Music size={14} />
                  <span>音频</span>
                </span>
              ),
              value: 'audio',
            },
          ]}
          defaultValue="courses"
        />
      </Space>
    </Card>
    <Card title="选择器" style={{ marginBottom: '24px' }}>
      <Space wrap size="large">
        <Select placeholder="请选择" style={{ width: 200 }}>
          <Option value="1">选项一</Option>
          <Option value="2">选项二</Option>
          <Option value="3">选项三</Option>
        </Select>
        <Select placeholder="禁用状态" style={{ width: 200 }} disabled />
      </Space>
    </Card>
    <Card title="开关与选择">
      <Space wrap size="large">
        <Switch defaultChecked />
        <Switch disabled />
        <Checkbox>复选框</Checkbox>
        <Checkbox defaultChecked>选中状态</Checkbox>
        <Checkbox disabled>禁用状态</Checkbox>
        <Radio.Group defaultValue="a">
          <Radio value="a">选项 A</Radio>
          <Radio value="b">选项 B</Radio>
          <Radio value="c">选项 C</Radio>
        </Radio.Group>
      </Space>
    </Card>
  </div>
);

const DataSection = () => (
  <div>
    <Card title="表格" style={{ marginBottom: '24px' }}>
      <Table columns={columns} dataSource={data} pagination={false} />
    </Card>
    <Card title="卡片" style={{ marginBottom: '24px' }}>
      <Space wrap size="large">
        <Card title="普通卡片" style={{ width: 300 }}>
          <p>卡片内容区域</p>
        </Card>
        <Card title="带边框卡片" bordered style={{ width: 300 }}>
          <p>带边框的卡片</p>
        </Card>
        <Card hoverable style={{ width: 300 }}>
          <p>可悬浮卡片</p>
        </Card>
      </Space>
    </Card>
    <Card title="进度条与滑块">
      <Space wrap direction="vertical" size="large" style={{ width: '100%' }}>
        <Progress percent={30} />
        <Progress percent={60} status="active" />
        <Progress percent={100} status="success" />
        <Slider defaultValue={30} />
      </Space>
    </Card>
  </div>
);

const FeedbackSection = () => (
  <div>
    <Card title="警告提示" style={{ marginBottom: '24px' }}>
      <Space wrap direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert message="成功提示" type="success" showIcon />
        <Alert message="信息提示" type="info" showIcon />
        <Alert message="警告提示" type="warning" showIcon />
        <Alert message="错误提示" type="error" showIcon />
      </Space>
    </Card>
    <Card title="徽章" style={{ marginBottom: '24px' }}>
      <Space wrap size="large">
        <Badge count={5}>
          <Button shape="circle" icon={<Bell />} />
        </Badge>
        <Badge count={0} showZero>
          <Button shape="circle" icon={<Bell />} />
        </Badge>
        <Badge dot>
          <Button shape="circle" icon={<Bell />} />
        </Badge>
        <Badge count={100} overflowCount={99}>
          <Button shape="circle" icon={<Bell />} />
        </Badge>
      </Space>
    </Card>
    <Card title="标签">
      <Space wrap size="large">
        <Tag>普通标签</Tag>
        <Tag color="primary">主要标签</Tag>
        <Tag color="success">成功标签</Tag>
        <Tag color="warning">警告标签</Tag>
        <Tag color="error">错误标签</Tag>
        <Tag closable>可关闭标签</Tag>
      </Space>
    </Card>
  </div>
);

const NavigationSection = () => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <div>
      <Card title="头像" style={{ marginBottom: '24px' }}>
        <Space wrap size="large">
          <Avatar icon={<User />} />
          <Avatar size={64} icon={<User />} />
          <Avatar size="large" icon={<User />} />
          <Avatar.Group>
            <Avatar icon={<User />} />
            <Avatar icon={<User />} />
            <Avatar icon={<User />} />
          </Avatar.Group>
        </Space>
      </Card>
      <Card title="模态框与提示" style={{ marginBottom: '24px' }}>
        <Space wrap size="large">
          <Button type="primary" onClick={() => setModalVisible(true)}>
            打开模态框
          </Button>
          <Popconfirm title="确定删除吗？" okText="确定" cancelText="取消">
            <Button danger>删除操作</Button>
          </Popconfirm>
          <Tooltip title="这是一个提示">
            <Button>悬停提示</Button>
          </Tooltip>
        </Space>
      </Card>
      <Card title="分割线">
        <Divider>文字分割线</Divider>
        <Divider />
        <Divider orientation="left">左侧文字</Divider>
      </Card>
      <Modal
        title="模态框标题"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={() => setModalVisible(false)}>确定</Button>,
        ]}
      >
        <p>模态框内容区域</p>
        <Input placeholder="请输入内容" style={{ marginTop: '16px' }} />
      </Modal>
    </div>
  );
};

const DesignSystemPreview = () => {
  const [activeTab, setActiveTab] = useState('buttons');

  const tabs = [
    { key: 'buttons', label: '按钮', children: <ButtonSection /> },
    { key: 'inputs', label: '输入', children: <InputSection /> },
    { key: 'data', label: '数据展示', children: <DataSection /> },
    { key: 'feedback', label: '反馈', children: <FeedbackSection /> },
    { key: 'navigation', label: '导航', children: <NavigationSection /> },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>设计系统预览</h1>
        <p style={{ color: '#818997' }}>验证设计师定义的样式是否正确应用到组件</p>
      </div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
    </div>
  );
};

const DesignSystemPreviewWithTheme = () => {
  return (
    <ConfigProvider theme={appAntdTheme}>
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <DesignSystemPreview />
      </div>
    </ConfigProvider>
  );
};

export default DesignSystemPreviewWithTheme;
