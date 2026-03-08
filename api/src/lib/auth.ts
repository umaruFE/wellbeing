import { NextRequest, NextResponse } from 'next/server';
import { db } from './db';
import crypto from 'crypto';

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

// 简单的JWT风格token（不依赖数据库存储）
// token格式: pg_token_{userId}_{timestamp}_{signature}
const SECRET_KEY = process.env.JWT_SECRET || 'wellbeing-secret-key-2024';

export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// 生成token（包含用户信息和签名）
export function generateToken(user: AuthUser): string {
  const timestamp = Date.now();
  const data = `${user.id}:${user.role}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('hex')
    .substring(0, 32);
  
  const token = `pg_token_${Buffer.from(JSON.stringify({
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    organizationId: user.organizationId,
    timestamp,
    signature
  })).toString('base64')}`;
  
  console.log('Token生成, 用户:', user.name);
  return token;
}

// 验证token
export function verifyToken(token: string): AuthResult {
  try {
    if (!token || !token.startsWith('pg_token_')) {
      console.log('Token格式无效');
      return { success: false, error: '无效的token格式' };
    }

    // 解析token
    const payloadBase64 = token.substring(9); // 去掉 'pg_token_'
    const payloadStr = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadStr);

    // 验证签名
    const data = `${payload.id}:${payload.role}:${payload.timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(data)
      .digest('hex')
      .substring(0, 32);

    if (payload.signature !== expectedSignature) {
      console.log('Token签名无效');
      return { success: false, error: 'Token无效或已过期' };
    }

    // 检查token是否过期（7天）
    const tokenAge = Date.now() - payload.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
    if (tokenAge > maxAge) {
      console.log('Token已过期');
      return { success: false, error: 'Token已过期' };
    }

    console.log('Token验证成功, 用户:', payload.name);
    return {
      success: true,
      user: {
        id: payload.id,
        username: payload.username,
        role: payload.role,
        name: payload.name,
        organizationId: payload.organizationId,
      },
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: 'Token验证失败' };
  }
}

export function authenticate(request: NextRequest): AuthResult {
  const token = extractToken(request);
  if (!token) {
    return { success: false, error: '未提供认证token' };
  }

  return verifyToken(token);
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = authenticate(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      );
    }

    return handler(request, authResult.user!);
  };
}

export function requireRole(allowedRoles: string[]) {
  return function(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const authResult = authenticate(request);

      if (!authResult.success) {
        return NextResponse.json(
          { error: authResult.error || '认证失败' },
          { status: 401 }
        );
      }

      const user = authResult.user!;
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: '权限不足' },
          { status: 403 }
        );
      }

      return handler(request, user);
    };
  };
}
