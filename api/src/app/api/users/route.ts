import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const accountFields = 'id,email,name,role,organization_id,created_at';

function requireAccountAdmin(request: NextRequest) {
  const auth = authenticate(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (auth.user?.role !== 'super_admin') {
    return NextResponse.json({ error: '无权管理账号' }, { status: 403 });
  }
  return null;
}

// GET /api/users - Get users
export async function GET(request: NextRequest) {
  try {
    const denied = requireAccountAdmin(request);
    if (denied) return denied;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search');

    let query = db
      .from('users')
      .select(`${accountFields}, organization:organizations(*)`)
      .order('users.created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const denied = requireAccountAdmin(request);
    if (denied) return denied;
    const body = await request.json();
    const { email, name, role, organizationId } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'email 和 name 必填' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash('TempPassword123!', 10);

    const { data: userData, error } = await db
      .from('users')
      .insert({
        email,
        name,
        role: role || 'creator',
        organization_id: organizationId || null,
        password_hash: passwordHash,
      })
      .select(accountFields)
      .single();

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data: userData }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

