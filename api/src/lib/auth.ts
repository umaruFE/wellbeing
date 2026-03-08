import { NextRequest, NextResponse } from 'next/server';
import { db } from './db';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  name: string;
  organizationId: string | null;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function verifyToken(token: string): Promise<AuthResult> {
  try {
    if (!token || !token.startsWith('pg_token_')) {
      return { success: false, error: '无效的token格式' };
    }

    const tokenParts = token.split('_');
    if (tokenParts.length < 3) {
      return { success: false, error: '无效的token格式' };
    }

    const tokenHash = tokenParts.slice(2).join('_');

    const { data: users } = await db
      .from('users')
      .select('*')
      .eq('token_hash', tokenHash)
      .limit(1);

    if (!users || users.length === 0) {
      return { success: false, error: 'Token无效或已过期' };
    }

    const user = users[0];
    return {
      success: true,
      user: {
        id: user.id,
        username: user.email || user.name,
        role: user.role || 'viewer',
        name: user.name || user.email,
        organizationId: user.organization_id,
      },
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: 'Token验证失败' };
  }
}

export async function authenticate(request: NextRequest): Promise<AuthResult> {
  const token = extractToken(request);
  if (!token) {
    return { success: false, error: '未提供认证token' };
  }

  return verifyToken(token);
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticate(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      );
    }

    return handler(request, authResult.user!);
  };
}

export function requireRoles(allowedRoles: string[]) {
  return function (handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const authResult = await authenticate(request);

      if (!authResult.success) {
        return NextResponse.json(
          { error: authResult.error || '认证失败' },
          { status: 401 }
        );
      }

      if (!allowedRoles.includes(authResult.user!.role)) {
        return NextResponse.json(
          { error: '权限不足' },
          { status: 403 }
        );
      }

      return handler(request, authResult.user!);
    };
  };
}
