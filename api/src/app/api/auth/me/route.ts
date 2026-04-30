import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401, headers: corsHeaders() }
      );
    }

    return NextResponse.json({
      success: true,
      user: authResult.user
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[auth/me] 验证失败:', error);
    return NextResponse.json(
      { error: '认证失败' },
      { status: 401, headers: corsHeaders() }
    );
  }
}
