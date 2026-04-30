import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layout,
  BookOpen,
  FileCheck,
  MessageSquare,
  Check
} from 'lucide-react';

const colors = {
  neutral: {
    white: '#FFFFFF',
    text: {
      1: '#333E4E',
      2: '#575F6E',
      3: '#818997',
      disabled: '#A4ABB8',
    },
    border: {
      DEFAULT: '#E6E3DE',
      secondary: '#EFECE8',
    },
    bg: {
      layout: '#F7F5F1',
    },
  },
  brand: {
    DEFAULT: '#F4785E',
    light: '#FDECE8',
  },
};

export const steps = [
  { id: 1, label: '课程概览', icon: Layout },
  { id: 2, label: '教案设计', icon: BookOpen },
  { id: 3, label: 'PPT 课件', icon: FileCheck },
  { id: 4, label: '阅读材料', icon: MessageSquare },
];

// 步骤导航项组件
const StepItem = ({ step, isActive, isCompleted, onClick }) => {
  const Icon = step.icon;
  return (
    <button onClick={() => onClick(step.id)} className="flex items-center gap-2 cursor-pointer">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
        style={{
          backgroundColor: isActive ? colors.brand.DEFAULT : (isCompleted ? colors.brand.light : colors.neutral.white),
          border: isCompleted || isActive ? 'none' : `1.5px solid ${colors.neutral.border.DEFAULT}`,
          color: isActive ? '#FFF' : (isCompleted ? colors.brand.DEFAULT : colors.neutral.text.disabled),
        }}
      >
        {isCompleted ? <Check size={14} strokeWidth={3} /> : (isActive ? <Icon size={14} /> : <span className="text-xs font-bold">{step.id}</span>)}
      </div>
      <span
        className="text-[13px] font-bold tracking-wide"
        style={{ color: isActive || isCompleted ? colors.neutral.text[1] : colors.neutral.text.disabled }}
      >
        {step.label}
      </span>
    </button>
  );
};

/**
 * CourseStepNavigation - 课程步骤导航栏组件
 *
 * @param {Object} props
 * @param {string} props.courseId - 课程ID
 * @param {number} props.currentStep - 当前步骤 (1-4)
 * @param {React.ReactNode} props.title - 左侧标题区域的自定义内容（可选）
 * @param {React.ReactNode} props.actions - 右侧操作区域的自定义内容（可选）
 */
export const CourseStepNavigation = ({
  courseId,
  currentStep,
  title,
  actions
}) => {
  const navigate = useNavigate();

  const handleStepClick = (stepId) => {
    if (!courseId || stepId === currentStep) return;

    switch (stepId) {
      case 1:
        navigate(`/courses/${courseId}/overview`);
        break;
      case 2:
        navigate(`/courses/${courseId}/lesson-plan`);
        break;
      case 3:
        navigate(`/courses/${courseId}/ppt`);
        break;
      case 4:
        navigate(`/courses/${courseId}/reading`);
        break;
      default:
        break;
    }
  };

  return (
    <header className="h-[72px] bg-white rounded-2xl flex items-center justify-between px-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      {/* 左侧区域 */}
      <div className="flex-1 flex items-center gap-3">
        {title}
      </div>

      {/* 中间导航 */}
      <nav className="flex items-center justify-center flex-1 shrink-0">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <StepItem
              step={step}
              isActive={currentStep === step.id}
              isCompleted={step.id < currentStep}
              onClick={handleStepClick}
            />
            {index < steps.length - 1 && (
              <div className="w-10 h-px mx-3" style={{ backgroundColor: colors.neutral.border.secondary }}></div>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* 右侧操作区域 */}
      <div className="flex items-center justify-end gap-3 flex-1">
        {actions}
      </div>
    </header>
  );
};

export default CourseStepNavigation;
