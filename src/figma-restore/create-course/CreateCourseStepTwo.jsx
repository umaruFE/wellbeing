import React from 'react';
import { Button, Form, Input } from 'antd';
import { Sparkles, Zap } from 'lucide-react';

const { TextArea } = Input;

export function CreateCourseStepTwo({ canPolish, onApplyIdea, onPolish }) {
  return (
    <>
      <div className="fr-create-step-head">
        <div>
          <div className="fr-create-step-title">构思情境任务 <span className="en">| Design the Adventure</span></div>
          <div className="fr-create-step-subtitle">设计一个需要用到这个“工具箱”的有趣故事和挑战。</div>
        </div>
      </div>

      <div className="fr-create-ai-row">
        <div>需要从零开始时获取 AI 创意灵感；已经有想法时，可让 AI 基于当前内容润色表达。</div>
        <div className="fr-create-ai-actions">
          <Button className="fr-create-ai-btn idea" icon={<Zap size={16} />} onClick={onApplyIdea}>获取AI创意灵感</Button>
          <Button className="fr-create-ai-btn polish" icon={<Sparkles size={16} />} onClick={onPolish} disabled={!canPolish}>AI润色当前内容</Button>
        </div>
      </div>

      <Form.Item
        label={<span><span className="required">*</span>任务名称</span>}
        name="taskName"
        rules={[{ required: true, message: '请输入任务名称' }]}
      >
        <Input
          placeholder="给你的奇遇起个吸引人的名字吧！（例如：森林星光音乐会策划案、情绪怪兽安抚行动）"
          autoComplete="off"
        />
      </Form.Item>

      <Form.Item
        label={<span><span className="required">*</span>故事情境</span>}
        name="storyContext"
        rules={[{ required: true, message: '请输入故事情境' }]}
      >
        <TextArea
          rows={4}
          placeholder="用一两句话设定一个有趣的场景和挑战。可按照【角色】-【场景】-【问题/需求】-【要做的关键事】的思路。例如：我们是“校园噪音调查员”，发现午休时走廊里总有一些让人心烦的噪音。我们的任务是找出这些噪音，并用安静又有创意的方式“改造”它们。"
        />
      </Form.Item>

      <Form.Item
        label={<span><span className="required">*</span>终极产出/作品</span>}
        name="keyOutcome"
        rules={[{ required: true, message: '请输入终极产出或作品' }]}
      >
        <TextArea
          rows={2}
          placeholder="可先粗写最终作品或展示成果，后续可在课程地图中继续调整。例如：每个小组将创作并表演一段30秒的“情绪天气广播剧”。"
        />
      </Form.Item>
    </>
  );
}
