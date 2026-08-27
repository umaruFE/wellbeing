import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isRagflowEnabled, ensureDataset, documents as ragflowDocs } from '@/lib/ragflow/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TABLE = 'picturebook_knowledge';
const RAGFLOW_DATASET_NAME = process.env.RAGFLOW_PICTUREBOOK_DATASET || 'picturebook-knowledge';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 先查出来拿 document_id
    const rows = await db.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
    if (rows.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Knowledge record not found.' },
        { status: 404 }
      );
    }

    const record = rows.rows[0];

    // 删除 RAGFlow 中的对应文档（启用且已同步过时）
    if (isRagflowEnabled() && record.ragflow_document_id) {
      try {
        const datasetId = await ensureDataset(RAGFLOW_DATASET_NAME);
        await ragflowDocs.delete(datasetId, [record.ragflow_document_id]);
      } catch (rfErr) {
        console.error('[rag/knowledge] RAGFlow delete failed (non-fatal):', rfErr);
      }
    }

    // 删除数据库记录
    await db.query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[rag/knowledge] DELETE failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete knowledge.' },
      { status: 500 }
    );
  }
}
