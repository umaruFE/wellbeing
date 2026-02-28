import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/textbooks - Get textbook types, grades, and units
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'types', 'grades', 'units'
    const textbookTypeId = searchParams.get('textbookTypeId');
    const gradeId = searchParams.get('gradeId');

    if (type === 'types') {
      // Get all textbook types
      const { data, error } = await db
        .from('textbook_types')
        .select('*')
        .order('name');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Get children for each type
      const typesWithChildren = await Promise.all(
        (data || []).asyncForEach(async (t) => {
          const { data: grades } = await db
            .from('textbook_units')
            .select('grade_id, grades(*)')
            .eq('textbook_type_id', t.id)
            .distinct('grade_id');

          const { data: units } = await db
            .from('textbook_units')
            .select('*')
            .eq('textbook_type_id', t.id);

          const gradeIds = [...new Set((grades || []).map(g => g.grade_id).filter(Boolean))];
          const { data: gradeDetails } = gradeIds.length > 0
            ? await db.from('grades').select('*').in('id', gradeIds)
            : { data: [] };

          return {
            ...t,
            children: (gradeDetails || []).map(g => ({
              ...g,
              children: units?.filter(u => u.grade_id === g.id) || []
            }))
          };
        })
      );

      return NextResponse.json({ data: typesWithChildren });
    }

    if (type === 'grades') {
      const { data, error } = await db
        .from('grades')
        .select('*')
        .order('display_order');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    if (type === 'units') {
      let query = db
        .from('textbook_units')
        .select(`
          *,
          textbook_type:textbook_types(*),
          grade:grades(*),
          images:textbook_images(*)
        `);

      if (textbookTypeId) {
        query = query.eq('textbook_type_id', textbookTypeId);
      }
      if (gradeId) {
        query = query.eq('grade_id', gradeId);
      }

      const { data, error } = await query.order('created_at');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Default: return all textbooks with hierarchy
    const { data: textbookTypes, error: typesError } = await db
      .from('textbook_types')
      .select('*')
      .order('name');

    if (typesError) {
      return NextResponse.json({ error: typesError.message }, { status: 500 });
    }

    const { data: allUnits, error: unitsError } = await db
      .from('textbook_units')
      .select(`
        *,
        grade:grades(*),
        images:textbook_images(*)
      `);

    if (unitsError) {
      return NextResponse.json({ error: unitsError.message }, { status: 500 });
    }

    const { data: allGrades, error: gradesError } = await db
      .from('grades')
      .select('*')
      .order('display_order');

    if (gradesError) {
      return NextResponse.json({ error: gradesError.message }, { status: 500 });
    }

    // Build hierarchy
    const result = (textbookTypes || []).map(tt => ({
      id: tt.id,
      name: tt.name,
      type: tt.name,
      children: (allGrades || []).map(g => {
        const gradeUnits = (allUnits || []).filter(u => 
          u.textbook_type_id === tt.id && u.grade_id === g.id
        );
        return {
          id: g.id,
          name: g.name,
          grade: g.name,
          children: gradeUnits
        };
      }).filter(g => g.children.length > 0)
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching textbooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper for async forEach
Array.prototype.asyncForEach = function (callback) {
  return new Promise((resolve) => {
    this.forEach(async (item, index) => {
      await callback(item, index, this);
      if (index === this.length - 1) {
        resolve();
      }
    });
  });
};

// POST /api/textbooks - Create textbook type, grade, or unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'type') {
      // Create textbook type
      const { data: result, error } = await db
        .from('textbook_types')
        .insert({ name: data.name, description: data.description })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data: result }, { status: 201 });
    }

    if (action === 'unit') {
      // Create textbook unit
      const { data: result, error } = await db
        .from('textbook_units')
        .insert({
          textbook_type_id: data.textbookTypeId,
          grade_id: data.gradeId,
          name: data.name,
          unit_code: data.unitCode,
          keywords: data.keywords
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data: result }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error creating textbook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

