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
      existingStepCount,
      currentSteps,
      currentStep,
      siblingSteps,
      otherPhases,
      insertIndex,
      prevStep,
      nextStep,
      userId,
      organizationId
    } = body;

    const isRegenerate = !!stepId;

    console.log('[generate-step] 收到请求:', { phaseKey, title, mode: isRegenerate ? 'regenerate' : 'generate', stepId });

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

    let workflowName: string;
    let n8nPayload: Record<string, unknown>;

    if (isRegenerate) {
      workflowName = 'course-step-regenerator';
      n8nPayload = {
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
    } else {
      workflowName = 'course-step-generator';
      n8nPayload = {
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
    }

    console.log('[generate-step] 调用 N8N:', { workflow: workflowName, phaseKey });

    const result = await n8nClient.call(workflowName, n8nPayload, { timeout: 300000 });

    console.log('[generate-step] N8N 响应:', result === null ? '(空响应)' : JSON.stringify(result, null, 2).substring(0, 500));

    // N8N 返回空响应：通常是工作流内部出错（responseNode 模式下未到达 Respond 节点）
    if (result === null || result === undefined) {
      console.error('[generate-step] N8N 返回空响应，工作流可能执行失败');
      return NextResponse.json({
        success: false,
        error: 'N8N 工作流未返回数据（可能执行失败或超时），请到 N8N 后台查看 Executions 排查',
        workflow: workflowName,
        phaseKey,
        stepId: isRegenerate ? stepId : undefined
      }, { status: 502, headers: corsHeaders() });
    }

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
      } else if (firstItem?.json?.step) {
        step = firstItem.json.step;
      }
    } else if (result?.step) {
      // 某些情况下 N8N 直接返回对象而非数组
      step = result.step;
    } else if (result?.data?.step) {
      step = result.data.step;
    }

    if (step) {
      return NextResponse.json({
        success: true,
        data: {
          phaseKey,
          ...(isRegenerate ? { stepId } : {}),
          step,
          message: isRegenerate ? '步骤重新生成完成' : '新环节生成完成'
        }
      }, { headers: corsHeaders() });
    }

    console.error('[generate-step] 无法从 N8N 响应中提取 step:', JSON.stringify(result).substring(0, 300));
    return NextResponse.json({
      success: false,
      error: 'N8N 返回了数据但格式无法识别',
      workflow: workflowName,
      responsePreview: JSON.stringify(result).substring(0, 500)
    }, { status: 502, headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-step] 失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '环节生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
