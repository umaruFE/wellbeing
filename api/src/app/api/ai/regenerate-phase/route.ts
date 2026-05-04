import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phaseKey,
      title,
      age,
      duration,
      scale,
      vocabulary,
      grammar,
      skills,
      paths,
      theme,
      requirements,
      currentCourseData,
      userId,
      organizationId
    } = body;

    console.log('[regenerate-phase] 收到请求:', { phaseKey, title });

    if (!phaseKey || !title) {
      return NextResponse.json(
        { error: '缺少必要参数: phaseKey, title' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const validPhases = ['engage', 'empower', 'execute', 'elevate'];
    if (!validPhases.includes(phaseKey)) {
      return NextResponse.json(
        { error: `无效的 phaseKey: ${phaseKey}` },
        { status: 400, headers: corsHeaders() }
      );
    }

    const n8nPayload = {
      phaseKey,
      title,
      age: age || '7-9岁',
      duration: duration || '60分钟',
      scale: scale || '≤ 8人',
      vocabulary: vocabulary || [],
      grammar: grammar || [],
      skills: skills || [],
      paths: paths || [],
      theme: theme || '',
      requirements: requirements || '',
      currentCourseData: currentCourseData || null,
      userId,
      organizationId,
      timestamp: Date.now()
    };

    console.log('[regenerate-phase] 调用 N8N:', { workflow: 'course-phase-regenerator', phaseKey });

    const result = await n8nClient.call('course-phase-regenerator', n8nPayload, { timeout: 300000 });

    console.log('[regenerate-phase] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

    let steps = null;

    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];

      if (firstItem?.text && typeof firstItem.text === 'string') {
        const text = firstItem.text.trim();
        try {
          const parsed = JSON.parse(text);
          steps = parsed.steps || parsed;
          console.log('[regenerate-phase] 解析成功, steps数量:', Array.isArray(steps) ? steps.length : '非数组');
        } catch (e: any) {
          console.error('[regenerate-phase] JSON解析失败:', e.message);
          let fixedText = text;
          fixedText = fixedText.replace(/'([^']+)'\s*:/g, '"$1":');
          fixedText = fixedText.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match: string, value: string) => {
            const escaped = value.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
            return `: "${escaped}"`;
          });
          try {
            const parsed = JSON.parse(fixedText);
            steps = parsed.steps || parsed;
          } catch (e2: any) {
            console.error('[regenerate-phase] 修复后仍失败:', e2.message);
          }
        }
      } else if (firstItem?.steps) {
        steps = firstItem.steps;
      }
    }

    if (steps && Array.isArray(steps)) {
      return NextResponse.json({
        success: true,
        data: {
          phaseKey,
          steps,
          message: `${phaseKey} 阶段重新生成完成`
        }
      }, { headers: corsHeaders() });
    }

    return NextResponse.json({
      success: false,
      error: '未能获取阶段数据'
    }, { status: 500, headers: corsHeaders() });

  } catch (error) {
    console.error('[regenerate-phase] 失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '阶段重新生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
