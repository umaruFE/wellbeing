import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { LocalizedText } from '../../i18n/LocalizedText.jsx';
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

const ButtonSection = () => (
  <div>
    <Card title={i18next.t('designPreviewUi.b183425946')} style={{ marginBottom: '24px' }}>
      <Space wrap size="large">
        <Button type="primary"><LocalizedText id="designPreviewUi.a717dbf25d" /></Button>
        <Button><LocalizedText id="designPreviewUi.8c10e392e6" /></Button>
        <Button type="dashed"><LocalizedText id="designPreviewUi.01fc2f0311" /></Button>
        <Button type="text"><LocalizedText id="designPreviewUi.55dadd529e" /></Button>
        <Button type="link"><LocalizedText id="designPreviewUi.21ef0d3c43" /></Button>
      </Space>
    </Card>
    <Card title={i18next.t('designPreviewUi.92de483abd')} style={{ marginBottom: '24px' }}>
      <Space wrap size="large">
        <Button type="primary" disabled><LocalizedText id="designPreviewUi.aa585f15f9" /></Button>
        <Button type="primary" loading><LocalizedText id="designPreviewUi.97c94c0379" /></Button>
        <Button type="primary" danger><LocalizedText id="designPreviewUi.a7683be8fc" /></Button>
        <Button type="primary" ghost><LocalizedText id="designPreviewUi.7b8a62b2bd" /></Button>
      </Space>
    </Card>
    <Card title={i18next.t('designPreviewUi.c90f6cbde2')}>
      <Space wrap size="large">
        <Button type="primary" size="small"><LocalizedText id="designPreviewUi.3f7a4839ad" /></Button>
        <Button type="primary"><LocalizedText id="designPreviewUi.8c10e392e6" /></Button>
        <Button type="primary" size="large"><LocalizedText id="designPreviewUi.dcff60aba4" /></Button>
      </Space>
    </Card>
  </div>
);

const InputSection = () => {
  const { t } = useTranslation();
  return (
  <div>
    <Card title={i18next.t('designPreviewUi.02be516690')} style={{ marginBottom: '24px' }}>
      <Space wrap direction="vertical" size="large" style={{ width: '100%' }}>
        <Input placeholder={i18next.t('designPreviewUi.925d12fcf5')} />
        <Input placeholder={i18next.t('designPreviewUi.2b1e18be2c')} prefix={<Search />} />
        <Input placeholder={i18next.t('designPreviewUi.647b6cb64e')} disabled />
        <Input status="error" style={{ width: '300px' }} placeholder={i18next.t('designPreviewUi.dcce897a21')} />
        <Input.Password placeholder={i18next.t('designPreviewUi.da6354658f')} />
        <Input.TextArea placeholder={i18next.t('designPreviewUi.e706de41c0')} rows={4} />
      </Space>
    </Card>
    <Card title={i18next.t('designPreviewUi.4dec36f623')} style={{ marginBottom: '24px' }}>
      <Space wrap direction="vertical" size="large" style={{ width: '100%' }}>
        <Segmented
          options={[t('designPreviewUi.courseOpt'), t('designPreviewUi.be8da62ea1'), t('designPreviewUi.fa4e33b698'), t('designPreviewUi.461189f186')]}
          defaultValue={t('designPreviewUi.courseOpt')}
        />
        <Segmented
          options={[t('designPreviewUi.55bde061f7'), t('designPreviewUi.b9b05bc39c'), t('designPreviewUi.811b73f195')]}
          disabled
        />
        <Segmented
          options={[
            { label: t('designPreviewUi.apple'), value: 'apple' },
            { label: t('designPreviewUi.banana'), value: 'banana' },
            { label: t('designPreviewUi.orange'), value: 'orange' },
          ]}
          block
        />
        <Segmented
          options={[
            {
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpen size={14} />
                  <span><LocalizedText id="sidebar.courseGroup" /></span>
                </span>
              ),
              value: 'courses',
            },
            {
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Image size={14} />
                  <span><LocalizedText id="designPreviewUi.be8da62ea1" /></span>
                </span>
              ),
              value: 'images',
            },
            {
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Video size={14} />
                  <span><LocalizedText id="designPreviewUi.fa4e33b698" /></span>
                </span>
              ),
              value: 'videos',
            },
            {
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Music size={14} />
                  <span><LocalizedText id="designPreviewUi.461189f186" /></span>
                </span>
              ),
              value: 'audio',
            },
          ]}
          defaultValue="courses"
        />
      </Space>
    </Card>
    <Card title={i18next.t('designPreviewUi.5da56aba3c')} style={{ marginBottom: '24px' }}>
      <Space wrap size="large">
        <Select placeholder={i18next.t('designPreviewUi.382f4b5559')} style={{ width: 200 }}>
          <Option value="1"><LocalizedText id="designPreviewUi.55bde061f7" /></Option>
          <Option value="2"><LocalizedText id="designPreviewUi.b9b05bc39c" /></Option>
          <Option value="3"><LocalizedText id="designPreviewUi.811b73f195" /></Option>
        </Select>
        <Select placeholder={i18next.t('designPreviewUi.647b6cb64e')} style={{ width: 200 }} disabled />
      </Space>
    </Card>
    <Card title={i18next.t('designPreviewUi.152c276e77')}>
      <Space wrap size="large">
        <Switch defaultChecked />
        <Switch disabled />
        <Checkbox><LocalizedText id="designPreviewUi.8fd2b13003" /></Checkbox>
        <Checkbox defaultChecked><LocalizedText id="designPreviewUi.eff6856452" /></Checkbox>
        <Checkbox disabled><LocalizedText id="designPreviewUi.647b6cb64e" /></Checkbox>
        <Radio.Group defaultValue="a">
          <Radio value="a"><LocalizedText id="designPreviewUi.8bc0d03fa0" /></Radio>
          <Radio value="b"><LocalizedText id="designPreviewUi.1a90ff04c8" /></Radio>
          <Radio value="c"><LocalizedText id="designPreviewUi.24397c029d" /></Radio>
        </Radio.Group>
      </Space>
    </Card>
  </div>
  );
};

const DataSection = () => {
  const { t } = useTranslation();
  const columns = [
    { title: t('designPreviewUi.colName'), dataIndex: 'name', key: 'name' },
    { title: t('designPreviewUi.colAge'), dataIndex: 'age', key: 'age' },
    { title: t('designPreviewUi.colRole'), dataIndex: 'role', key: 'role' },
    { title: t('common.status'), dataIndex: 'status', key: 'status' },
    { title: t('common.action'), key: 'action' },
  ];
  const data = [
    { key: '1', name: t('designPreviewUi.demoName1'), age: 28, role: t('designPreviewUi.demoRoleAdmin'), status: t('designPreviewUi.demoStatusOnline') },
    { key: '2', name: t('designPreviewUi.demoName2'), age: 32, role: t('designPreviewUi.demoRoleEditor'), status: t('designPreviewUi.demoStatusOffline') },
    { key: '3', name: t('designPreviewUi.demoName3'), age: 25, role: t('designPreviewUi.demoRoleCreator'), status: t('designPreviewUi.demoStatusOnline') },
    { key: '4', name: t('designPreviewUi.demoName4'), age: 30, role: t('designPreviewUi.demoRoleReviewer'), status: t('designPreviewUi.demoStatusOnline') },
  ];
  return (
  <div>
    <Card title={i18next.t('designPreviewUi.150074c2e8')} style={{ marginBottom: '24px' }}>
      <Table columns={columns} dataSource={data} pagination={false} />
    </Card>
    <Card title={i18next.t('designPreviewUi.46b64b21f0')} style={{ marginBottom: '24px' }}>
      <Space wrap size="large">
        <Card title={i18next.t('designPreviewUi.02e8f124bf')} style={{ width: 300 }}>
          <p><LocalizedText id="designPreviewUi.cac86bc139" /></p>
        </Card>
        <Card title={i18next.t('designPreviewUi.0f2f01bbfb')} bordered style={{ width: 300 }}>
          <p><LocalizedText id="designPreviewUi.d3d4063646" /></p>
        </Card>
        <Card hoverable style={{ width: 300 }}>
          <p><LocalizedText id="designPreviewUi.aa63c14e7a" /></p>
        </Card>
      </Space>
    </Card>
    <Card title={i18next.t('designPreviewUi.5abebc8251')}>
      <Space wrap direction="vertical" size="large" style={{ width: '100%' }}>
        <Progress percent={30} />
        <Progress percent={60} status="active" />
        <Progress percent={100} status="success" />
        <Slider defaultValue={30} />
      </Space>
    </Card>
  </div>
  );
};

const FeedbackSection = () => {
  const { t } = useTranslation();
  return (
  <div>
    <Card title={i18next.t('designPreviewUi.f9307b88a7')} style={{ marginBottom: '24px' }}>
      <Space wrap direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert message={t('designPreviewUi.alertSuccess')} type="success" showIcon />
        <Alert message={t('designPreviewUi.alertInfo')} type="info" showIcon />
        <Alert message={t('designPreviewUi.f9307b88a7')} type="warning" showIcon />
        <Alert message={t('designPreviewUi.alertError')} type="error" showIcon />
      </Space>
    </Card>
    <Card title={i18next.t('designPreviewUi.1ba3dd280f')} style={{ marginBottom: '24px' }}>
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
    <Card title={i18next.t('common.tags')}>
      <Space wrap size="large">
        <Tag><LocalizedText id="designPreviewUi.c15d13af2b" /></Tag>
        <Tag color="primary"><LocalizedText id="designPreviewUi.811a9daeaf" /></Tag>
        <Tag color="success"><LocalizedText id="designPreviewUi.ddf4251683" /></Tag>
        <Tag color="warning"><LocalizedText id="designPreviewUi.20147143d5" /></Tag>
        <Tag color="error"><LocalizedText id="designPreviewUi.5f2cb9c822" /></Tag>
        <Tag closable><LocalizedText id="designPreviewUi.0605728f25" /></Tag>
      </Space>
    </Card>
  </div>
  );
};

const NavigationSection = () => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <div>
      <Card title={i18next.t('designPreviewUi.4ceeeb31a5')} style={{ marginBottom: '24px' }}>
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
      <Card title={i18next.t('designPreviewUi.4d46c2d2cb')} style={{ marginBottom: '24px' }}>
        <Space wrap size="large">
          <Button type="primary" onClick={() => setModalVisible(true)}>
            <LocalizedText id="designPreviewUi.26f6dd6431" />
          </Button>
          <Popconfirm title={i18next.t('designPreviewUi.3bd03de46a')} okText={i18next.t('common.ok')} cancelText={i18next.t('common.cancel')}>
            <Button danger><LocalizedText id="designPreviewUi.7060002cc4" /></Button>
          </Popconfirm>
          <Tooltip title={i18next.t('designPreviewUi.4918a6d2bf')}>
            <Button><LocalizedText id="designPreviewUi.b52f3b1566" /></Button>
          </Tooltip>
        </Space>
      </Card>
      <Card title={i18next.t('designPreviewUi.ad8595eece')}>
        <Divider><LocalizedText id="designPreviewUi.0190bba4fd" /></Divider>
        <Divider />
        <Divider orientation="left"><LocalizedText id="designPreviewUi.2eb177d259" /></Divider>
      </Card>
      <Modal
        title={i18next.t('designPreviewUi.eb30c948f5')}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setModalVisible(false)}><LocalizedText id="common.cancel" /></Button>,
          <Button key="submit" type="primary" onClick={() => setModalVisible(false)}><LocalizedText id="common.ok" /></Button>,
        ]}
      >
        <p><LocalizedText id="designPreviewUi.55ce5a56d9" /></p>
        <Input placeholder={i18next.t('designPreviewUi.ac962cb9a6')} style={{ marginTop: '16px' }} />
      </Modal>
    </div>
  );
};

const DesignSystemPreview = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('buttons');

  const tabs = [
    { key: 'buttons', label: t('designPreviewUi.tabButtons'), children: <ButtonSection /> },
    { key: 'inputs', label: t('designPreviewUi.tabInputs'), children: <InputSection /> },
    { key: 'data', label: t('designPreviewUi.tabData'), children: <DataSection /> },
    { key: 'feedback', label: t('designPreviewUi.tabFeedback'), children: <FeedbackSection /> },
    { key: 'navigation', label: t('designPreviewUi.tabNavigation'), children: <NavigationSection /> },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}><LocalizedText id="designPreviewUi.f65a9064cb" /></h1>
        <p style={{ color: '#818997' }}><LocalizedText id="designPreviewUi.c1fbbb88fd" /></p>
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
