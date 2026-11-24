import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';

function requireOrganizationAdmin(request: NextRequest) {
  const auth = authenticate(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (auth.user?.role !== 'super_admin') {
    return NextResponse.json({ error: '无权管理机构' }, { status: 403 });
  }
  return null;
}

// GET /api/organizations - Get organizations
export async function GET(request: NextRequest) {
  try {
    const denied = requireOrganizationAdmin(request);
    if (denied) return denied;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const { rows } = await db.query(
      `SELECT o.*, (SELECT COUNT(*)::int FROM users u WHERE u.organization_id = o.id) AS account_count
       FROM organizations o
       ${search ? 'WHERE o.name ILIKE $1' : ''}
       ORDER BY o.created_at DESC`,
      search ? [`%${search}%`] : [],
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create organization
export async function POST(request: NextRequest) {
  try {
    const denied = requireOrganizationAdmin(request);
    if (denied) return denied;
    const body = await request.json();
    const { name, code, totalHours } = body;

    const { data, error } = await db
      .from('organizations')
      .insert({
        name,
        code,
        total_hours: totalHours || 0,
        used_hours: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations - Update organization (e.g., set hours)
export async function PUT(request: NextRequest) {
  try {
    const denied = requireOrganizationAdmin(request);
    if (denied) return denied;
    const body = await request.json();
    const { id, totalHours, ...updateData } = body;

    const { data, error } = await db
      .from('organizations')
      .update({
        ...updateData,
        total_hours: totalHours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

