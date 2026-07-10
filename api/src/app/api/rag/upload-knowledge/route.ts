import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getUploadWebhookUrl() {
  return (
    process.env.N8N_RAG_UPLOAD_WEBHOOK ||
    `${(process.env.N8N_PUBLIC_URL || 'http://localhost:5678').replace(/\/$/, '')}/webhook/rag-upload-knowledge`
  );
}

export async function POST(request: NextRequest) {
  try {
    const incoming = await request.formData();
    const outgoing = new FormData();

    incoming.forEach((value, key) => {
      outgoing.append(key, value);
    });

    const response = await fetch(getUploadWebhookUrl(), {
      method: 'POST',
      body: outgoing,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : { success: response.ok, message: await response.text() };

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error('[rag/upload-knowledge] failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload knowledge.',
      },
      { status: 500 }
    );
  }
}
