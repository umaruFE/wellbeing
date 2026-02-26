import { supabase } from '../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { user_id, element_type, original_prompt, optimized_prompt, improvement_score } = await request.json();

    const { data, error } = await supabase
      .from('prompt_optimizations')
      .insert({
        user_id,
        element_type,
        original_prompt,
        optimized_prompt,
        improvement_score
      })
      .select('id')
      .single();

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

    let query = supabase
      .from('prompt_optimizations')
      .select('*')
      .eq('user_id', user_id)
      .order('usage_count', { ascending: false });

    if (element_type) {
      query = query.eq('element_type', element_type);
    }

    const { data, error } = await query;

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

    const { data, error } = await supabase
      .from('prompt_optimizations')
      .update({ improvement_score, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
      .single();

    if (error) {
      console.error('Error updating prompt optimization:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ id: data.id }), { status: 200 });
  } catch (error) {
    console.error('Error in prompt optimization PUT:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
