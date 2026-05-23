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
        <div>
          <div className="fr-create-step-title">设定课程起点 <span className="en">| Set the Course</span></div>
          <div className="fr-create-step-subtitle">明确本节课的语言“工具箱”与学员画像。</div>
        </div>
      </div>

      <Form.Item
        label={<span><span className="required">*</span>课程名称</span>}
        name="courseTitle"
        rules={[{ required: true, message: '请输入课程名称' }]}
        className="fr-create-form-item"
      >
        <Input 
          placeholder="请输入课程名称，如：动物主题英语课" 
        />
      </Form.Item>

      <div className="fr-create-three">
        <Form.Item 
          label={<span><span className="required">*</span>学生年龄</span>} 
          name="age" 
          rules={[{ required: true }]}
          className="fr-create-form-item"
        >
          <Radio.Group 
            optionType="button" 
            buttonStyle="solid"
            className="fr-create-radio-group"
          >
            {ageOptions.map(option => <Radio.Button key={option} value={option}>{option}</Radio.Button>)}
          </Radio.Group>
        </Form.Item>

        <Form.Item 
          label={<span><span className="required">*</span>课程时长</span>} 
          name="duration" 
          rules={[{ required: true }]}
          className="fr-create-form-item"
        >
          <Radio.Group 
            optionType="button" 
            buttonStyle="solid"
            className="fr-create-radio-group"
          >
            {durationOptions.map(option => <Radio.Button key={option} value={option}>{option}</Radio.Button>)}
          </Radio.Group>
        </Form.Item>

        <Form.Item 
          label={<span><span className="required">*</span>班级规模</span>} 
          name="classSize" 
          rules={[{ required: true }]}
          className="fr-create-form-item"
        >
          <Radio.Group 
            optionType="button" 
            buttonStyle="solid"
            className="fr-create-radio-group"
          >
            {classSizeOptions.map(option => <Radio.Button key={option} value={option}>{option}</Radio.Button>)}
          </Radio.Group>
        </Form.Item>
      </div>

      <div className="fr-create-two">
        <Form.Item
          label={<span><span className="required">*</span>核心词汇<span className="hint">（输入后按回车添加）</span></span>}
          name="vocabularies"
          className="fr-create-form-item"
        >
          <Select
            mode="tags"
            tokenSeparators={[',', '，', '、']}
            open={false}
            suffixIcon={null}
            placeholder="例如：happy, sad, angry, calm"
            className="fr-create-tag-select"
          />
        </Form.Item>

        <Form.Item
          label={<span><span className="required">*</span>语法/句型<span className="hint">（输入后按回车添加）</span></span>}
          name="grammars"
          className="fr-create-form-item"
        >
          <Select
            mode="tags"
            tokenSeparators={[',', '，', '、']}
            open={false}
            suffixIcon={null}
            placeholder="例如：I feel... because... / Can you...?"
            className="fr-create-tag-select"
          />
        </Form.Item>
      </div>

      <Form.Item 
        label={<span><span className="required">*</span>语言能力培养侧重<span className="hint">(可多选)</span></span>} 
        name="languageSkills"
        className="fr-create-form-item"
      >
        <Checkbox.Group 
          options={languageSkillOptions}
          className="fr-create-checkbox-group"
        />
      </Form.Item>
    </>
  );
}
