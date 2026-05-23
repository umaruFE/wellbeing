import React from 'react';
import { Button, Form, Input } from 'antd';
import { CheckCircle2, Lightbulb } from 'lucide-react';

const { TextArea } = Input;

export function CreateCourseStepTwo({ canPolish, onApplyIdea, onPolish }) {
  return (
    <>
      <div className="fr-create-step-head">
        <div className="fr-create-step-title">构思情境任务 <span>| Design the Adventure</span></div>
        <div className="fr-create-step-subtitle">设计一个需要用到语言工具箱的有趣故事和挑战。</div>
      </div>

      <div className="fr-create-ai-row">
        <div>需要从零开始时获取 AI 创意灵感；已经有想法时，可让 AI 基于当前内容润色表达。</div>
        <div className="fr-create-ai-actions">
          <Button icon={<Lightbulb size={16} />} onClick={onApplyIdea}>获取 AI 创意灵感</Button>
          <Button icon={<CheckCircle2 size={16} />} onClick={onPolish} disabled={!canPolish}>AI 润色当前内容</Button>
        </div>
      </div>

      <Form.Item
        label="任务名称"
        name="taskName"
        rules={[{ required: true, message: '请输入任务名称' }]}
      >
        <Input placeholder="给你的奇遇起一个吸引人的名字吧" autoComplete="off" />
      </Form.Item>

      <Form.Item
        label="故事情境"
        name="storyContext"
        rules={[{ required: true, message: '请输入故事情境' }]}
      >
        <TextArea rows={5} placeholder="用一两句话设定一个有趣的场景和挑战，可包含角色、场景、问题和关键任务。" />
      </Form.Item>

      <Form.Item
        label="终极产出 / 作品"
        name="keyOutcome"
        rules={[{ required: true, message: '请输入终极产出或作品' }]}
      >
        <TextArea rows={3} placeholder="例如：每个小组将创作并表演一段 60 秒的情绪天气广播剧。" />
      </Form.Item>
    </>
  );
}
