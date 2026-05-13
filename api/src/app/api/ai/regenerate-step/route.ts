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
      stepId,
      title,
      age,
      duration,
      scale,
      vocabulary,
      grammar,
      theme,
      requirements,
      currentStep,
      siblingSteps,
      otherPhases,
      userId,
      organizationId
    } = body;

    console.log('[regenerate-step] 收到请求:', { phaseKey, stepId, title });

    if (!phaseKey || !stepId || !title) {
      return NextResponse.json(
        { error: '缺少必要参数: phaseKey, stepId, title' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const n8nPayload = {
      phaseKey,
      stepId,
      title,
      age: age || '7-9岁',
      duration: duration || '60分钟',
      scale: scale || '≤ 8人',
      vocabulary: vocabulary || [],
      grammar: grammar || [],
      theme: theme || '',
      requirements: requirements || '',
      currentStep: currentStep || null,
      siblingSteps: siblingSteps || [],
      otherPhases: otherPhases || null,
      userId,
      organizationId,
      timestamp: Date.now()
    };

    console.log('[regenerate-step] 调用 N8N:', { workflow: 'course-step-regenerator', stepId });

    const result = await n8nClient.call('course-step-regenerator', n8nPayload, { timeout: 300000 });

    console.log('[regenerate-step] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

    let step = null;

    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];

      if (firstItem?.text && typeof firstItem.text === 'string') {
        const text = firstItem.text.trim();
        try {
          const parsed = JSON.parse(text);
          step = parsed.step || parsed;
          console.log('[regenerate-step] 解析成功');
        } catch (e: any) {
          console.error('[regenerate-step] JSON解析失败:', e.message);
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
            console.error('[regenerate-step] 修复后仍失败:', e2.message);
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
          stepId,
          step,
          message: '步骤重新生成完成'
        }
      }, { headers: corsHeaders() });
    }

    return NextResponse.json({
      success: false,
      error: '未能重新生成步骤'
    }, { status: 500, headers: corsHeaders() });

  } catch (error) {
    console.error('[regenerate-step] 失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '步骤重新生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
