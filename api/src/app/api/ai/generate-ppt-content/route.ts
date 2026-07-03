import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

const CJK_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function findCjk(value: unknown, path = 'presentation'): string | null {
  if (typeof value === 'string' && CJK_PATTERN.test(value)) return path;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findCjk(value[index], `${path}[${index}]`);
      if (found) return found;
    }
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const found = findCjk(child, `${path}.${key}`);
      if (found) return found;
    }
  }
  return null;
}

function unwrapResult(result: any) {
  const first = Array.isArray(result) ? result[0] : result;
  let value = first?.json || first;

  if (typeof value?.text === 'string') value = value.text;
  if (typeof value?.output === 'string') value = value.output;
  if (typeof value === 'string') {
    value = JSON.parse(
      value.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
    );
  }

  return value?.presentation
    ? value
    : value?.output?.presentation
      ? value.output
      : value;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lessonPlan = Array.isArray(body.lessonPlan) ? body.lessonPlan : [];
    const stepCount = lessonPlan
      .filter((phase: any) => phase?.key !== 'cover')
      .reduce((sum: number, phase: any) => sum + (Array.isArray(phase?.steps) ? phase.steps.length : 0), 0);

    if (!stepCount) {
      return NextResponse.json(
        { error: 'Lesson plan must contain at least one step.' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const workflow = process.env.N8N_PPT_CONTENT_WORKFLOW || 'ppt-content-generator';
    const result = await n8nClient.call(workflow, {
      courseMeta: body.courseMeta || {},
      courseTitle: body.courseTitle || '',
      lessonPlan,
      templateId: body.templateId || 'blue-business',
      totalSlides: Math.min(40, Math.max(stepCount + 1, Number(body.totalSlides) || stepCount * 2)),
      outputLanguage: 'English',
      timestamp: Date.now(),
    }, { timeout: 300000 });

    const data = unwrapResult(result);
    if (data?.error || data?.message) {
      throw new Error(
        typeof data.error === 'string'
          ? data.error
          : typeof data.message === 'string'
            ? data.message
            : 'The PPT workflow failed before returning slides.'
      );
    }
    const presentation = data?.presentation;

    if (!presentation || !Array.isArray(presentation.slides) || !presentation.slides.length) {
      throw new Error('The PPT workflow returned no slides.');
    }

    const cjkPath = findCjk(presentation);
    if (cjkPath) {
      throw new Error(`The PPT workflow returned non-English content at ${cjkPath}.`);
    }

    return NextResponse.json(
      { success: true, workflow, presentation },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('[generate-ppt-content] failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate PPT content.',
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
