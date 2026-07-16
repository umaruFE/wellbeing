import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TABLE = 'picturebook_knowledge';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 先查出来拿 document_id 和 collection
    const rows = await db.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
    if (rows.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Knowledge record not found.' },
        { status: 404 }
      );
    }

    const record = rows.rows[0];

    // 删除 Qdrant 中的 points（按 document_id filter）
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    const qdrantCollection = record.qdrant_collection || 'picturebook_knowledge';
    const qdrantApiKey = process.env.QDRANT_API_KEY || '';

    try {
      await fetch(
        `${qdrantUrl}/collections/${qdrantCollection}/points/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(qdrantApiKey ? { 'api-key': qdrantApiKey } : {}),
          },
          body: JSON.stringify({
            filter: {
              must: [{ key: 'documentId', match: { value: record.document_id } }],
            },
          }),
        }
      );
    } catch (qdrantErr) {
      console.error('[rag/knowledge] Qdrant delete failed (non-fatal):', qdrantErr);
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
