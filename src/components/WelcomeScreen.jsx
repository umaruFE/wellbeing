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
  Layers,
  Search,
  ChevronDown,
  Copy,
  Star,
  Users,
  FolderOpen,
  Book
} from 'lucide-react';
import { CURRICULUM_DATA } from '../constants';

export const WelcomeScreen = ({ onStart }) => {
  const [step, setStep] = useState('input'); // input, generating
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const [sourceMode, setSourceMode] = useState('ai'); // ai, knowledge

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

  const [expandedItems, setExpandedItems] = useState([]);
  const [selectedKBItem, setSelectedKBItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (id) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectKBItem = (item) => {
    setSelectedKBItem(item);
    setConfig({
      ...config,
      selectedKnowledgeItem: item
    });
  };

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

  const handleKnowledgeBaseGenerate = () => {
    if (!selectedKBItem) return;

    setStep('generating');

    const stages = [
      { p: 10, t: `正在加载知识库教材数据...` },
      { p: 30, t: `正在分析 ${selectedKBItem.name} 课程结构...` },
      { p: 50, t: 'AI 引擎正在设计教学支架...' },
      { p: 70, t: '正在生成多媒体教学素材...' },
      { p: 90, t: '正在进行教育学原理校验...' },
      { p: 100, t: '课件组装完成！' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage >= stages.length) {
        clearInterval(interval);
        onStart({
          ...config,
          unit: selectedKBItem.unit,
          theme: selectedKBItem.keywords?.join(', ') || ''
        });
        return;
      }
      setLoadingProgress(stages[currentStage].p);
      setLoadingText(stages[currentStage].t);
      currentStage++;
    }, 800);
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
            {/* 来源切换 */}
            <div className="flex bg-white/10 backdrop-blur rounded-lg p-1">
              <button
                onClick={() => setSourceMode('ai')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  sourceMode === 'ai' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                AI 生成
              </button>
              <button
                onClick={() => setSourceMode('knowledge')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  sourceMode === 'knowledge' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-2" />
                知识库选择
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {sourceMode === 'ai' ? (
            /* AI 生成模式 */
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
                        {availableUnits.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                        <option disabled>──────────</option>
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
                        onClick={() => setConfig({...config, isCustomUnit: false, unit: availableUnits[0]})}
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
          ) : (
            /* 知识库选择模式 */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧 - 知识库树 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    选择教材单元
                  </h3>
                </div>
                <div className="p-4">
                  {/* 搜索框 */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜索教材、年级、单元..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>

                  {/* 教材树 */}
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {knowledgeBaseItems.map(item => (
                      <div key={item.id}>
                        {/* 教材层级 */}
                        <div
                          className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-slate-50 rounded-lg"
                        >
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="p-0.5 hover:bg-slate-200 rounded"
                          >
                            <ChevronRight
                              className={`w-4 h-4 text-slate-400 transition-transform ${expandedItems.includes(item.id) ? 'rotate-90' : ''}`}
                            />
                          </button>
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-slate-700">{item.name}</span>
                        </div>

                        {/* 年级层级 */}
                        {expandedItems.includes(item.id) && item.children?.map(grade => (
                          <div key={grade.id} className="ml-6">
                            <div
                              className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-slate-50 rounded-lg"
                            >
                              <button
                                onClick={() => toggleExpand(grade.id)}
                                className="p-0.5 hover:bg-slate-200 rounded"
                              >
                                <ChevronRight
                                  className={`w-4 h-4 text-slate-400 transition-transform ${expandedItems.includes(grade.id) ? 'rotate-90' : ''}`}
                                />
                              </button>
                              <FolderOpen className="w-4 h-4 text-orange-600" />
                              <span className="text-slate-700">{grade.name}</span>
                            </div>

                            {/* 单元层级 */}
                            {expandedItems.includes(grade.id) && grade.children?.map(unit => (
                              <div key={unit.id} className="ml-12">
                                <div
                                  onClick={() => handleSelectKBItem(unit)}
                                  className={`flex items-center gap-2 py-2 px-3 cursor-pointer rounded-lg transition-colors ${
                                    selectedKBItem?.id === unit.id
                                      ? 'bg-blue-50 border-l-2 border-blue-600'
                                      : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <Book className="w-4 h-4 text-green-600" />
                                  <span className={`text-sm ${selectedKBItem?.id === unit.id ? 'text-blue-600 font-medium' : 'text-slate-600'}`}>
                                    {unit.name}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右侧 - 选中项详情 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Copy className="w-4 h-4 text-purple-600" />
                    课程预览
                  </h3>
                </div>
                <div className="p-4">
                  {selectedKBItem ? (
                    <div className="space-y-4">
                      {/* 选中单元信息 */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Book className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-slate-800">{selectedKBItem.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>评分: {selectedKBItem.rating}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Users className="w-4 h-4" />
                            <span>已复制: {selectedKBItem.copies} 次</span>
                          </div>
                        </div>
                      </div>

                      {/* 关键词 */}
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase mb-2 block">关键词</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedKBItem.keywords?.map((kw, idx) => (
                            <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 时长选择 */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                          <Clock className="w-3 h-3" /> 上课时长
                        </label>
                        <select
                          value={config.duration}
                          onChange={(e) => setConfig({...config, duration: e.target.value})}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                          <option>15分钟 (微课/学前)</option>
                          <option>30分钟 (标准课时)</option>
                          <option>40分钟 (小学常用)</option>
                          <option>45分钟 (公开课)</option>
                          <option>60分钟 (综合实践)</option>
                        </select>
                      </div>

                      <button
                        onClick={handleKnowledgeBaseGenerate}
                        disabled={!selectedKBItem}
                        style={{ background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(79, 70, 229))' }}
                        className="w-full py-3 text-white rounded-xl font-bold text-base shadow-md transform transition hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Copy className="w-5 h-5" />
                        复制并生成课程
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Layers className="w-16 h-16 text-slate-300 mb-4" />
                      <p className="text-slate-500 mb-2">请从左侧选择教材单元</p>
                      <p className="text-sm text-slate-400">选择后将自动填充课程信息</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 分割线 */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400">或者</span>
            </div>
          </div>

          {/* 上传文档 */}
          <div className="text-center">
            <label className="inline-flex items-center gap-2 px-6 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-slate-600 font-medium">上传文档自定义</span>
              <input type="file" className="hidden" onChange={handleImport} accept=".doc,.docx,.pdf,.txt" />
            </label>
            <p className="text-xs text-slate-400 mt-2">支持 .doc, .docx, .pdf, .txt 格式</p>
          </div>
        </div>
      </div>
    </div>
  );
};
