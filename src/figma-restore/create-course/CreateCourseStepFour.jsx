import React from 'react';
import { Form, Input, Radio } from 'antd';
import { atmosphereOptions } from './createCourseOptions';

const { TextArea } = Input;

export function CreateCourseStepFour() {
  return (
    <>
      <div className="fr-create-step-head">
        <div>
          <div className="fr-create-step-title">添加个性魔法 <span className="en">| Add Your Magic</span></div>
          <div className="fr-create-step-subtitle">（可选）融入你的独特巧思与具体要求。</div>
        </div>
      </div>

      <Form.Item label="特定要求/资源链接" name="specialRequirements" className="fr-magic-requirements">
        <TextArea
          rows={4}
          placeholder={'"我希望融入一个关于‘分享’的小故事";"必须将附件中的绘本故事《The Color Monster》作为某个环节的输入内容";"请避免使用某类教具"'}
        />
      </Form.Item>

      <Form.Item label="氛围偏好（可选，不选则由 AI 自动匹配）" name="atmosphere" className="fr-magic-atmosphere">
        <Radio.Group optionType="button" buttonStyle="solid" className="fr-create-radio-group">
          {atmosphereOptions.map(option => <Radio.Button key={option} value={option}>{option}</Radio.Button>)}
        </Radio.Group>
      </Form.Item>
    </>
  );
}
