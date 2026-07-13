import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';
import { normalizePhaseDurations } from '@/lib/course-normalize';

/**
 * N8N 课件生成路由
 *
 * 通过 N8N 调用 course-generator workflow 生成课件
 */

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function sanitizeAiJson(raw: string): string {
  const out: string[] = [];
  let inStr = false;
  let esc = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw.codePointAt(i) || 0;
    const c = String.fromCodePoint(ch);

    if (esc) {
      out.push(c);
      esc = false;
      continue;
    }

    if (c === '\\' && inStr) {
      out.push(c);
      esc = true;
      continue;
    }

    if (c === '"') {
      out.push('"');
      inStr = !inStr;
      continue;
    }

    if (inStr) {
      if (ch === 0x201C || ch === 0x201D) { out.push('\\', '"'); continue; }
      if (ch === 0x2018 || ch === 0x2019) { out.push("'"); continue; }
      if (ch === 0x300A || ch === 0x300B) { out.push('\\', '"'); continue; }
      if (ch === 10) { out.push('\\', 'n'); continue; }
      if (ch === 13) { continue; }
      if (ch === 9) { out.push('\\', 't'); continue; }
    } else {
      if (ch === 0x201C || ch === 0x201D || ch === 0x300A || ch === 0x300B) {
        out.push('"');
        inStr = !inStr;
        continue;
      }
    }

    out.push(c);
  }

  return out.join('');
}

function repairTruncatedJson(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 用栈追踪未闭合的 { 和 [，以便正确补全对应的闭合符号
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') stack.pop();
  }

  let base = trimmed;

  // 如果在字符串中间截断，需要找到最后一个完整值/键的边界
  if (inString) {
    // 找到最后一个未被截断的完整键值对的结尾
    // 策略：从末尾往前找，去掉不完整的字符串
    const lastCompleteQuote = (() => {
      // 倒序找最后一个在字符串外的结构字符
      let inStr = false;
      let esc = false;
      let lastStructEnd = -1;
      for (let i = 0; i < trimmed.length; i++) {
        const ch = trimmed[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (!inStr && (ch === ',' || ch === '{' || ch === '[' || ch === ':')) {
          lastStructEnd = i;
        }
      }
      return lastStructEnd;
    })();

    if (lastCompleteQuote >= 0) {
      // 截断到最后一个完整结构字符之后，去掉不完整的键值
      base = trimmed.substring(0, lastCompleteQuote + 1);
      // 重新计算栈
      stack.length = 0;
      inString = false;
      escape = false;
      for (let i = 0; i < base.length; i++) {
        const ch = base[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{' || ch === '[') stack.push(ch);
        else if (ch === '}' || ch === ']') stack.pop();
      }
    }
  }

  // 去掉末尾可能多余的逗号（对所有截断情况生效）
  base = base.replace(/,\s*$/, '');

  // 如果截断在 "key": 后面（值缺失），补一个 null
  base = base.replace(/:\s*$/, ': null');

  // 根据栈补全闭合符号
  const closers: string[] = [];
  while (stack.length) {
    const opener = stack.pop();
    closers.push(opener === '{' ? '}' : ']');
  }

  if (closers.length === 0) return null;
  return base + closers.join('');
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

function normalizeOutputLanguage(language?: string, outputLanguage?: string) {
  const value = `${outputLanguage || language || ''}`.toLowerCase();
  const isEnglish = value.includes('english') || value === 'en' || value.startsWith('en-');
  return {
    language: isEnglish ? 'en' : 'zh',
    outputLanguage: isEnglish ? 'English' : 'Chinese',
    isEnglish,
  };
}

function buildOverviewText(overview: any, isEnglish: boolean) {
  if (!overview) return '';

  if (isEnglish) {
    return [
      'Existing course overview is provided below. Generate the lesson plan strictly based on this overview, keeping the story context, learning goals, and output task fully consistent.',
      `Title: ${overview.courseTitle || ''}`,
      `Context: ${overview.overallContext || ''}`,
      `Language goals: vocabulary=${overview.languageGoals?.vocabulary || ''}, sentence patterns=${overview.languageGoals?.grammar || ''}`,
      `SEL goals: ${overview.selGoals || ''}`,
      `PERMA goals: ${overview.permaGoals || ''}`,
      `Output task: ${overview.finalTask || ''}`,
      `Image prompt: ${overview.themeImagePrompt || ''}`,
    ].join('\n');
  }

  return [
    '已有课程概览如下，请严格基于此概览生成教案，保持故事情境、教学目标、产出任务完全一致：',
    `标题：${overview.courseTitle || ''}`,
    `情境：${overview.overallContext || ''}`,
    `语言目标：词汇=${overview.languageGoals?.vocabulary || ''}，句型=${overview.languageGoals?.grammar || ''}`,
    `SEL目标：${overview.selGoals || ''}`,
    `PERMA目标：${overview.permaGoals || ''}`,
    `产出任务：${overview.finalTask || ''}`,
    `生图提示词：${overview.themeImagePrompt || ''}`,
  ].join('\n');
}

/**
 * POST /api/ai/generate-course
 *
 * 生成课件，通过 N8N Workflow 调用
 *
 * @param request.body
 * @param age - 学生年龄
 * @param duration - 课程时长
 * @param scale - 班级规模
 * @param vocabulary - 核心词汇
 * @param grammar - 语法/句型
 * @param skills - 语言能力培养侧重（数组）
 * @param paths - 主导核心体验路径（数组）
 * @param theme - 情境主题
 * @param requirements - 特定要求
 * @param userId - 用户ID
 * @param organizationId - 机构ID
 *
 * @returns
 * @success - 是否成功
 * @executionId - 执行ID
 * @status - 状态
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      courseTitle,
      age,
      duration,
      scale,
      vocabulary,
      grammar,
      skills,
      paths,
      theme,
      requirements,
      courseOverview,
      taskName,
      storyContext,
      keyOutcome,
      atmosphere,
      specialRequirements,
      language,
      outputLanguage,
      userId,
      organizationId
    } = body;

    console.log('[generate-course] 收到生成课件请求:', {
      age,
      duration,
      scale,
      theme
    });

    // 构建 N8N 调用参数
    let overview = courseOverview || null;
    if (overview && typeof overview === 'object' && overview.text) {
      try { overview = JSON.parse(overview.text); } catch {}
    }
    if (overview && overview.courseOverview) {
      overview = overview.courseOverview;
    }

    const languageConfig = normalizeOutputLanguage(language, outputLanguage);

    const n8nPayload = {
      language: languageConfig.language,
      outputLanguage: languageConfig.outputLanguage,
      age,
      duration,
      scale,
      title: courseTitle || theme || '未命名课程',
      courseTitle: courseTitle || '',
      vocabulary,
      grammar,
      skills: skills || [],
      paths: paths || [],
      theme,
      requirements: requirements || specialRequirements || '',
      taskName: taskName || '',
      storyContext: storyContext || '',
      keyOutcome: keyOutcome || '',
      atmosphere: atmosphere || '',
      specialRequirements: specialRequirements || '',
      course_overview: overview ? JSON.stringify(overview) : '',
      course_overview_text: buildOverviewText(overview, languageConfig.isEnglish),
      outputInstruction: languageConfig.isEnglish
        ? 'Generate all user-facing lesson plan content in English. Return structured JSON only. Do not include Chinese text unless it is explicitly provided as target language content by the user.'
        : '请用中文生成所有面向用户展示的教案内容，并返回结构化 JSON。',
      userId,
      organizationId,
      timestamp: Date.now()
    };

    console.log('[generate-course] 调用 N8N Workflow:', {
      workflow: 'course-generator',
      theme
    });

    // 调用 N8N Workflow（课件生成可能需要较长时间，设置5分钟超时）
    const result = await n8nClient.call('course-generator', n8nPayload, { timeout: 300000 });

    console.log('[generate-course] N8N 响应类型:', typeof result, Array.isArray(result) ? '(数组)' : '');
    console.log('[generate-course] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

    // N8N 返回格式: [{ "text": "{\"courseData\": {...}}" }]
    let courseData = null;

    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];
      console.log('[generate-course] firstItem:', firstItem);

      if (firstItem?.text && typeof firstItem.text === 'string') {
        let text = firstItem.text.trim();
        text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        console.log('[generate-course] text长度:', text.length, '前100字符:', text.substring(0, 100));
        
        let cleaned = sanitizeAiJson(text);
        console.log('[generate-course] cleaned前200字符:', cleaned.substring(0, 200));

        try {
          courseData = JSON.parse(cleaned);
          console.log('[generate-course] 直接解析text成功');
        } catch (e1: any) {
          const pos = parseInt(e1.message.match(/position\s+(\d+)/)?.[1] || '0');
          if (pos > 0) {
            console.log('[generate-course] 错误位置附近:', JSON.stringify(cleaned.substring(Math.max(0, pos - 50), pos + 50)));
          }
          console.log('[generate-course] 直接解析失败，尝试修复JSON:', e1.message);
          try {
            let fixedText = cleaned;
            
            fixedText = fixedText.replace(/'([^']+)'\s*:/g, '"$1":');
            fixedText = fixedText.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match: string, value: string) => {
              const escaped = value.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
              return `: "${escaped}"`;
            });
            
            courseData = JSON.parse(fixedText);
            console.log('[generate-course] 修复后解析成功');
          } catch (e2: any) {
            console.error('[generate-course] 修复后仍然解析失败:', e2.message);

            try {
              const repaired = repairTruncatedJson(cleaned);
              if (repaired) {
                courseData = JSON.parse(repaired);
                console.log('[generate-course] 截断修复成功');
              }
            } catch (e3: any) {
              console.error('[generate-course] 截断修复也失败:', e3.message);
            }
          }
        }
      } else if (typeof firstItem?.text === 'object') {
        // text 已经是对象了
        courseData = firstItem.text.courseData || firstItem.text;
        console.log('[generate-course] text已是对象');
      } else if (firstItem?.courseData) {
        courseData = firstItem.courseData;
        console.log('[generate-course] 从firstItem.courseData提取成功');
      }
    } else if (result?.courseData) {
      courseData = result.courseData;
      console.log('[generate-course] 从result.courseData提取成功');
    }

    console.log('[generate-course] 最终 courseData:', courseData ? '存在' : '不存在');

    if (courseData) {
      normalizePhaseDurations(courseData, duration);
      return NextResponse.json({
        success: true,
        data: {
          status: 'completed',
          courseData,
          message: '课件生成完成'
        }
      }, { headers: corsHeaders() });
    }

    return NextResponse.json({
      success: false,
      error: '未能获取课件数据'
    }, { status: 500, headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-course] 课件生成失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '课件生成失败',
        details: error instanceof Error ? error.stack : null,
        suggestion: '服务器可能正在启动中，请稍后重试'
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * GET /api/ai/generate-course
 *
 * 查询课件生成状态
 *
 * @param query.executionId - 执行ID
 *
 * @returns
 * @success - 是否成功
 * @executionId - 执行ID
 * @status - completed|processing|failed
 * @courseData - 课件数据（完成时）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { error: '缺少 executionId 参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('[generate-course] 查询执行状态:', executionId);

    // 调用 N8N API 查询执行状态
    const executionStatus = await n8nClient.pollExecution(executionId, {
      maxAttempts: 1,
      interval: 0
    });

    console.log('[generate-course] 执行状态:', executionStatus);

    if (executionStatus.status === 'completed') {
      console.log('[generate-course] 执行完成，获取课件数据...');

      try {
        // 调用 get-course webhook 获取课件数据
        const courseData = await n8nClient.call('get-course', { execution_id: executionId }, { method: 'GET' });
        console.log('[generate-course] 课件数据:', courseData);

        return NextResponse.json({
          success: true,
          data: {
            executionId: executionId,
            status: 'completed',
            courseData
          }
        }, { headers: corsHeaders() });

      } catch (error) {
        console.error('[generate-course] 获取课件数据失败:', error);
        return NextResponse.json({
          success: false,
          error: '获取课件数据失败',
          data: {
            executionId: executionId,
            status: 'failed'
          }
        }, { headers: corsHeaders() });
      }

    } else if (executionStatus.status === 'error') {
      return NextResponse.json({
        success: false,
        error: '执行失败',
        data: {
          executionId: executionId,
          status: 'failed'
        }
      }, { headers: corsHeaders() });

    } else {
      return NextResponse.json({
        success: true,
        data: {
          executionId: executionId,
          status: 'processing'
        }
      }, { headers: corsHeaders() });
    }

  } catch (error) {
    console.error('[generate-course] 查询执行状态失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '查询执行状态失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
