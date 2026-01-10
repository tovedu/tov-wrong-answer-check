import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { student_id, week, session, question_id, is_wrong } = body;

        if (!student_id || !week || !session || !question_id || is_wrong === undefined) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const baseUrl = new URL(request.url).origin;

        const res = await fetch(`${baseUrl}/api/gas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'upsertAnswer',
                student_id,
                week,
                session,
                question_id,
                is_wrong
            }),
            cache: 'no-store'
        });

        if (!res.ok) throw new Error('Failed to upsert answer');

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to upsert answer' }, { status: 500 });
    }
}
