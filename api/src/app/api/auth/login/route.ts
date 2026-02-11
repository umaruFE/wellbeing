import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL || 'https://plbkvhmumamkainkzxng.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;

if (supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 如果 Supabase 未配置，使用模拟数据
    if (!supabase) {
      console.log('Supabase not configured, using mock data for login');
      
      const mockUsers = {
        'admin': { 
          id: 1, 
          username: 'admin', 
          role: 'super_admin', 
          name: '超级管理员', 
          organizationId: null 
        },
        'org_admin': { 
          id: 2, 
          username: 'org_admin', 
          role: 'org_admin', 
          name: '机构管理员', 
          organizationId: 1, 
          organizationName: '测试机构' 
        },
        'research_leader': { 
          id: 3, 
          username: 'research_leader', 
          role: 'research_leader', 
          name: '教研组长', 
          organizationId: 1, 
          organizationName: '测试机构' 
        },
        'creator': { 
          id: 4, 
          username: 'creator', 
          role: 'creator', 
          name: '课件制作人', 
          organizationId: 1, 
          organizationName: '测试机构' 
        },
        'viewer': { 
          id: 5, 
          username: 'viewer', 
          role: 'viewer', 
          name: '普通老师', 
          organizationId: 1, 
          organizationName: '测试机构' 
        }
      };

      const user = mockUsers[username];
      
      if (user && password === '123456') {
        const token = `mock_token_${Date.now()}`;
        return NextResponse.json({
          user,
          token,
          message: '登录成功（模拟模式）'
        });
      } else {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        );
      }
    }

    // 使用 Supabase 认证
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: username,
      password: password
    });

    if (authError) {
      // 尝试查找用户名对应的邮箱
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError || !users) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 401 }
        );
      }

      // 使用用户邮箱登录
      const { data: emailLoginData, error: emailLoginError } = await supabase.auth.signInWithPassword({
        email: users.email,
        password: password
      });

      if (emailLoginError) {
        return NextResponse.json(
          { error: '密码错误' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        user: {
          id: users.id,
          username: users.username,
          role: users.role,
          name: users.name,
          organizationId: users.organization_id
        },
        token: emailLoginData.session.access_token
      });
    }

    // 获取用户详细信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      return NextResponse.json({
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: 'viewer'
        },
        token: authData.session.access_token
      });
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role || 'viewer',
        name: userData.name || userData.username,
        organizationId: userData.organization_id
      },
      token: authData.session.access_token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登录失败，请重试' },
      { status: 500 }
    );
  }
}

