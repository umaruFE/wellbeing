import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export const runtime = 'nodejs';

const MAX_DOCX_BYTES = 20 * 1024 * 1024;

function decodeXmlEntities(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractDocumentText(documentXml: string) {
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
      const textRuns = textParts.join('');
      return textRuns.replace(/\u0000/g, '').trim();
    })
    .filter(Boolean)
    .join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Missing multipart file field named file.' },
        { status: 400 }
      );
    }

    const filename = file.name || String(formData.get('filename') || 'uploaded.docx');
    if (!filename.toLowerCase().endsWith('.docx')) {
      return NextResponse.json(
        { success: false, error: 'Only .docx files are supported.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_DOCX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'DOCX file is too large. Max size is 20MB.' },
        { status: 413 }
      );
    }

    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const documentXml = await zip.file('word/document.xml')?.async('string');

    if (!documentXml) {
      return NextResponse.json(
        { success: false, error: 'Invalid DOCX: word/document.xml was not found.' },
        { status: 400 }
      );
    }

    const text = extractDocumentText(documentXml);
    if (!text) {
      return NextResponse.json(
        { success: false, error: 'No readable text was found in the DOCX file.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      filename,
      text,
      charCount: text.length,
    });
  } catch (error) {
    console.error('[rag/extract-docx] failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to extract DOCX text.' },
      { status: 500 }
    );
  }
}
