import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadFile } from '@/lib/fileUpload';
import JSZip from 'jszip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TABLE = 'picturebook_knowledge';
const MAX_BYTES = 20 * 1024 * 1024;

function getUploadWebhookUrl() {
  return (
    process.env.N8N_RAG_UPLOAD_WEBHOOK ||
    `${(process.env.N8N_API_BASE_URL || process.env.N8N_PUBLIC_URL || 'http://117.50.218.161:5678').replace(/\/$/, '')}/webhook/rag-upload-knowledge`
  );
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractDocxText(documentXml: string) {
  const paragraphs = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  return paragraphs
    .map((paragraph) => {
      const withBreaks = paragraph
        .replace(/<w:tab\s*\/>/g, ' ')
        .replace(/<w:br\s*\/>/g, '\n');
      const textParts: string[] = [];
      const textRunPattern = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
      let match = textRunPattern.exec(withBreaks);
      while (match) {
        textParts.push(decodeXmlEntities(match[1] || ''));
        match = textRunPattern.exec(withBreaks);
      }
      return textParts.join('').replace(/\u0000/g, '').trim();
    })
    .filter(Boolean)
    .join('\n');
}

async function extractFileText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === 'docx') {
    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');
    if (!documentXml) throw new Error('Invalid DOCX: word/document.xml not found.');
    return extractDocxText(documentXml);
  } else if (ext === 'pdf') {
    const { default: pdfParse } = await import('pdf-parse');
    const data = await pdfParse(buffer);
    return (data.text || '').trim();
  } else if (ext === 'txt') {
    return buffer.toString('utf-8').trim();
  }
  throw new Error(`Unsupported file type: .${ext}`);
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      document_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'general',
      age_range TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL DEFAULT 'text',
      filename TEXT NOT NULL DEFAULT '',
      oss_url TEXT NOT NULL DEFAULT '',
      chunk_count INTEGER NOT NULL DEFAULT 0,
      uploaded_by TEXT NOT NULL DEFAULT 'anonymous',
      uploader_name TEXT NOT NULL DEFAULT '',
      qdrant_collection TEXT NOT NULL DEFAULT 'picturebook_knowledge',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Add oss_url column if missing (for existing tables)
  try {
    await db.query(`ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS oss_url TEXT NOT NULL DEFAULT ''`);
  } catch {
    // ignore
  }
}

export async function POST(request: NextRequest) {
  try {
    const incoming = await request.formData();

    // Extract metadata
    const title = String(incoming.get('title') || '');
    const category = String(incoming.get('category') || 'general');
    const ageRange = String(incoming.get('ageRange') || '');
    const uploadedBy = String(incoming.get('userId') || 'anonymous');
    const uploaderName = String(incoming.get('uploaderName') || '');
    const file = incoming.get('file');
    const fileText = String(incoming.get('text') || '').trim();

    let extractedText = fileText;
    let sourceType = 'text';
    let filename = '';
    let ossUrl = '';

    if (file instanceof File) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ success: false, error: 'File too large. Max 20MB.' }, { status: 413 });
      }
      sourceType = file.name.split('.').pop()?.toLowerCase() || 'file';
      filename = file.name;

      // Upload original file to OSS
      try {
        ossUrl = await uploadFile(file, 'picturebook-knowledge', filename);
      } catch (ossErr) {
        console.error('[rag/upload-knowledge] OSS upload failed (non-fatal):', ossErr);
      }

      // Extract text for n8n processing
      extractedText = await extractFileText(file);
    }

    if (!extractedText || !extractedText.trim()) {
      return NextResponse.json({ success: false, error: 'No text content found.' }, { status: 422 });
    }

    // Send extracted text to n8n (no file, no callback needed)
    const outgoing = new FormData();
    outgoing.append('text', extractedText);
    outgoing.append('userId', uploadedBy);
    outgoing.append('uploaderName', uploaderName);
    outgoing.append('title', title);
    outgoing.append('category', category);
    outgoing.append('ageRange', ageRange);
    outgoing.append('sourceType', sourceType);
    outgoing.append('filename', filename);
    outgoing.append('visibility', 'private');

    const response = await fetch(getUploadWebhookUrl(), {
      method: 'POST',
      body: outgoing,
    });

    const contentType = response.headers.get('content-type') || '';
    let payload: any;
    if (contentType.includes('application/json')) {
      const respText = await response.text();
      payload = respText ? JSON.parse(respText) : { success: response.ok };
    } else {
      const respText = await response.text();
      payload = { success: response.ok, message: respText || 'No response body' };
    }

    // Save metadata to PostgreSQL
    if (payload && payload.success !== false) {
      try {
        await ensureTable();
        const documentId = payload.documentId || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const chunkCount = payload.chunkCount || 0;
        const collection = payload.collection || 'picturebook_knowledge';

        await db.query(
          `INSERT INTO ${TABLE} (document_id, title, category, age_range, source_type, filename, oss_url, chunk_count, uploaded_by, uploader_name, qdrant_collection)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (document_id) DO UPDATE SET
             title = EXCLUDED.title,
             category = EXCLUDED.category,
             age_range = EXCLUDED.age_range,
             source_type = EXCLUDED.source_type,
             filename = EXCLUDED.filename,
             oss_url = EXCLUDED.oss_url,
             chunk_count = EXCLUDED.chunk_count,
             uploader_name = EXCLUDED.uploader_name,
             updated_at = NOW()`,
          [documentId, title, category, ageRange, sourceType, filename, ossUrl, chunkCount, uploadedBy, uploaderName, collection]
        );
      } catch (dbErr) {
        console.error('[rag/upload-knowledge] save metadata failed (non-fatal):', dbErr);
      }
    }

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
