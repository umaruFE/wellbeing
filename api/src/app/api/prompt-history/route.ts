import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { user_id, organization_id, prompt_type, original_prompt, generated_result, execution_time, success, error_message } = await request.json();

    let processed_user_id = user_id;
    if (typeof user_id === 'number' || (typeof user_id === 'string' && !isNaN(Number(user_id)) && user_id !== '')) {
      processed_user_id = null;
    }

    const { data, error } = await db.from('prompt_history').insert({
      user_id: processed_user_id,
      organization_id,
      prompt_type,
      original_prompt,
      generated_result,
      execution_time,
      success,
      error_message
    }).select().single();

    if (error) {
      console.error('Error saving prompt history:', error);
      return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
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

    let processed_user_id = user_id;
    if (!isNaN(Number(user_id))) {
      processed_user_id = user_id;
    }

    const query = db
      .from('prompt_history')
      .select('*', { count: 'exact' })
      .eq('user_id', processed_user_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prompt history:', error);
      return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Error in prompt history GET:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
