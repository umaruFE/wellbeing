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
      theme,
      requirements,
      existingStepCount,
      currentSteps,
      otherPhases,
      insertIndex,
      prevStep,
      nextStep,
      userId,
      organizationId
    } = body;

    console.log('[generate-step] 收到请求:', { phaseKey, title, existingStepCount });

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
      theme: theme || '',
      requirements: requirements || '',
      existingStepCount: existingStepCount || 0,
      currentSteps: currentSteps || [],
      otherPhases: otherPhases || null,
      insertIndex: insertIndex != null ? insertIndex : (existingStepCount || 0),
      prevStep: prevStep || null,
      nextStep: nextStep || null,
      userId,
      organizationId,
      timestamp: Date.now()
    };

    console.log('[generate-step] 调用 N8N:', { workflow: 'course-step-generator', phaseKey });

    const result = await n8nClient.call('course-step-generator', n8nPayload, { timeout: 300000 });

    console.log('[generate-step] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

    let step = null;

    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];

      if (firstItem?.text && typeof firstItem.text === 'string') {
        const text = firstItem.text.trim();
        try {
          const parsed = JSON.parse(text);
          step = parsed.step || parsed;
          console.log('[generate-step] 解析成功');
        } catch (e: any) {
          console.error('[generate-step] JSON解析失败:', e.message);
          let fixedText = text;
          fixedText = fixedText.replace(/'([^']+)'\s*:/g, '"$1":');
          fixedText = fixedText.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match: string, value: string) => {
            const escaped = value.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
            return `: "${escaped}"`;
          });
          try {
            const parsed = JSON.parse(fixedText);
            step = parsed.step || parsed;
          } catch (e2: any) {
            console.error('[generate-step] 修复后仍失败:', e2.message);
          }
        }
      } else if (firstItem?.step) {
        step = firstItem.step;
      }
    }

    if (step) {
      return NextResponse.json({
        success: true,
        data: {
          phaseKey,
          step,
          message: '新环节生成完成'
        }
      }, { headers: corsHeaders() });
    }

    return NextResponse.json({
      success: false,
      error: '未能生成环节数据'
    }, { status: 500, headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-step] 失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '环节生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
