import { db } from '@/lib/db';

async function insert(table: string, data: Record<string, unknown>) {
  const { data: result, error } = await db.from(table).insert(data).select('id').single();
  return { data: result, error };
}

async function select(table: string, params: { filters?: Record<string, unknown>; orderBy?: string; ascending?: boolean; limit?: number } = {}) {
  let query = db.from(table).select('*');
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }
  if (params.orderBy) {
    query = query.order(params.orderBy, { ascending: params.ascending ?? false });
  }
  if (params.limit) {
    query = query.range(0, params.limit - 1);
  }
  const { data, error } = await query;
  return { data, error };
}

export async function POST(request: Request) {
  try {
    const { user_id, element_type, original_prompt, optimized_prompt, improvement_score } = await request.json();

    // Handle user_id type conversion
    // If user_id is numeric or invalid, set to null to avoid foreign key constraint errors
    let processed_user_id = user_id;
    if (typeof user_id === 'number' || (typeof user_id === 'string' && !isNaN(user_id) && user_id !== '')) {
      // Numeric user_id - set to null since we don't have a real user record
      processed_user_id = null;
    }

    const { data, error } = await insert('prompt_optimizations', {
      user_id: processed_user_id,
      element_type,
      original_prompt,
      optimized_prompt,
      improvement_score,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error saving prompt optimization:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ id: data.id }), { status: 201 });
  } catch (error) {
    console.error('Error in prompt optimization API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const element_type = searchParams.get('element_type');

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
    }

    // Handle user_id type conversion
    // If user_id is numeric or invalid, set to null to avoid foreign key constraint errors
    let processed_user_id = user_id;
    if (typeof user_id === 'string' && !isNaN(parseInt(user_id)) && user_id !== '') {
      // Numeric user_id - set to null since we don't have a real user record
      processed_user_id = null;
    }

    const filters: any = { user_id: processed_user_id };
    if (element_type) {
      filters.element_type = element_type;
    }

    const { data, error } = await select('prompt_optimizations', {
      filters,
      orderBy: 'usage_count',
      ascending: false
    });

    if (error) {
      console.error('Error fetching prompt optimizations:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Error in prompt optimization GET:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, improvement_score } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'id is required' }), { status: 400 });
    }
    const { data, error } = await db
      .from('prompt_optimizations')
      .update({ improvement_score, updated_at: new Date().toISOString() })
      .eq('id', id)
      .single();
    if (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
    }
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Error in prompt optimization PUT:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
