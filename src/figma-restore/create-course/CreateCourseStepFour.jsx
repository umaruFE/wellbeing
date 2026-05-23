import React from 'react';
import { Form, Input, Radio, Upload } from 'antd';
import { Paperclip } from 'lucide-react';
import { atmosphereOptions } from './createCourseOptions';

const { TextArea } = Input;

export function CreateCourseStepFour() {
  return (
    <>
      <div className="fr-create-step-head">
        <div className="fr-create-step-title">添加个性魔法 <span>| Add Your Magic</span></div>
        <div className="fr-create-step-subtitle">可选，融入你的独特巧思与具体要求。</div>
      </div>

      <Form.Item label="特定要求 / 资源链接" name="specialRequirements">
        <TextArea
          rows={4}
          placeholder="例如：我希望融入一个关于“分享”的小故事；请避免使用某类教具。"
        />
      </Form.Item>

      <Form.Item label="附件" name="attachments" valuePropName="fileList" getValueFromEvent={(event) => event?.fileList || []}>
        <Upload beforeUpload={() => false} multiple>
          <button type="button" className="fr-upload-btn">
            <Paperclip size={14} />
            添加附件
          </button>
        </Upload>
      </Form.Item>

      <Form.Item label="氛围偏好" name="atmosphere">
        <Radio.Group optionType="button" buttonStyle="solid">
          {atmosphereOptions.map(option => <Radio.Button key={option} value={option}>{option}</Radio.Button>)}
        </Radio.Group>
      </Form.Item>
    </>
  );
}
