import React, { useState } from 'react';
import {
  Clock,
  ChevronRight,
  Upload,
  Wand2,
  User,
  Library,
  Tags,
  BrainCircuit,
  Sparkles,
  FileInput,
  BookOpen,
  Layers
} from 'lucide-react';
import { CURRICULUM_DATA } from '../constants';

export const WelcomeScreen = ({ onStart }) => {
  const [step, setStep] = useState('input'); // input, generating
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');

  const [config, setConfig] = useState({
    grade: '小学三年级',
    age: '8-9岁 (三年级/G3)',
    unit: 'Unit 3: Animals (神奇的动物)',
    duration: '40分钟',
    theme: '星际救援冒险',
    sourceText: '',
    keywords: '',
    isCustomUnit: false,
    customUnit: '',
    // 知识库选择
    selectedKnowledgeItem: null
  });

  const availableUnits = CURRICULUM_DATA[config.age] || [];

  // 模拟知识库数据
  const knowledgeBaseItems = [
    {
      id: 'textbook-1',
      name: '人教版',
      type: '人教版',
      children: [
        {
          id: 'grade-3',
          name: '三年级英语',
          grade: '三年级',
          children: [
            { id: 'unit-3-1', name: 'Unit 3: Animals (神奇的动物)', unit: 'Unit 3: Animals', keywords: ['Red', 'Blue', 'Yellow', 'Animals'], rating: 4.9, copies: 89 },
            { id: 'unit-3-2', name: 'Unit 1: Welcome Back (欢迎回来)', unit: 'Unit 1: Welcome Back', keywords: ['Hello', 'Welcome', 'Friends'], rating: 4.7, copies: 56 },
          ]
        },
        {
          id: 'grade-4',
          name: '四年级英语',
          grade: '四年级',
          children: [
            { id: 'unit-4-1', name: 'Unit 1: My Classroom (我的教室)', unit: 'Unit 1: My Classroom', keywords: ['Classroom', 'Desk', 'Chair'], rating: 4.8, copies: 72 },
          ]
        },
      ]
    },
    {
      id: 'textbook-2',
      name: '外研版',
      type: '外研版',
      children: [
        {
          id: 'grade-3-wy',
          name: '三年级英语',
          grade: '三年级',
          children: [
            { id: 'unit-wy-1', name: 'Module 1: Introduction (介绍)', unit: 'Module 1: Introduction', keywords: ['I am', 'I have', 'Good'], rating: 4.6, copies: 45 },
          ]
        },
      ]
    },
  ];

  // 获取所有单元选项（AI教材 + 知识库）
  const getAllUnitOptions = () => {
    const options = [];

    // 添加 AI 教材单元
    if (availableUnits.length > 0) {
      options.push({ type: 'header', label: 'AI 教材' });
      availableUnits.forEach(unit => {
        options.push({ type: 'ai', value: unit, label: unit });
      });
    }

    // 添加知识库单元
    if (knowledgeBaseItems.length > 0) {
      options.push({ type: 'header', label: '知识库教材' });
      knowledgeBaseItems.forEach(textbook => {
        if (textbook.children) {
          textbook.children.forEach(grade => {
            if (grade.children) {
              grade.children.forEach(unit => {
                options.push({
                  type: 'knowledge',
                  value: JSON.stringify({
                    id: unit.id,
                    name: unit.name,
                    textbook: textbook.name,
                    grade: grade.name,
                    unit: unit.unit,
                    keywords: unit.keywords
                  }),
                  label: `${grade.name} - ${unit.name}`
                });
              });
            }
          });
        }
      });
    }

    return options;
  };

  const allUnitOptions = getAllUnitOptions();

  const handleAgeChange = (e) => {
    const newAge = e.target.value;
    const newUnits = CURRICULUM_DATA[newAge] || [];
    setConfig({
      ...config,
      age: newAge,
      unit: newUnits.length > 0 ? newUnits[0] : '',
      isCustomUnit: false,
      customUnit: ''
    });
  };

  const handleUnitChange = (e) => {
    const value = e.target.value;
    if (value === 'custom_input_option') {
      setConfig({ ...config, isCustomUnit: true, unit: '' });
    } else {
      setConfig({ ...config, isCustomUnit: false, unit: value });
    }
  };

  // --- Mock Import Logic ---
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStep('generating');
      setLoadingText('正在解析上传的文档内容...');
      const stages = [
        { p: 10, t: '正在读取文档结构...' },
        { p: 30, t: '识别教学目标与重难点...' },
        { p: 50, t: '提取 Engage, Empower, Execute, Elevate 流程...' },
        { p: 70, t: '自动匹配多媒体素材占位符...' },
        { p: 90, t: '生成课程数据结构...' },
        { p: 100, t: '导入成功！' }
      ];

      let currentStage = 0;
      const interval = setInterval(() => {
        if (currentStage >= stages.length) {
          clearInterval(interval);
          onStart({ ...config, unit: file.name.replace(/\.[^/.]+$/, "") });
          return;
        }
        setLoadingProgress(stages[currentStage].p);
        setLoadingText(stages[currentStage].t);
        currentStage++;
      }, 500);
    }
  };

  const handleGenerate = () => {
    setStep('generating');

    const stages = [
      { p: 10, t: `正在加载 ${config.age} 认知心理学模型...` },
      { p: 30, t: `正在分析 核心知识点图谱...` },
      { p: 50, t: 'AI 引擎正在设计"最近发展区(ZPD)"教学支架...' },
      { p: 70, t: '正在生成多模态(Visual-Auditory)教学素材...' },
      { p: 90, t: '正在进行教育学原理一致性校验...' },
      { p: 100, t: '课件组装完成！' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage >= stages.length) {
        clearInterval(interval);
        onStart(config);
        return;
      }
      setLoadingProgress(stages[currentStage].p);
      setLoadingText(stages[currentStage].t);
      currentStage++;
    }, 800);
  };

  if (step === 'generating') {
    return (
      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center text-white p-8 h-screen w-full absolute inset-0 z-50">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-4 border-t-blue-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-2xl font-bold">{loadingProgress}%</span>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold animate-pulse text-blue-200">AI 正在深度思考...</h2>
            <p className="text-slate-400 text-lg flex items-center justify-center gap-2">
              <BrainCircuit className="w-4 h-4" /> {loadingText}
            </p>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-4 h-screen w-full absolute inset-0 z-50">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        {/* 顶部标题 */}
        <div
          style={{ background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(67, 56, 202))' }}
          className="p-6 md:p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                 <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-300" />
                 AI 教育课件大师
               </h1>
               <p className="text-blue-100 opacity-90 text-sm md:text-base">基于年龄发展阶段的智能课程设计引擎</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* AI 生成模式 */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <User className="w-3 h-3" /> 学生年龄 / Age
                  </label>
                  <div className="relative">
                    <select
                      value={config.age}
                      onChange={handleAgeChange}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-sm"
                    >
                      {Object.keys(CURRICULUM_DATA).map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Library className="w-3 h-3" />
                    {parseInt(config.age) < 6 ? "核心主题 / Theme" : "教材单元 / Unit"}
                  </label>
                  {!config.isCustomUnit ? (
                    <div className="relative">
                      <select
                        value={config.unit}
                        onChange={handleUnitChange}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-sm"
                      >
                        {allUnitOptions.map((option, index) => {
                          if (option.type === 'header') {
                            return (
                              <option key={index} disabled className="font-bold bg-slate-100 text-slate-600">
                                ── {option.label} ──
                              </option>
                            );
                          }
                          return (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          );
                        })}
                        <option value="custom_input_option">✎ 手动输入其他...</option>
                      </select>
                      <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                        <ChevronRight className="w-3 h-3 rotate-90" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                      <input
                        type="text"
                        value={config.customUnit}
                        onChange={(e) => setConfig({...config, customUnit: e.target.value})}
                        placeholder="请输入自定义单元名称..."
                        className="flex-1 p-2.5 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => setConfig({...config, isCustomUnit: false, unit: allUnitOptions[0]?.value || ''})}
                        className="px-2 text-slate-400 hover:text-slate-600 text-xs whitespace-nowrap"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Clock className="w-3 h-3" /> 上课时长 / Duration
                  </label>
                  <div className="relative">
                    <select
                      value={config.duration}
                      onChange={(e) => setConfig({...config, duration: e.target.value})}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm"
                    >
                      <option>15分钟 (微课/学前)</option>
                      <option>30分钟 (标准课时)</option>
                      <option>40分钟 (小学常用)</option>
                      <option>45分钟 (公开课)</option>
                      <option>60分钟 (综合实践)</option>
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Wand2 className="w-3 h-3" />
                      剧情主题 / Story Theme
                    </label>
                    <input
                      type="text"
                      value={config.theme}
                      onChange={(e) => setConfig({...config, theme: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="例如：星际救援、海底探险"
                    />
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Tags className="w-3 h-3" />
                    重点关键词 / Key Words (可选)
                  </label>
                  <input
                    type="text"
                    value={config.keywords}
                    onChange={(e) => setConfig({...config, keywords: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="例如：Red, Blue, Yellow"
                  />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  style={{ background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(79, 70, 229))' }}
                  className="w-full py-3 text-white rounded-xl font-bold text-base shadow-md transform transition hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  开始生成
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};
