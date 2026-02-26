import { supabase } from '../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { user_id, prompt_type, original_prompt, generated_result, execution_time, success, error_message } = await request.json();

    const { data, error } = await supabase
      .from('prompt_history')
      .insert({
        user_id,
        prompt_type,
        original_prompt,
        generated_result,
        execution_time,
        success,
        error_message
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving prompt history:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ id: data.id }), { status: 201 });
  } catch (error) {
    console.error('Error in prompt history API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const prompt_type = searchParams.get('prompt_type');
    const limit = searchParams.get('limit') || '10';

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
    }

    let query = supabase
      .from('prompt_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (prompt_type) {
      query = query.eq('prompt_type', prompt_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prompt history:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Error in prompt history GET:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
