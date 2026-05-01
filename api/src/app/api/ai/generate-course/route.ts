import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

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

function repairTruncatedJson(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
  }

  if (inString) {
    const lastQuote = trimmed.lastIndexOf('"');
    if (lastQuote > 0) {
      const beforeQuote = trimmed.substring(0, lastQuote).trimEnd();
      const trailingComma = beforeQuote.endsWith(',') ? beforeQuote.slice(0, -1).trimEnd() : beforeQuote;
      return trailingComma + '}'.repeat(Math.max(depth, 0));
    }
  }

  if (depth > 0) {
    return trimmed + '}'.repeat(depth);
  }

  return null;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
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
 * @param title - 课程名称
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
      age,
      duration,
      scale,
      title,
      vocabulary,
      grammar,
      skills,
      paths,
      theme,
      requirements,
      userId,
      organizationId
    } = body;

    console.log('[generate-course] 收到生成课件请求:', {
      title,
      age,
      duration,
      scale,
      theme
    });

    // 参数验证
    if (!title) {
      return NextResponse.json(
        { error: '缺少必要参数: title' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 构建 N8N 调用参数
    const n8nPayload = {
      age,
      duration,
      scale,
      title,
      vocabulary,
      grammar,
      skills: skills || [],
      paths: paths || [],
      theme,
      requirements,
      userId,
      organizationId,
      timestamp: Date.now()
    };

    console.log('[generate-course] 调用 N8N Workflow:', {
      workflow: 'course-generator',
      title
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
        const text = firstItem.text.trim();
        console.log('[generate-course] text长度:', text.length, '前100字符:', text.substring(0, 100));
        
        try {
          // 尝试直接解析
          courseData = JSON.parse(text);
          console.log('[generate-course] 直接解析text成功');
        } catch (e1) {
          // 如果直接解析失败，尝试修复并重新解析
          console.log('[generate-course] 直接解析失败，尝试修复JSON:', e1.message);
          try {
            // 修复常见的 JSON 格式问题：
            // 1. 单引号替换为双引号（仅在属性名和字符串值中）
            let fixedText = text;
            
            // 修复属性名中的单引号: 'name' -> "name"
            fixedText = fixedText.replace(/'([^']+)'\s*:/g, '"$1":');
            
            // 修复字符串值中的单引号: : 'value' -> : "value"
            // 使用更精确的正则来匹配字符串值
            fixedText = fixedText.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match, value) => {
              // 转义字符串中可能存在的特殊字符
              const escaped = value.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
              return `: "${escaped}"`;
            });
            
            courseData = JSON.parse(fixedText);
            console.log('[generate-course] 修复后解析成功');
          } catch (e2) {
            console.error('[generate-course] 修复后仍然解析失败:', e2.message);

            // 第三次尝试：修复截断的 JSON（AI 输出被 max_tokens 截断）
            try {
              const repaired = repairTruncatedJson(text);
              if (repaired) {
                courseData = JSON.parse(repaired);
                console.log('[generate-course] 截断修复成功');
              }
            } catch (e3) {
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
