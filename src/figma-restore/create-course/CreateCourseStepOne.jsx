import React from 'react';
import { Checkbox, Form, Input, Radio, Select } from 'antd';
import {
  ageOptions,
  classSizeOptions,
  durationOptions,
  languageSkillOptions,
} from './createCourseOptions';

export function CreateCourseStepOne() {
  return (
    <>
      <div className="fr-create-step-head">
        <div className="fr-create-step-title">设定课程起点 <span>| Set the Course</span></div>
        <div className="fr-create-step-subtitle">明确本节课的语言工具箱与学员画像。</div>
      </div>

      <Form.Item
        label="课程名称"
        name="courseTitle"
        rules={[{ required: true, message: '请输入课程名称' }]}
      >
        <Input placeholder="例如：Unit 3: Animals（神奇的动物）" autoComplete="off" />
      </Form.Item>

      <div className="fr-create-three">
        <Form.Item label="学生年龄" name="age" rules={[{ required: true }]}>
          <Radio.Group optionType="button" buttonStyle="solid">
            {ageOptions.map(option => <Radio.Button key={option} value={option}>{option}</Radio.Button>)}
          </Radio.Group>
        </Form.Item>

        <Form.Item label="课程时长" name="duration" rules={[{ required: true }]}>
          <Radio.Group optionType="button" buttonStyle="solid">
            {durationOptions.map(option => <Radio.Button key={option} value={option}>{option}</Radio.Button>)}
          </Radio.Group>
        </Form.Item>

        <Form.Item label="班级规模" name="classSize" rules={[{ required: true }]}>
          <Radio.Group optionType="button" buttonStyle="solid">
            {classSizeOptions.map(option => <Radio.Button key={option} value={option}>{option}</Radio.Button>)}
          </Radio.Group>
        </Form.Item>
      </div>

      <div className="fr-create-two">
        <Form.Item
          label="核心词汇"
          name="vocabularies"
          tooltip="输入后按回车添加"
        >
          <Select mode="tags" open={false} placeholder="例如：happy, sad, angry, calm" tokenSeparators={[',', '，']} />
        </Form.Item>

        <Form.Item
          label="语法 / 句型"
          name="grammars"
          tooltip="输入后按回车添加"
        >
          <Select mode="tags" open={false} placeholder="例如：I feel... because... / Can you...?" tokenSeparators={[',', '，']} />
        </Form.Item>
      </div>

      <Form.Item label="语言能力培养侧重" name="languageSkills">
        <Checkbox.Group options={languageSkillOptions} />
      </Form.Item>
    </>
  );
}
