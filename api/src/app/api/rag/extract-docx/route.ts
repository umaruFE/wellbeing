import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export const runtime = 'nodejs';

const MAX_BYTES = 20 * 1024 * 1024;

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

async function extractDocx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) {
    throw new Error('Invalid DOCX: word/document.xml was not found.');
  }
  return extractDocumentText(documentXml);
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const { default: pdfParse } = await import('pdf-parse');
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
}

function getExt(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : '';
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

    const filename = file.name || String(formData.get('filename') || 'uploaded');
    const ext = getExt(filename);

    if (!['docx', 'pdf', 'txt'].includes(ext)) {
      return NextResponse.json(
        { success: false, error: 'Only .docx, .pdf, and .txt files are supported.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File is too large. Max size is 20MB.' },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text: string;

    if (ext === 'docx') {
      text = await extractDocx(buffer);
    } else if (ext === 'pdf') {
      text = await extractPdf(buffer);
    } else {
      // txt
      text = buffer.toString('utf-8');
    }

    text = text.trim();
    if (!text) {
      return NextResponse.json(
        { success: false, error: 'No readable text was found in the file.' },
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
    console.error('[rag/extract] failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to extract text.' },
      { status: 500 }
    );
  }
}
